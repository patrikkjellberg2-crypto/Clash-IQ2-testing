import { Router, type IRouter } from "express";
import { getActiveClanTag } from "../lib/clan-selection";
import { recoverHistoricalWars } from "../lib/historical-war-recovery";
import {
  getArchivedWar,
  listArchivedWars,
  listPlayerWarStats,
  listPlayerPerformance,
} from "../lib/war-archive";

const router: IRouter = Router();

/* -------------------------------------------------------------------------- */
/* War archive (server-side history)                                         */
/* -------------------------------------------------------------------------- */

router.get("/clash/war-archive", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const limit = Number(req.query.limit);

    let [wars, players] = await Promise.all([
      listArchivedWars(clanTag, Number.isFinite(limit) ? limit : 60),
      listPlayerWarStats(clanTag),
    ]);

    // A fresh TEST database has no player stats yet. Recover recent completed
    // wars with full member/attack detail before returning the archive so
    // "Players tracked" and player history are populated on the first visit.
    if (players.length === 0) {
      await recoverHistoricalWars(clanTag, req.log, 15);
      [wars, players] = await Promise.all([
        listArchivedWars(clanTag, Number.isFinite(limit) ? limit : 60),
        listPlayerWarStats(clanTag),
      ]);
    }

    res.json({ clanTag, wars, players });
  } catch (error) {
    req.log.error({ err: error }, "Failed to load war archive");
    res.status(503).json({ error: "Could not load the war archive.", code: "WAR_ARCHIVE_FAILED" });
  }
});

router.get("/clash/war-intelligence", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const players = await listPlayerPerformance(clanTag);
    res.json({ clanTag, players });
  } catch (error) {
    req.log.error({ err: error }, "Failed to load war intelligence");
    res.status(503).json({ error: "Could not load war intelligence.", code: "WAR_INTELLIGENCE_FAILED" });
  }
});

router.get("/clash/activity", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const performance = await listPlayerPerformance(clanTag);
    const players = performance.map((player) => {
      const recentWars = Math.min(10, player.warsCounted);
      const recentPossible = performance.length
        ? Math.min(player.attacksPossible, recentWars * 2)
        : 0;
      const recentUsed = Math.min(player.attacksUsed, recentPossible);
      const participationRate = recentWars
        ? Math.round((Math.min(recentWars, player.warsCounted) - Math.min(player.missedAttacks > 0 ? Math.floor(player.missedAttacks / 2) : 0, recentWars)) / recentWars * 100)
        : 0;
      const utilizationRate = recentPossible
        ? Math.round((recentUsed / recentPossible) * 100)
        : 0;
      const score = Math.max(0, Math.min(100, Math.round(
        participationRate * 0.45 + utilizationRate * 0.55,
      )));
      return {
        playerTag: player.playerTag,
        playerName: player.playerName,
        score,
        participatedWars: Math.max(0, recentWars - Math.min(Math.floor(player.missedAttacks / 2), recentWars)),
        warsTracked: recentWars,
        attacksUsed: recentUsed,
        attacksPossible: recentPossible,
        participationRate,
        attackUtilizationRate: utilizationRate,
      };
    }).sort((a, b) => b.score - a.score || b.attacksUsed - a.attacksUsed);

    res.json({ clanTag, players });
  } catch (error) {
    req.log.error({ err: error }, "Failed to load player activity");
    res.status(503).json({ error: "Could not load player activity.", code: "PLAYER_ACTIVITY_FAILED" });
  }
});

router.get("/clash/war-archive/:id", async (req, res): Promise<void> => {
  try {
    const clanTag = await getActiveClanTag(
      typeof req.query.clanTag === "string" ? req.query.clanTag : undefined,
    );
    const war = await getArchivedWar(clanTag, req.params.id);
    if (!war) {
      res.status(404).json({ error: "War not found.", code: "WAR_NOT_FOUND" });
      return;
    }
    res.json(war);
  } catch (error) {
    req.log.error({ err: error }, "Failed to load archived war");
    res.status(503).json({ error: "Could not load this war.", code: "WAR_ARCHIVE_FAILED" });
  }
});

export default router;
