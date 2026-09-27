import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/**
 * Diagnostic endpoint (no secrets leaked).
 * Helps confirm whether required AI / Clash env vars are present
 * in the running process — useful when Render UI shows a key but
 * the service still reports "not configured".
 */
router.get("/healthz/config", (_req, res) => {
  res.json({
    status: "ok",
    env: {
      OPENROUTER_API_KEY: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
      OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openrouter/free (default)",
      CLASH_API_TOKEN: Boolean(process.env.CLASH_API_TOKEN?.trim()),
      CLASH_API_BASE_URL: process.env.CLASH_API_BASE_URL || "https://cocproxy.royaleapi.dev/v1 (default)",
      MECKA_API_KEY: Boolean(process.env.MECKA_API_KEY?.trim()),
      NODE_ENV: process.env.NODE_ENV || null,
    },
  });
});

export default router;
