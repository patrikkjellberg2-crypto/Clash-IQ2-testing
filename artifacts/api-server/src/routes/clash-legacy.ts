import { Router, type IRouter } from "express";
import type { ClashRecord } from "../lib/clash-types";
import { normalizeClanTag } from "../lib/clash-tags";
import { fetchClashKingResource } from "../lib/clash-fetch";
import { persistActiveClanTag } from "../lib/clan-selection";

const router: IRouter = Router();

/* -------------------------------------------------------------------------- */
/* Legacy clan-cache compatibility                                             */
/* -------------------------------------------------------------------------- */

// Some older ClashIQ frontend builds request /api/clan/:tag/cached directly.
// Keep that endpoint working while the dashboard migrates to /api/clash/dashboard.
router.get(
  "/clan/:tag/cached",
  async (req, res): Promise<void> => {
    const clanTag = normalizeClanTag(req.params.tag);
    const encodedClanTag = encodeURIComponent(clanTag);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        10_000,
      );

      let clan: ClashRecord | ClashRecord[] | null;
      try {
        clan = await fetchClashKingResource(
          `/v2/clan/${encodedClanTag}/cached`,
          controller.signal,
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!clan || Array.isArray(clan)) {
        res.status(404).json({
          error: "Clan not found in ClashKing.",
          code: "CLAN_NOT_FOUND",
        });
        return;
      }

      await persistActiveClanTag(clanTag);
      res.json(clan);
    } catch (error) {
      req.log.error(
        {
          err: error,
          clanTag,
        },
        "Failed to load cached clan from ClashKing",
      );

      res.status(503).json({
        error: "ClashKing is temporarily unavailable.",
        code: "CLASHKING_UNAVAILABLE",
      });
    }
  },
);

export default router;
