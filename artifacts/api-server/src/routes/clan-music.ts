import { Router, type IRouter, type Response } from "express";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { pool } from "@workspace/db";

const router: IRouter = Router();

type Track = { id: number; clanTag: string; title: string; url: string; addedBy: string; createdAt: string };
type YoutubeConnection = { connectionId: string; refreshToken: string; playlistId: string | null };

const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const CONNECTION_COOKIE = "clash_iq_yt_conn";
const STATE_COOKIE = "clash_iq_yt_state";

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

function youtubeVideoId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.toLowerCase() === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
    return url.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
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

function parseCookies(header: string | undefined) {
  const result: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try { result[key] = decodeURIComponent(value); } catch { result[key] = value; }
  }
  return result;
}

function setCookie(res: Response, name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
  res.append("Set-Cookie", cookie);
}

function clearCookie(res: Response, name: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.append("Set-Cookie", `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
}

function encryptionKey() {
  const secret = process.env.YOUTUBE_OAUTH_ENCRYPTION_KEY || process.env.DATABASE_URL || "";
  if (!secret) throw new Error("YouTube token encryption secret is not configured");
  return createHash("sha256").update(secret).digest();
}

function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decryptSecret(value: string) {
  const payload = Buffer.from(value, "base64url");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function oauthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri(req: any) {
  const configured = cleanText(process.env.GOOGLE_YOUTUBE_REDIRECT_URI, 500);
  if (configured) return configured;
  const forwardedProto = cleanText(req.get("x-forwarded-proto"), 20);
  const protocol = forwardedProto.split(",")[0].trim() || req.protocol;
  return `${protocol}://${req.get("host")}/api/clash/music/youtube/callback`;
}

async function ensureTable() {
  await pool.query("CREATE TABLE IF NOT EXISTS clan_music_tracks (id BIGSERIAL PRIMARY KEY, clan_tag TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, added_by TEXT NOT NULL DEFAULT 'Clan member', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  await pool.query("CREATE INDEX IF NOT EXISTS clan_music_tracks_clan_idx ON clan_music_tracks (clan_tag, created_at DESC)");
  await pool.query("CREATE TABLE IF NOT EXISTS clan_music_youtube_connections (connection_id TEXT PRIMARY KEY, refresh_token TEXT NOT NULL, playlist_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
}

async function getConnection(connectionId: string): Promise<YoutubeConnection | null> {
  if (!connectionId) return null;
  await ensureTable();
  const { rows } = await pool.query(
    "SELECT connection_id AS \"connectionId\", refresh_token AS \"refreshToken\", playlist_id AS \"playlistId\" FROM clan_music_youtube_connections WHERE connection_id = $1",
    [connectionId],
  );
  if (!rows[0]) return null;
  return {
    connectionId: rows[0].connectionId,
    refreshToken: decryptSecret(rows[0].refreshToken),
    playlistId: rows[0].playlistId ?? null,
  };
}

async function saveConnection(connectionId: string, refreshToken: string, playlistId: string | null) {
  await ensureTable();
  await pool.query(
    `INSERT INTO clan_music_youtube_connections (connection_id, refresh_token, playlist_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (connection_id) DO UPDATE SET
       refresh_token = EXCLUDED.refresh_token,
       playlist_id = COALESCE(EXCLUDED.playlist_id, clan_music_youtube_connections.playlist_id),
       updated_at = NOW()`,
    [connectionId, encryptSecret(refreshToken), playlistId],
  );
}

async function googleTokenRequest(params: Record<string, string>) {
  const body = new URLSearchParams(params);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${cleanText(payload?.error_description || payload?.error, 240) || response.status}`);
  }
  return payload as { access_token?: string; refresh_token?: string; expires_in?: number };
}

async function getAccessToken(connection: YoutubeConnection) {
  const tokens = await googleTokenRequest({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: connection.refreshToken,
    grant_type: "refresh_token",
  });
  if (!tokens.access_token) throw new Error("Google did not return an access token");
  return tokens.access_token;
}

async function youtubeRequest(accessToken: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${YOUTUBE_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = payload?.error?.errors?.[0]?.reason || payload?.error?.message || response.status;
    const error = new Error(`YouTube API error: ${reason}`);
    (error as Error & { status?: number; reason?: string }).status = response.status;
    (error as Error & { status?: number; reason?: string }).reason = String(reason);
    throw error;
  }
  return payload;
}

async function createYoutubePlaylist(accessToken: string, title: string, clanTag: string) {
  const body = {
    snippet: {
      title: cleanText(title, 150) || `Clash IQ — ${clanTag}`,
      description: `Shared clan playlist from Clash IQ for ${clanTag}.`,
    },
    status: { privacyStatus: "private" },
  };
  const payload = await youtubeRequest(accessToken, "/playlists?part=snippet,status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!payload?.id) throw new Error("YouTube did not return a playlist id");
  return String(payload.id);
}

async function listYoutubePlaylistItems(accessToken: string, playlistId: string) {
  const items: Array<{ id: string; videoId: string; position: number }> = [];
  let pageToken = "";
  for (let page = 0; page < 20; page++) {
    const query = new URLSearchParams({ part: "snippet,contentDetails", maxResults: "50", playlistId });
    if (pageToken) query.set("pageToken", pageToken);
    const payload = await youtubeRequest(accessToken, `/playlistItems?${query.toString()}`);
    for (const item of Array.isArray(payload?.items) ? payload.items : []) {
      const id = typeof item?.id === "string" ? item.id : "";
      const videoId = typeof item?.contentDetails?.videoId === "string" ? item.contentDetails.videoId : "";
      const position = Number(item?.snippet?.position);
      if (id && videoId && Number.isFinite(position)) items.push({ id, videoId, position });
    }
    pageToken = typeof payload?.nextPageToken === "string" ? payload.nextPageToken : "";
    if (!pageToken) break;
  }
  return items;
}

function accountConnectionId(userId: string) {
  return createHash("sha256").update(`clash-iq-youtube:${userId}:${process.env.DATABASE_URL || "local"}`).digest("hex");
}

async function currentAccountId(req: any) {
  const sid = parseCookies(req.headers.cookie)["clashiq_session"] || "";
  if (!sid) return "";
  const { rows } = await pool.query("SELECT user_id FROM clashiq_sessions WHERE id = $1 AND expires_at > NOW()", [sid]);
  return rows[0]?.user_id ? String(rows[0].user_id) : "";
}

let ready: Promise<void> | null = null;
function ensureTables() {
  if (!ready) {
    ready = ensureTable().catch((error) => { ready = null; throw error; });
  }
  return ready;
}

router.get("/clash/music/youtube/status", async (req, res): Promise<void> => {
  try {
    await ensureTables();
    const userId = await currentAccountId(req);
    const connection = await getConnection(userId ? accountConnectionId(userId) : "");
    res.json({
      configured: oauthConfigured(),
      connected: Boolean(connection),
      playlistUrl: connection?.playlistId ? `https://www.youtube.com/playlist?list=${encodeURIComponent(connection.playlistId)}` : null,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to read YouTube connection status");
    res.status(503).json({ error: "YouTube connection status is temporarily unavailable." });
  }
});

router.get("/clash/music/youtube/auth", async (req, res): Promise<void> => {
  if (!oauthConfigured()) {
    res.status(503).json({ error: "YouTube saving is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Render." });
    return;
  }
  const userId = await currentAccountId(req);
  if (!userId) { res.status(401).json({ error: "Sign in to Clash IQ first." }); return; }
  const connectionId = accountConnectionId(userId);
  const state = randomBytes(32).toString("hex");
  setCookie(res, CONNECTION_COOKIE, connectionId, 60 * 60 * 24 * 365);
  setCookie(res, STATE_COOKIE, state, 60 * 10);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: YOUTUBE_SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

router.get("/clash/music/youtube/callback", async (req, res): Promise<void> => {
  try {
    if (req.query.error) {
      clearCookie(res, STATE_COOKIE);
      res.redirect("/music?youtube=denied");
      return;
    }
    const userId = await currentAccountId(req);
    const state = cleanText(req.query.state, 200);
    const expectedState = cookies[STATE_COOKIE] || "";
    const code = cleanText(req.query.code, 4000);
    const connectionId = userId ? accountConnectionId(userId) : "";
    if (!state || !expectedState || state !== expectedState || !code || !connectionId) {
      clearCookie(res, STATE_COOKIE);
      res.status(400).send("YouTube authorization could not be verified. Please start the connection again from Clash IQ.");
      return;
    }
    if (!oauthConfigured()) {
      res.status(503).send("YouTube saving is not configured on this Clash IQ deployment.");
      return;
    }
    const tokens = await googleTokenRequest({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(req),
      grant_type: "authorization_code",
    });
    if (!tokens.refresh_token) {
      throw new Error("Google did not return a refresh token. Please connect again and approve offline access.");
    }
    await saveConnection(connectionId, tokens.refresh_token, null);
    clearCookie(res, STATE_COOKIE);
    res.redirect("/music?youtube=connected");
  } catch (error) {
    req.log.error({ err: error }, "YouTube OAuth callback failed");
    clearCookie(res, STATE_COOKIE);
    res.redirect("/music?youtube=error");
  }
});

router.post("/clash/music/youtube/sync", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeTag(req.body?.clanTag);
    const playlistTitle = cleanText(req.body?.playlistTitle, 150);
    if (!clanTag) { res.status(400).json({ error: "clanTag is required" }); return; }
    if (!oauthConfigured()) { res.status(503).json({ error: "YouTube saving is not configured on this Clash IQ deployment." }); return; }

    await ensureTables();
    const userId = await currentAccountId(req);
    let connection = await getConnection(userId ? accountConnectionId(userId) : "");
    if (!connection) {
      res.status(401).json({ error: "Connect your YouTube account first.", needsAuth: true });
      return;
    }

    const { rows } = await pool.query(
      "SELECT id, clan_tag AS \"clanTag\", title, url, added_by AS \"addedBy\", created_at AS \"createdAt\" FROM clan_music_tracks WHERE clan_tag = $1 ORDER BY created_at ASC, id ASC LIMIT 500",
      [clanTag],
    );
    const tracks = rows as unknown as Track[];
    if (!tracks.length) { res.status(400).json({ error: "The clan playlist is empty." }); return; }

    let accessToken: string;
    try {
      accessToken = await getAccessToken(connection);
    } catch (error) {
      const reason = (error as Error & { reason?: string }).reason;
      const message = error instanceof Error ? error.message : "";
      if (reason === "invalid_grant" || /invalid_grant/i.test(message)) {
        res.status(401).json({ error: "Your YouTube connection has expired. Connect YouTube again.", needsAuth: true });
        return;
      }
      throw error;
    }
    let playlistId = connection.playlistId;
    if (!playlistId) {
      playlistId = await createYoutubePlaylist(accessToken, playlistTitle || `Clash IQ — ${clanTag}`, clanTag);
      await saveConnection(connection.connectionId, connection.refreshToken, playlistId);
      connection = { ...connection, playlistId };
    }

    const desiredVideoIds: string[] = [];
    const desiredSet = new Set<string>();
    let skipped = 0;
    for (const track of tracks) {
      const videoId = youtubeVideoId(track.url);
      if (!videoId || desiredSet.has(videoId)) {
        skipped++;
        continue;
      }
      desiredSet.add(videoId);
      desiredVideoIds.push(videoId);
    }

    let playlistItems: Array<{ id: string; videoId: string; position: number }>;
    try {
      playlistItems = await listYoutubePlaylistItems(accessToken, playlistId);
    } catch (error) {
      const reason = (error as Error & { reason?: string }).reason;
      if (reason !== "playlistNotFound") throw error;
      playlistId = await createYoutubePlaylist(accessToken, playlistTitle || `Clash IQ — ${clanTag}`, clanTag);
      await saveConnection(connection.connectionId, connection.refreshToken, playlistId);
      connection = { ...connection, playlistId };
      playlistItems = [];
    }

    const currentByVideo = new Map<string, { id: string; videoId: string; position: number }>();
    for (const item of playlistItems) {
      if (!currentByVideo.has(item.videoId)) currentByVideo.set(item.videoId, item);
    }

    let added = 0;
    let removed = 0;
    let reordered = 0;

    // Clash IQ is the master playlist: remove videos that are no longer in the clan playlist.
    for (const item of playlistItems) {
      if (!desiredSet.has(item.videoId)) {
        await youtubeRequest(accessToken, `/playlistItems?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
        removed++;
      }
    }

    // Add any clan songs that are missing from YouTube.
    for (const videoId of desiredVideoIds) {
      if (currentByVideo.has(videoId)) continue;
      try {
        await youtubeRequest(accessToken, "/playlistItems?part=snippet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snippet: {
              playlistId,
              resourceId: { kind: "youtube#video", videoId },
            },
          }),
        });
        added++;
      } catch (error) {
        const reason = (error as Error & { reason?: string }).reason;
        if (reason === "invalidValue" || reason === "videoNotFound") {
          skipped++;
          continue;
        }
        throw error;
      }
    }

    // Re-read after additions/removals so we can make YouTube match the Clash IQ order.
    playlistItems = await listYoutubePlaylistItems(accessToken, playlistId);
    const currentOrdered = new Map<string, { id: string; videoId: string; position: number }>();
    for (const item of playlistItems) {
      if (!currentOrdered.has(item.videoId)) currentOrdered.set(item.videoId, item);
    }

    for (let position = 0; position < desiredVideoIds.length; position++) {
      const videoId = desiredVideoIds[position];
      const item = currentOrdered.get(videoId);
      if (!item || item.position === position) continue;
      await youtubeRequest(accessToken, "/playlistItems?part=snippet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          snippet: {
            playlistId,
            position,
            resourceId: { kind: "youtube#video", videoId },
          },
        }),
      });
      reordered++;
    }

    accessToken = "";
    res.json({
      ok: true,
      playlistUrl: `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`,
      added,
      removed,
      reordered,
      skipped,
      total: desiredVideoIds.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to sync clan music to YouTube");
    const reason = String((error as Error & { reason?: string }).reason || "");
    const message = error instanceof Error ? error.message : "Unknown YouTube error";
    if (reason === "playlistItemsNotAccessible" || reason === "playlistForbidden") {
      res.status(403).json({ error: "YouTube did not allow access to the playlist. Reconnect your account and try again.", reason });
      return;
    }
    if (reason === "youtubeSignupRequired") {
      res.status(403).json({ error: "This Google account needs a YouTube channel before Clash IQ can create a playlist.", reason });
      return;
    }
    if (reason === "insufficientPermissions" || reason === "forbidden") {
      res.status(403).json({ error: "YouTube denied playlist access for this account. Reconnect YouTube and approve the requested permission.", reason });
      return;
    }
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
      res.status(429).json({ error: "YouTube API quota has been exceeded. Try again later.", reason });
      return;
    }
    res.status(503).json({ error: message.replace(/^YouTube API error:\s*/i, "YouTube: ") || "The clan playlist could not be saved to YouTube.", reason: reason || undefined });
  }
});

router.get("/clash/music", async (req, res): Promise<void> => {
  try {
    const clanTag = normalizeTag(req.query.clanTag);
    if (!clanTag) { res.status(400).json({ error: "clanTag is required" }); return; }
    await ensureTables();
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
    await ensureTables();
    const { rows } = await pool.query("INSERT INTO clan_music_tracks (clan_tag, title, url, added_by) VALUES ($1, $2, $3, $4) RETURNING id, clan_tag AS \"clanTag\", title, url, added_by AS \"addedBy\", created_at AS \"createdAt\"", [clanTag, title, url, addedBy]);
    res.status(201).json(rows[0] as unknown as Track);
  } catch (error) { req.log.error({ err: error }, "Failed to add clan music"); res.status(503).json({ error: "The song could not be added." }); }
});

router.delete("/clash/music/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const clanTag = normalizeTag(req.query.clanTag);
    if (!Number.isInteger(id) || id <= 0 || !clanTag) { res.status(400).json({ error: "A valid id and clanTag are required" }); return; }
    await ensureTables();
    await pool.query("DELETE FROM clan_music_tracks WHERE id = $1 AND clan_tag = $2", [id, clanTag]);
    res.status(204).end();
  } catch (error) { req.log.error({ err: error }, "Failed to remove clan music"); res.status(503).json({ error: "The song could not be removed." }); }
});

export default router;
