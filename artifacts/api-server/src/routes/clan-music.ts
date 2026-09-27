import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

const router: IRouter = Router();

type Track = {
  id: number;
  clanTag: string;
  title: string;
  url: string;
  addedBy: string;
  createdAt: string;
};

function normalizeTag(value: unknown): string {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!raw) return "";
  return raw.startsWith("#") ? raw : `#${raw}`;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isMusicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return [
      "music.youtube.com",
      "www.youtube.com",
      "youtube.com",
      "youtu.be",
    ].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

let ready: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS clan_music_tracks (
          id BIGSERIAL PRIMARY KEY,
          clan_tag TEXT NOT NULL,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          added_by TEXT NOT NULL DEFAULT 'Clan member',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS clan_music_tracks_clan_idx
        ON clan_music_tracks (clan_tag, created_at DESC)
      `);
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }

  return ready;
}

router.get("/clash/music", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeTag(req.query.clanTag);

    if (!clanTag) {
      res.status(400).json({ error: "clanTag is required" });
      return;
    }

    await ensureTable();

    const result = await db.execute(sql`
      SELECT
        id,
        clan_tag AS "clanTag",
        title,
        url,
        added_by AS "addedBy",
        created_at AS "createdAt"
      FROM clan_music_tracks
      WHERE clan_tag = ${clanTag}
      ORDER BY created_at DESC, id DESC
      LIMIT 200
    `);

    const tracks = result.rows.map((row) => ({
      id: Number(row.id),
      clanTag: String(row.clanTag),
      title: String(row.title),
      url: String(row.url),
      addedBy: String(row.addedBy),
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
    })) as Track[];

    res.json({ tracks });
  } catch (error) {
    req.log.error({ err: error }, "Failed to load clan music");
    res.status(503).json({ error: "Clan music is temporarily unavailable." });
  }
});

router.post("/clash/music", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeTag(req.body?.clanTag);
    const title = cleanText(req.body?.title, 160);
    const url = cleanText(req.body?.url, 500);
    const addedBy = cleanText(req.body?.addedBy, 80) || "Clan member";

    if (!clanTag || !title || !url) {
      res
        .status(400)
        .json({ error: "clanTag, title and url are required" });
      return;
    }

    if (!isMusicUrl(url)) {
      res
        .status(400)
        .json({ error: "Only YouTube or YouTube Music links are allowed" });
      return;
    }

    await ensureTable();

    const result = await db.execute(sql`
      INSERT INTO clan_music_tracks (clan_tag, title, url, added_by)
      VALUES (${clanTag}, ${title}, ${url}, ${addedBy})
      RETURNING
        id,
        clan_tag AS "clanTag",
        title,
        url,
        added_by AS "addedBy",
        created_at AS "createdAt"
    `);

    const row = result.rows[0];

    if (!row) {
      res.status(500).json({ error: "The song could not be added." });
      return;
    }

    res.status(201).json({
      id: Number(row.id),
      clanTag: String(row.clanTag),
      title: String(row.title),
      url: String(row.url),
      addedBy: String(row.addedBy),
      createdAt: new Date(row.createdAt as string | Date).toISOString(),
    } satisfies Track);
  } catch (error) {
    req.log.error({ err: error }, "Failed to add clan music");
    res.status(503).json({ error: "The song could not be added." });
  }
});

router.delete("/clash/music/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const clanTag = normalizeTag(req.query.clanTag);

    if (!Number.isInteger(id) || id <= 0 || !clanTag) {
      res
        .status(400)
        .json({ error: "A valid id and clanTag are required" });
      return;
    }

    await ensureTable();

    await db.execute(sql`
      DELETE FROM clan_music_tracks
      WHERE id = ${id} AND clan_tag = ${clanTag}
    `);

    res.status(204).end();
  } catch (error) {
    req.log.error({ err: error }, "Failed to remove clan music");
    res.status(503).json({ error: "The song could not be removed." });
  }
});

export default router;
