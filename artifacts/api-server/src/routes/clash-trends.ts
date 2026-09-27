import { Router, type IRouter } from "express";
import { getActiveClanTag } from "../lib/clan-selection";
import { normalizeAttackerTag } from "../lib/clash-tags";
import {
  listArchivedWars,
  listPlayerPerformance,
  getPlayerWarHistory,
} from "../lib/war-archive";

const router: IRouter = Router();

/* -------------------------------------------------------------------------- */
/* Historical trends (charts)                                                 */
/*                                                                             */
/* Built entirely from data Clash IQ already persists in Postgres via         */
/* lib/war-archive.ts (snapshotCurrentWar / snapshotWarlog). No extra Clash    */
/* API calls are made here - this just reshapes stored wars into small,       */
/* chart-ready time series, oldest -> newest.                                 */
/* -------------------------------------------------------------------------- */

const MAX_WARS = 60;

function clampWars(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(MAX_WARS, Math.max(3, Math.round(parsed)));
}

/**
 * Clan-wide trend: one point per war (oldest first) with our stars/
 * destruction against the opponent's, plus the result. Powers the
 * "Clan war performance over time" chart on the Trends page.
 */
router.get("/clash/trends/clan", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const limit = clampWars(req.query.wars);

    const wars = await listArchivedWars(clanTag, limit);

    // listArchivedWars returns newest-first; charts read left-to-right as
    // oldest-to-newest, so reverse before sending.
    const series = [...wars].reverse().map((war) => ({
      warId: war.id,
      endTime: war.endTime,
      opponentName: war.opponentName,
      result: war.result,
      ourStars: war.clanStars,
      ourDestruction: war.clanDestruction,
      opponentStars: war.opponentStars,
      opponentDestruction: war.opponentDestruction,
      teamSize: war.teamSize,
    }));

    res.json({ clanTag, wars: series });
  } catch (error) {
    req.log.error({ err: error }, "Failed to load clan trend data");
    res.status(503).json({ error: "Could not load clan trends.", code: "CLAN_TRENDS_FAILED" });
  }
});

/**
 * Roster-wide "movers" list: who is trending up or down over their last 5
 * wars vs. the 5 before that. Reuses the same comparison already computed
 * for War Intelligence, just exposed as a compact list for the Trends page's
 * player picker (sorted so the biggest swings surface first).
 */
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
    res.status(503).json({ error: "Could not load player movers.", code: "TREND_MOVERS_FAILED" });
  }
});

/**
 * Per-player trend: one point per war the player took part in (oldest
 * first), with stars/destruction for that war's attacks. Powers the
 * "Player performance over time" chart once a player is selected.
 */
router.get("/clash/trends/player/:tag", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const playerTag = normalizeAttackerTag(decodeURIComponent(req.params.tag));
    const limit = clampWars(req.query.wars);

    const history = await getPlayerWarHistory(clanTag, playerTag, limit);

    const series = [...history].reverse().map((war) => {
      const attacks = war.attacks;
      const stars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
      const destruction = attacks.length
        ? attacks.reduce((sum, attack) => sum + attack.destructionPercentage, 0) / attacks.length
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
    });

    res.json({ clanTag, playerTag, wars: series });
  } catch (error) {
    req.log.error({ err: error, tag: req.params.tag }, "Failed to load player trend data");
    res.status(503).json({ error: "Could not load player trends.", code: "PLAYER_TRENDS_FAILED" });
  }
});

export default router;
