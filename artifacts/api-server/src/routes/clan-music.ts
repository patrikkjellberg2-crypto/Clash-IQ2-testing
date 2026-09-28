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

async function getYoutubeTitle(url: string) {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (!response.ok) return "";
    const body = await response.json() as { title?: unknown };
    return cleanText(body.title, 160);
  } catch {
    return "";
  }
}

let ready: Promise<void> | null = null;
function ensureTable() {
  if (!ready) {
    ready = (async () => {
      await pool.query("CREATE TABLE IF NOT EXISTS clan_music_tracks (id BIGSERIAL PRIMARY KEY, clan_tag TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, added_by TEXT NOT NULL DEFAULT $$Clan member$$, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
      await pool.query("CREATE INDEX IF NOT EXISTS clan_music_tracks_clan_idx ON clan_music_tracks (clan_tag, created_at DESC)");
      await pool.query("CREATE TABLE IF NOT EXISTS clan_music_playlists (clan_tag TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT $$Clan Playlist$$, url TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    })().catch((error) => { ready = null; throw error; });
  }
  return ready;
}

router.get("/clash/music/playlist", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeTag(req.query.clanTag);
    if (!clanTag) { res.status(400).json({ error: "clanTag is required" }); return; }
    await ensureTable();
    const { rows } = await pool.query("SELECT clan_tag AS \"clanTag\", title, url, updated_at AS \"updatedAt\" FROM clan_music_playlists WHERE clan_tag = $1 LIMIT 1", [clanTag]);
    res.json({ playlist: rows[0] ?? null });
  } catch (error) { req.log.error({ err: error }, "Failed to load clan playlist"); res.status(503).json({ error: "Clan playlist is temporarily unavailable." }); }
});

router.put("/clash/music/playlist", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeTag(req.body?.clanTag);
    const title = cleanText(req.body?.title, 160) || "Clan Playlist";
    const url = cleanText(req.body?.url, 500);
    if (!clanTag || !url) { res.status(400).json({ error: "clanTag and url are required" }); return; }
    if (!isMusicUrl(url) || !/[?&]list=/.test(url)) { res.status(400).json({ error: "Enter a YouTube or YouTube Music playlist link" }); return; }
    await ensureTable();
    const { rows } = await pool.query("INSERT INTO clan_music_playlists (clan_tag, title, url) VALUES ($1, $2, $3) ON CONFLICT (clan_tag) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url, updated_at = NOW() RETURNING clan_tag AS \"clanTag\", title, url, updated_at AS \"updatedAt\"", [clanTag, title, url]);
    res.json({ playlist: rows[0] });
  } catch (error) { req.log.error({ err: error }, "Failed to save clan playlist"); res.status(503).json({ error: "The clan playlist could not be saved." }); }
});

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
    const url = cleanText(req.body?.url, 500);
    const addedBy = cleanText(req.body?.addedBy, 80) || "Clan member";
    if (!clanTag || !url) { res.status(400).json({ error: "clanTag and url are required" }); return; }
    if (!isMusicUrl(url)) { res.status(400).json({ error: "Only YouTube or YouTube Music links are allowed" }); return; }
    const title = await getYoutubeTitle(url);
    if (!title) { res.status(400).json({ error: "Could not read the YouTube song title. Check that the link is a public video." }); return; }
    await ensureTable();
    const { rows } = await pool.query("INSERT INTO clan_music_tracks (clan_tag, title, url, added_by) VALUES ($1, $2, $3, $4) RETURNING id, clan_tag AS \"clanTag\", title, url, added_by AS \"addedBy\", created_at AS \"createdAt\"", [clanTag, title, url, addedBy]);
    res.status(201).json(rows[0] as unknown as Track);
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
