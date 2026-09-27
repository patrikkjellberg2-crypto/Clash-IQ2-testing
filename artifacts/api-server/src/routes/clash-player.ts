import { Router, type IRouter } from "express";
import type { ClashRecord } from "../lib/clash-types";
import { normalizeClanTag, normalizeAttackerTag } from "../lib/clash-tags";
import { listItems } from "../lib/war-normalize";
import { getActiveClanTag } from "../lib/clan-selection";
import { fetchClashResource, fetchOptionalResource } from "../lib/clash-fetch";
import { recoverHistoricalWars } from "../lib/historical-war-recovery";
import { fetchClashOfStatsHistory } from "../lib/clashofstats";
import { listArchivedWars, getPlayerWarHistory } from "../lib/war-archive";

const router: IRouter = Router();

/* -------------------------------------------------------------------------- */
/* Player                                                                     */
/* -------------------------------------------------------------------------- */

router.get(
  "/clash/player/:tag",
  async (req, res): Promise<void> => {
    const tag = normalizeClanTag(
      decodeURIComponent(req.params.tag),
    );

    try {
      const clanTag = await getActiveClanTag();
      const encodedTag = encodeURIComponent(tag);

      // The official player endpoint can occasionally hang or return a
      // transient 404/5xx. Player Intelligence must not become unusable just
      // because that live source is unavailable: Clash IQ already has the
      // player's archived war records in PostgreSQL.
      let player: ClashRecord | null = null;

      if (process.env.CLASH_API_TOKEN) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4_000);

        try {
          const livePlayer = await fetchClashResource(
            `/players/${encodedTag}`,
            controller.signal,
          );

          if (livePlayer && !Array.isArray(livePlayer)) {
            player = livePlayer;
          }
        } catch (error) {
          req.log.warn(
            { error, tag },
            "Official Clash player endpoint unavailable; using archive fallback",
          );
        } finally {
          clearTimeout(timeout);
        }
      }

      // Player history is database-first. Warm the persistent archive only
      // when needed so a fresh TEST database can still recover history.
      let archivedWars = await listArchivedWars(clanTag, 60);
      let archivedPlayer: ClashRecord | null = null;

      const findArchivedPlayer = () => {
        for (const war of archivedWars) {
          const members = Array.isArray(war.members)
            ? (war.members as ClashRecord[])
            : [];

          const member = members.find(
            (m) =>
              normalizeAttackerTag(String(m.tag ?? "")) === tag,
          );

          if (member) return member;
        }

        return null;
      };

      archivedPlayer = findArchivedPlayer();

      // If the individual player endpoint is unavailable, use the live clan
      // roster as a second live fallback. The roster contains the core player
      // identity fields and keeps Player Intelligence navigable; the richer
      // player endpoint is still preferred whenever it succeeds.
      if (!player && process.env.CLASH_API_TOKEN) {
        const rosterResult = await fetchOptionalResource(
          `/clans/${encodeURIComponent(clanTag)}/members`,
          [],
          req.log,
        );
        const roster = listItems(rosterResult.data);
        const rosterPlayer = roster.find(
          (m) => normalizeAttackerTag(String(m.tag ?? "")) === tag,
        );
        if (rosterPlayer) {
          player = {
            ...rosterPlayer,
            _clashIqSource: "official-clan-roster",
          };
        }
      }

      if (!player && !archivedPlayer) {
        await recoverHistoricalWars(clanTag, req.log, 15);
        archivedWars = await listArchivedWars(clanTag, 60);
        archivedPlayer = findArchivedPlayer();
      }

      if (!player) {
        if (!archivedPlayer) {
          res.status(404).json({
            error: "Player not found in Clash IQ's live or archived data.",
            code: "PLAYER_NOT_FOUND",
          });
          return;
        }

        player = {
          tag,
          name: archivedPlayer.name ?? tag,
          townHallLevel: archivedPlayer.townhallLevel ?? null,
          expLevel: archivedPlayer.expLevel ?? null,
          role: archivedPlayer.role ?? null,
          attacks: Array.isArray(archivedPlayer.attacks)
            ? archivedPlayer.attacks
            : [],
          _clashIqSource: "persistent-war-archive",
        };
      }

      const archivedHistory = await getPlayerWarHistory(clanTag, tag, 50);
      const recentActivityWars = archivedHistory.slice(0, 10);
      const participatedWars = recentActivityWars.filter((war) => war.attacks.length > 0).length;
      const possibleAttacks = recentActivityWars.reduce(
        (sum, war) => sum + (war.teamSize ? 2 : 2),
        0,
      );
      const usedAttacks = recentActivityWars.reduce(
        (sum, war) => sum + war.attacks.length,
        0,
      );
      const warParticipationRate = recentActivityWars.length
        ? Math.round((participatedWars / recentActivityWars.length) * 100)
        : 0;
      const attackUtilizationRate = possibleAttacks
        ? Math.round(Math.min(100, (usedAttacks / possibleAttacks) * 100))
        : 0;
      const activityScore = Math.round(
        warParticipationRate * 0.45 + attackUtilizationRate * 0.55,
      );
      const activityLabel =
        activityScore >= 85 ? "Very active" :
        activityScore >= 65 ? "Active" :
        activityScore >= 40 ? "Occasionally active" :
        "Low activity";

      const activity = {
        score: activityScore,
        label: activityLabel,
        windowWars: recentActivityWars.length,
        participatedWars,
        participationRate: warParticipationRate,
        attacksUsed: usedAttacks,
        attacksPossible: possibleAttacks,
        attackUtilizationRate,
        basis: "last 10 completed wars",
      };

      const clashOfStatsHistory = await fetchClashOfStatsHistory(tag);
      if (archivedHistory.length > 0) {
        const allAttacks = archivedHistory.flatMap((war) => war.attacks);
        const totalAttacks = allAttacks.length;
        const totalStars = allAttacks.reduce((sum, attack) => sum + Number(attack.stars ?? 0), 0);
        const totalDestruction = allAttacks.reduce((sum, attack) => sum + Number(attack.destructionPercentage ?? 0), 0);
        const threeStarAttacks = allAttacks.filter((attack) => Number(attack.stars ?? 0) >= 3).length;
        const oneStarOrLess = allAttacks.filter((attack) => Number(attack.stars ?? 0) <= 1).length;
        const maxDestruction = allAttacks.reduce((max, attack) => Math.max(max, Number(attack.destructionPercentage ?? 0)), 0);
        const missedWars = archivedHistory.filter((war) => war.attacks.length === 0).length;

        res.json({
          ...player,
          historicalWarStats: {
            wars: archivedHistory.length,
            totalAttacks,
            totalStars,
            averageStarsPerAttack: totalAttacks ? totalStars / totalAttacks : 0,
            averageDestruction: totalAttacks ? totalDestruction / totalAttacks : 0,
            maxDestruction,
            threeStarAttacks,
            oneStarOrLess,
            missedWars,
            recentWars: archivedHistory.slice(0, 20).map((war) => ({
              endTime: war.endTime,
              result: war.won === "win" ? "won" : war.won === "lose" ? "lost" : war.won === "tie" ? "draw" : null,
              opponentName: war.opponentName,
              attacks: war.attacks,
            })),
          },
          clashOfStatsHistory,
          activity,
        });
        return;
      }

      const warlog =
        await fetchOptionalResource(
          `/clans/${encodeURIComponent(
            clanTag,
          )}/warlog`,
          [],
          req.log,
        );

      const history = listItems(
        warlog.data,
      );

      const wars: ClashRecord[] = [];

      let totalAttacks = 0;
      let totalStars = 0;
      let totalDestruction = 0;
      let threeStarAttacks = 0;
      let oneStarOrLess = 0;
      let maxDestruction = 0;
      let missedWars = 0;

      for (const war of history) {
        const clan =
          war &&
          typeof war === "object"
            ? (war as ClashRecord).clan
            : null;

        const members =
          Array.isArray(
            (clan as ClashRecord | null)
              ?.members,
          )
            ? ((clan as ClashRecord)
                .members as ClashRecord[])
            : [];

        const member =
          members.find(
            (m) =>
              normalizeAttackerTag(
                String(m.tag ?? ""),
              ) === tag,
          );

        if (!member) continue;

        const attacks =
          Array.isArray(member.attacks)
            ? (member.attacks as ClashRecord[])
            : [];

        const stars =
          attacks.reduce(
            (sum, attack) =>
              sum +
              Number(
                attack.stars ?? 0,
              ),
            0,
          );

        const destruction =
          attacks.reduce(
            (sum, attack) =>
              sum +
              Number(
                attack.destructionPercentage ??
                  0,
              ),
            0,
          );

        totalAttacks += attacks.length;
        totalStars += stars;
        totalDestruction += destruction;

        threeStarAttacks +=
          attacks.filter(
            (attack) =>
              Number(
                attack.stars ?? 0,
              ) >= 3,
          ).length;

        oneStarOrLess +=
          attacks.filter(
            (attack) =>
              Number(
                attack.stars ?? 0,
              ) <= 1,
          ).length;

        maxDestruction = Math.max(
          maxDestruction,
          ...attacks.map(
            (attack) =>
              Number(
                attack.destructionPercentage ??
                  0,
              ),
          ),
          0,
        );

        if (attacks.length === 0) {
          missedWars += 1;
        }

        wars.push({
          endTime:
            war.endTime ??
            war.startTime ??
            null,
          result:
            war.result ?? null,
          opponentName:
            (
              war.opponent as
                | ClashRecord
                | undefined
            )?.name ?? null,
          opponentStars:
            (
              war.opponent as
                | ClashRecord
                | undefined
            )?.stars ?? null,
          clanStars:
            (
              war.clan as
                | ClashRecord
                | undefined
            )?.stars ?? null,
          attacks,
        });
      }

      res.json({
        ...player,
        historicalWarStats: {
          wars: wars.length,
          totalAttacks,
          totalStars,
          averageStarsPerAttack:
            totalAttacks
              ? totalStars /
                totalAttacks
              : 0,
          averageDestruction:
            totalAttacks
              ? totalDestruction /
                totalAttacks
              : 0,
          maxDestruction,
          threeStarAttacks,
          oneStarOrLess,
          missedWars,
          recentWars:
            wars.slice(0, 20),
        },
        clashOfStatsHistory,
      });
    } catch (error) {
      req.log.warn(
        {
          tag,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStatus:
            typeof error === "object" && error !== null && "status" in error
              ? (error as { status?: unknown }).status
              : undefined,
        },
        "Player Intelligence request failed",
      );

      res.status(503).json({
        error:
          "Could not load Player Intelligence from live or archived data.",
        code: "PLAYER_FETCH_FAILED",
      });
    }
  },
);

export default router;
