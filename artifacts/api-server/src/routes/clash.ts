import { Router, type IRouter } from "express";
import legacyRouter from "./clash-legacy";
import dashboardRouter from "./clash-dashboard";
import archiveRouter from "./clash-archive";
import playerRouter from "./clash-player";
import trendsRouter from "./clash-trends";
import warPlannerAssignmentsRouter from "./clash-war-planner-assignments";

/*
 * This file used to hold every /api/clash/* and /api/clan/* endpoint in one
 * ~1750-line module. It is now a thin composer: each concern lives in its
 * own file under routes/ and lib/, so a change to (for example) Player
 * Intelligence can't accidentally touch the Dashboard or War Planner code.
 *
 *   clash-legacy.ts                  -> GET /clan/:tag/cached
 *   clash-dashboard.ts                -> GET /clash/dashboard
 *   clash-archive.ts                  -> GET /clash/war-archive(/:id),
 *                                         /clash/war-intelligence, /clash/activity
 *   clash-player.ts                   -> GET /clash/player/:tag
 *   clash-trends.ts                   -> GET /clash/trends/clan, /clash/trends/movers,
 *                                         /clash/trends/player/:tag
 *   clash-war-planner-assignments.ts  -> GET/POST/PUT /clash/war-planner(/:attackerTag)
 *
 * Shared helpers moved to lib/: clash-types, clash-tags, clash-fetch,
 * clan-selection, war-normalize, historical-war-recovery.
 */

const router: IRouter = Router();

router.use(legacyRouter);
router.use(dashboardRouter);
router.use(archiveRouter);
router.use(playerRouter);
router.use(trendsRouter);
router.use(warPlannerAssignmentsRouter);

export default router;
