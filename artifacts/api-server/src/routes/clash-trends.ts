import { Router, type IRouter } from "express";
import { getActiveClanTag } from "../lib/clan-selection";
import { normalizeAttackerTag } from "../lib/clash-tags";
import {
  getPlayerWarHistory,
  listArchivedWars,
  listPlayerPerformance,
} from "../lib/war-archive";

const router: IRouter = Router();
const MAX_WARS = 60;

function clampWars(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(MAX_WARS, Math.max(3, Math.round(parsed)));
}

router.get("/clash/trends/clan", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const wars = await listArchivedWars(clanTag, clampWars(req.query.wars));

    res.json({
      clanTag,
      wars: [...wars].reverse().map((war) => ({
        warId: war.id,
        endTime: war.endTime,
        opponentName: war.opponentName,
        result: war.result,
        ourStars: war.clanStars,
        ourDestruction: war.clanDestruction,
        opponentStars: war.opponentStars,
        opponentDestruction: war.opponentDestruction,
        teamSize: war.teamSize,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to load clan trend data");
    res.status(503).json({
      error: "Could not load clan trends.",
      code: "CLAN_TRENDS_FAILED",
    });
  }
});

router.get("/clash/trends/movers", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const players = await listPlayerPerformance(clanTag);

    res.json({
      clanTag,
      players: players.map((player) => ({
        playerTag: player.playerTag,
        playerName: player.playerName,
        trend: player.trend,
        recentAvgStars: player.recentAvgStars,
        previousAvgStars: player.previousAvgStars,
        recentAvgDestruction: player.recentAvgDestruction,
        previousAvgDestruction: player.previousAvgDestruction,
        warsCounted: player.warsCounted,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to load trend movers");
    res.status(503).json({
      error: "Could not load player movers.",
      code: "TREND_MOVERS_FAILED",
    });
  }
});

router.get("/clash/trends/player/:tag", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const playerTag = normalizeAttackerTag(decodeURIComponent(req.params.tag));
    const history = await getPlayerWarHistory(
      clanTag,
      playerTag,
      clampWars(req.query.wars),
    );

    res.json({
      clanTag,
      playerTag,
      wars: [...history].reverse().map((war) => {
        const attacks = war.attacks;
        const stars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
        const destruction = attacks.length
          ? attacks.reduce((sum, attack) => sum + attack.destructionPercentage, 0) /
            attacks.length
          : 0;

        return {
          warId: war.warId,
          endTime: war.endTime,
          opponentName: war.opponentName,
          result: war.won,
          attacksUsed: attacks.length,
          stars,
          destruction: Math.round(destruction * 10) / 10,
        };
      }),
    });
  } catch (error) {
    req.log.error({ err: error, tag: req.params.tag }, "Failed to load player trend data");
    res.status(503).json({
      error: "Could not load player trends.",
      code: "PLAYER_TRENDS_FAILED",
    });
  }
});

export default router;
