import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { appSettingsTable, db } from "@workspace/db";

const router: IRouter = Router();
const SETTINGS_ID = 1;

const DEFAULTS = {
  id: SETTINGS_ID,
  aiEnabled: true,
  notifications: true,
  warAlerts: true,
  autoRefresh: true,
  compactMode: false,
  soundEffects: false,
};

async function ensureSettings() {
  await db
    .insert(appSettingsTable)
    .values(DEFAULTS)
    .onConflictDoNothing({ target: appSettingsTable.id });

  const [settings] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.id, SETTINGS_ID))
    .limit(1);

  return settings ?? { ...DEFAULTS, updatedAt: new Date() };
}

const BOOLEAN_KEYS = [
  "aiEnabled",
  "notifications",
  "warAlerts",
  "autoRefresh",
  "compactMode",
  "soundEffects",
] as const;

type BooleanKey = (typeof BOOLEAN_KEYS)[number];

router.get("/settings", async (req, res): Promise<void> => {
  try {
    res.json(await ensureSettings());
  } catch (error) {
    req.log.error({ err: error }, "Failed to load Clash IQ settings");
    res.status(503).json({
      error: "Settings are temporarily unavailable.",
      code: "SETTINGS_UNAVAILABLE",
    });
  }
});

router.patch("/settings", async (req, res): Promise<void> => {
  try {
    const current = await ensureSettings();
    const patch: Partial<Record<BooleanKey, boolean>> = {};

    for (const key of BOOLEAN_KEYS) {
      if (Object.prototype.hasOwnProperty.call(req.body ?? {}, key)) {
        if (typeof req.body[key] !== "boolean") {
          res.status(400).json({
            error: `${key} must be a boolean.`,
            code: "INVALID_SETTING",
          });
          return;
        }
        patch[key] = req.body[key];
      }
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({
        error: "No supported settings were provided.",
        code: "NO_SETTINGS",
      });
      return;
    }

    const [updated] = await db
      .update(appSettingsTable)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(eq(appSettingsTable.id, SETTINGS_ID))
      .returning();

    res.json(updated ?? current);
  } catch (error) {
    req.log.error({ err: error }, "Failed to save Clash IQ settings");
    res.status(503).json({
      error: "Settings could not be saved.",
      code: "SETTINGS_SAVE_FAILED",
    });
  }
});

export default router;
