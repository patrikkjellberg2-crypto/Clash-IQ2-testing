import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

type Track = { id: number; clanTag: string; title: string; url: string; addedBy: string; createdAt: string };

function normalizeTag(value: unknown) {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!raw) return "";
  return raw.startsWith("#") ? raw : `#${raw}`;
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isMusicUrl(value: string) {
  try {
    const url = new URL(value);
    return ["music.youtube.com", "www.youtube.com", "youtube.com", "youtu.be"].includes(url.hostname.toLowerCase());
  } catch { return false; }
}

let ready: Promise<void> | null = null;
function ensureTable() {
  if (!ready) {
    ready = (async () => {
      await pool.query("CREATE TABLE IF NOT EXISTS clan_music_tracks (id BIGSERIAL PRIMARY KEY, clan_tag TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, added_by TEXT NOT NULL DEFAULT $$Clan member$$, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
      await pool.query("CREATE INDEX IF NOT EXISTS clan_music_tracks_clan_idx ON clan_music_tracks (clan_tag, created_at DESC)");
    })().catch((error) => { ready = null; throw error; });
  }
  return ready;
}

router.get("/clash/music", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeTag(req.query.clanTag);
    if (!clanTag) { res.status(400).json({ error: "clanTag is required" }); return; }
    await ensureTable();
    const { rows } = await pool.query("SELECT id, clan_tag AS \"clanTag\", title, url, added_by AS \"addedBy\", created_at AS \"createdAt\" FROM clan_music_tracks WHERE clan_tag = $1 ORDER BY created_at DESC, id DESC LIMIT 200", [clanTag]);
    res.json({ tracks: rows as unknown as Track[] });
  } catch (error) { req.log.error({ err: error }, "Failed to load clan music"); res.status(503).json({ error: "Clan music is temporarily unavailable." }); }
});

router.post("/clash/music", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeTag(req.body?.clanTag);
    const title = cleanText(req.body?.title, 160);
    const url = cleanText(req.body?.url, 500);
    const addedBy = cleanText(req.body?.addedBy, 80) || "Clan member";
    if (!clanTag || !title || !url) { res.status(400).json({ error: "clanTag, title and url are required" }); return; }
    if (!isMusicUrl(url)) { res.status(400).json({ error: "Only YouTube or YouTube Music links are allowed" }); return; }
    await ensureTable();
    const { rows } = await pool.query("INSERT INTO clan_music_tracks (clan_tag, title, url, added_by) VALUES ($1, $2, $3, $4) RETURNING id, clan_tag AS \"clanTag\", title, url, added_by AS \"addedBy\", created_at AS \"createdAt\"", [clanTag, title, url, addedBy]);
    const row = rows[0];
    res.status(201).json(row as unknown as Track);
  } catch (error) { req.log.error({ err: error }, "Failed to add clan music"); res.status(503).json({ error: "The song could not be added." }); }
});

router.delete("/clash/music/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id); const clanTag = normalizeTag(req.query.clanTag);
    if (!Number.isInteger(id) || id <= 0 || !clanTag) { res.status(400).json({ error: "A valid id and clanTag are required" }); return; }
    await ensureTable();
    await pool.query("DELETE FROM clan_music_tracks WHERE id = $1 AND clan_tag = $2", [id, clanTag]);
    res.status(204).end();
  } catch (error) { req.log.error({ err: error }, "Failed to remove clan music"); res.status(503).json({ error: "The song could not be removed." }); }
});

export default router;