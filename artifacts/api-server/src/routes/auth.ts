import { Router, type IRouter } from "express";
import crypto from "node:crypto";

const router: IRouter = Router();

const COOKIE_NAME = "clashiq_session";
const STATE_COOKIE = "clashiq_oauth_state";
const DEFAULT_REDIRECT = "/account";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

type GoogleUser = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const sessionSecret = process.env.SESSION_SECRET?.trim();
  const testEmail = process.env.GOOGLE_TEST_EMAIL?.trim().toLowerCase();
  const baseUrl = (
    process.env.GOOGLE_REDIRECT_BASE_URL?.trim() ||
    "https://clash-iq-builder-base-test.onrender.com"
  ).replace(/\/$/, "");

  if (!clientId || !clientSecret || !sessionSecret) {
    return null;
  }

  return { clientId, clientSecret, sessionSecret, testEmail, baseUrl };
}

function sign(value: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
}

function pack(value: unknown, secret: string): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function unpack<T>(value: string | undefined, secret: string): T | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function setCookie(
  res: any,
  name: string,
  value: string,
  maxAge: number,
  options: { httpOnly?: boolean; sameSite?: "lax" | "strict" | "none"; secure?: boolean } = {},
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${Math.max(0, Math.floor(maxAge / 1000))}`,
    `SameSite=${options.sameSite ?? "lax"}`,
  ];
  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (options.secure !== false) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

function clearCookie(res: any, name: string) {
  res.append(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure`,
  );
}

function readCookie(req: any, name: string): string | undefined {
  const raw = String(req.headers.cookie ?? "");
  for (const item of raw.split(";")) {
    const [key, ...rest] = item.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}

function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value) return DEFAULT_REDIRECT;
  try {
    const parsed = new URL(value, "https://clash-iq-builder-base-test.onrender.com");
    if (parsed.origin !== "https://clash-iq-builder-base-test.onrender.com") {
      return DEFAULT_REDIRECT;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

router.get("/auth/google", (req, res): void => {
  const config = getConfig();

  if (!config) {
    res.status(503).send(
      "Google sign-in is not configured on the Clash IQ test server yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and SESSION_SECRET in Render.",
    );
    return;
  }

  if (!config.testEmail) {
    res.status(503).send(
      "Google sign-in test is locked until GOOGLE_TEST_EMAIL is configured in Render.",
    );
    return;
  }

  const state = crypto.randomBytes(32).toString("base64url");
  const returnTo = safeReturnTo(req.query.returnTo);

  setCookie(
    res,
    STATE_COOKIE,
    pack({ state, returnTo, exp: Date.now() + 10 * 60 * 1000 }, config.sessionSecret),
    10 * 60 * 1000,
  );

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${config.baseUrl}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const config = getConfig();

  if (!config) {
    res.status(503).send("Google sign-in is not configured on the Clash IQ test server.");
    return;
  }

  const stored = unpack<{ state: string; returnTo: string; exp: number }>(
    readCookie(req, STATE_COOKIE),
    config.sessionSecret,
  );

  clearCookie(res, STATE_COOKIE);

  const state = typeof req.query.state === "string" ? req.query.state : "";
  const code = typeof req.query.code === "string" ? req.query.code : "";

  if (!stored || stored.exp < Date.now() || !state || state !== stored.state || !code) {
    res.status(400).send("Google sign-in could not be verified. Please start the login again.");
    return;
  }

  if (req.query.error) {
    res.redirect(stored.returnTo || DEFAULT_REDIRECT);
    return;
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: `${config.baseUrl}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Google token exchange returned ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) throw new Error("Google did not return an access token.");

    const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error(`Google userinfo returned ${userResponse.status}`);
    }

    const user = await userResponse.json() as GoogleUser;
    const email = String(user.email ?? "").trim().toLowerCase();

    if (!email || user.email_verified !== true || email !== config.testEmail) {
      clearCookie(res, COOKIE_NAME);
      res.status(403).send(
        "This Google account is not enabled for the Clash IQ private test. Set GOOGLE_TEST_EMAIL to the test Google account in Render.",
      );
      return;
    }

    const session = pack(
      {
        sub: user.sub,
        email,
        name: user.name ?? email,
        picture: user.picture ?? null,
        exp: Date.now() + SESSION_MAX_AGE,
      },
      config.sessionSecret,
    );

    setCookie(res, COOKIE_NAME, session, SESSION_MAX_AGE);
    res.redirect(stored.returnTo || DEFAULT_REDIRECT);
  } catch (error) {
    req.log?.error?.({ error }, "Google OAuth callback failed");
    res.status(502).send("Google sign-in failed. Please try again.");
  }
});

router.get("/api/me", (req, res): void => {
  const config = getConfig();
  if (!config) {
    res.json({ authenticated: false, configured: false });
    return;
  }

  const session = unpack<{
    sub: string;
    email: string;
    name: string;
    picture: string | null;
    exp: number;
  }>(readCookie(req, COOKIE_NAME), config.sessionSecret);

  if (!session || session.exp < Date.now() || session.email !== config.testEmail) {
    res.json({ authenticated: false, configured: true });
    return;
  }

  res.json({
    authenticated: true,
    configured: true,
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture,
    },
  });
});

router.get("/auth/logout", (req, res): void => {
  clearCookie(res, COOKIE_NAME);
  res.redirect("/");
});

export default router;
