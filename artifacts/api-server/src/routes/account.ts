import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { getAuthenticatedSession } from "./auth";

const router: IRouter = Router();

function normalizeTag(value: unknown): string {
  const raw = String(value ?? "").trim().toUpperCase();
  return raw.startsWith("#") ? raw : `#${raw}`;
}

router.get("/account", (_req, res): void => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Clash IQ — Personal Dashboard</title>
<style>
body{margin:0;background:#08090b;color:#f5f1e8;font-family:Inter,system-ui,sans-serif;min-height:100vh}
main{max-width:1050px;margin:0 auto;padding:32px 18px 60px}
.card{background:#111318;border:1px solid #292c32;border-radius:18px;padding:22px;box-shadow:0 18px 50px #0008}
.top{display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}
.muted{color:#9ca3af}.user{display:flex;gap:12px;align-items:center}.avatar{width:48px;height:48px;border-radius:50%;background:#222;object-fit:cover}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px}
.stat{background:#0b0d10;border:1px solid #272a30;border-radius:14px;padding:16px}.label{font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em}.value{font-size:25px;font-weight:800;margin-top:6px}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
a,button{color:#111;background:#d8b15a;border:0;border-radius:10px;padding:11px 15px;font-weight:700;text-decoration:none;cursor:pointer}
a.secondary{background:#1b1e24;color:#f5f1e8;border:1px solid #30343b}
.result{margin-top:18px;padding:16px;border-radius:12px;background:#0b0d10;border:1px solid #272a30}
input{width:100%;box-sizing:border-box;background:#090a0d;color:#fff;border:1px solid #363941;border-radius:10px;padding:13px;margin:10px 0}
.hidden{display:none}.success{border-color:#6f8f4e}.error{border-color:#8f4e4e}
.subscription{margin-top:20px;background:#0d0f13;border:1px solid #2b2f36;border-radius:18px;padding:22px}
.sub-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}
.current-plan{padding:9px 12px;border:1px solid #6e5522;background:#19150d;color:#e4c36a;border-radius:999px;font-weight:800;white-space:nowrap}
.plans{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.plan-card{background:#090b0e;border:1px solid #292d34;border-radius:15px;padding:17px;display:flex;flex-direction:column}
.plan-card.active{border-color:#b28a38;box-shadow:0 0 0 1px #b28a3822 inset}
.plan-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.plan-top span{font-size:12px;letter-spacing:.09em;color:#d8b15a;font-weight:900}.plan-top b{font-size:21px}.plan-card p{color:#9ca3af;min-height:42px;font-size:13px;line-height:1.45}.plan-card ul{padding-left:18px;color:#d1d5db;font-size:13px;line-height:1.8;flex:1}.plan-button{border:1px solid #b28a38;background:#d8b15a;color:#111}.plan-button.secondary{background:#1b1e24;color:#f5f1e8;border-color:#30343b}
@media(max-width:1050px){.plans{grid-template-columns:1fr 1fr}}@media(max-width:560px){.sub-head{flex-direction:column}.plans{grid-template-columns:1fr}}
@media(max-width:760px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style></head>
<body><main>
<div class="card">
<div class="top">
<div><div class="muted">CLASH IQ · PERSONAL ACCOUNT</div><h1 id="heading">Welcome to Clash IQ</h1></div>
<div class="user"><img id="avatar" class="avatar" alt=""><div><strong id="name"></strong><div id="email" class="muted"></div></div></div>
</div>
<div id="status" class="muted" style="margin-top:24px">Checking your account…</div>

<section id="connect" class="hidden">
<h2>Connect your Clash of Clans player</h2>
<p class="muted">Connect your player once. Clash IQ will use the saved link for your personal dashboard.</p>
<input id="tag" placeholder="#PLAYER_TAG" autocomplete="off">
<button id="connectButton">Find and link player</button>
<div id="connectResult" class="result hidden"></div>
</section>

<section id="dashboard" class="hidden">
<div class="result success"><strong id="playerName"></strong> <span class="muted" id="playerTag"></span><br><span class="muted">Your Clash of Clans player is linked to this Clash IQ account.</span></div>
<div class="grid">
<div class="stat"><div class="label">Town Hall</div><div class="value" id="th">–</div></div>
<div class="stat"><div class="label">Trophies</div><div class="value" id="trophies">–</div></div>
<div class="stat"><div class="label">War Stars</div><div class="value" id="warStars">–</div></div>
<div class="stat"><div class="label">Activity</div><div class="value" id="activity">–</div></div>
</div>
<div class="grid">
<div class="stat"><div class="label">Wars tracked</div><div class="value" id="wars">–</div></div>
<div class="stat"><div class="label">Avg stars / attack</div><div class="value" id="avgStars">–</div></div>
<div class="stat"><div class="label">Village world rank</div><div class="value" id="worldRank">–</div></div>
<div class="stat"><div class="label">Village local rank</div><div class="value" id="localRank">–</div></div>
</div>
<div class="actions">
<a href="https://clash-iq-website-test-web.onrender.com/" class="secondary">← Back to Clash IQ</a>
<a href="https://clash-iq-builder-base-test.onrender.com/" class="secondary">Open app</a>
<a href="/auth/logout" class="secondary">Sign out</a>
</div>
<section class="subscription" id="subscription">
<div class="sub-head"><div><div class="muted">CLASH IQ · SUBSCRIPTION</div><h2 style="margin:6px 0">Choose your plan</h2><p class="muted" style="margin:0">Start free, or unlock more personal and clan features when you need them.</p></div><div class="current-plan" id="plan">Free · Active</div></div>
<div class="plans">
<div class="plan-card active" data-plan="free"><div class="plan-top"><span>FREE</span><b>$0</b></div><p>Core Clash IQ features for every player.</p><ul><li>Clan dashboard</li><li>Player Card</li><li>War history</li><li>Progress</li></ul><button class="plan-button secondary" data-plan-action="free">Current plan</button></div>
<div class="plan-card" data-plan="premium"><div class="plan-top"><span>PREMIUM</span><b>$2.99</b></div><p>Deeper tools for individual players.</p><ul><li>Everything in Free</li><li>Advanced personal analytics</li><li>Deeper history</li><li>More progress insights</li></ul><button class="plan-button" data-plan-action="premium">Choose Premium</button></div>
<div class="plan-card" data-plan="clan_premium"><div class="plan-top"><span>CLAN PREMIUM</span><b>$14.99</b></div><p>Advanced Clash IQ features for the whole clan.</p><ul><li>Clan-wide advanced analytics</li><li>Deeper clan history</li><li>Advanced war insights</li><li>Clan-focused tools</li></ul><button class="plan-button" data-plan-action="clan_premium">Choose Clan Premium</button></div>
<div class="plan-card" data-plan="leader_premium"><div class="plan-top"><span>LEADER</span><b>$4.99</b></div><p>Optional AI-powered tools for the clan leader.</p><ul><li>AI Coach access</li><li>AI war tools</li><li>Leader-focused insights</li><li>Designed for clan leadership</li></ul><button class="plan-button" data-plan-action="leader_premium">Choose Leader Premium</button></div>
</div><div id="planMessage" class="result hidden"></div>
</section>
<div id="liveStatus" class="muted" style="margin-top:16px">Loading live Clash data…</div>
</section>
</div></main>
<script>
(async()=>{
 const $=id=>document.getElementById(id);
 const status=$("status"), connect=$("connect"), dashboard=$("dashboard");
 try{
  const meRes=await fetch("/api/me",{credentials:"same-origin"});
  const me=await meRes.json();
  if(!me.authenticated){
   status.innerHTML='You are not signed in. <a href="/auth/google?returnTo=%2Faccount">Continue with Google</a>';
   return;
  }
  status.remove();
  $("name").textContent=me.user.name||"Clash IQ user";
  $("email").textContent=me.user.email||"";
  if(me.user.picture) $("avatar").src=me.user.picture;

  const accountRes=await fetch("/api/account",{credentials:"same-origin"});
  const account=await accountRes.json();
  if(!account.player){connect.classList.remove("hidden");return;}

  dashboard.classList.remove("hidden");
  const linked=account.player;
  $("playerName").textContent=linked.name||"Player";
  $("playerTag").textContent=linked.tag||"";
  $("th").textContent=linked.townHallLevel||linked.townHall||"–";
  $("trophies").textContent=linked.trophies??"–";
  $("warStars").textContent=linked.warStars??"–";

  try{
   const r=await fetch("/api/clash/player/"+encodeURIComponent(linked.tag),{credentials:"same-origin"});
   const p=await r.json();
   if(!r.ok) throw new Error("live");
   $("th").textContent=p.townHallLevel??p.townhallLevel??linked.townHallLevel??"–";
   $("trophies").textContent=p.trophies??linked.trophies??"–";
   $("warStars").textContent=p.warStars??linked.warStars??"–";
   $("activity").textContent=p.activity?.score!=null ? p.activity.score+"%" : "–";
   $("wars").textContent=p.historicalWarStats?.wars??"–";
   $("avgStars").textContent=p.historicalWarStats?.averageStarsPerAttack!=null ? Number(p.historicalWarStats.averageStarsPerAttack).toFixed(2) : "–";
   $("worldRank").textContent=p.rankings?.homeVillage?.globalRank ? "#"+p.rankings.homeVillage.globalRank : "–";
   $("localRank").textContent=p.rankings?.homeVillage?.localRank ? "#"+p.rankings.homeVillage.localRank : "–";
   $("liveStatus").textContent="Live Clash IQ data loaded.";
  }catch(e){$("liveStatus").textContent="Player is linked. Live Clash data is temporarily unavailable; saved account data is still intact.";}
 }catch(e){status.textContent="Could not load your Clash IQ account."}

 $("connectButton").onclick=async()=>{
  const input=$("tag"), box=$("connectResult");
  const tag=normalize(input.value);
  box.classList.remove("hidden","success","error"); box.textContent="Looking up player…";
  if(!/^#[A-Z0-9]{3,15}$/.test(tag)){box.classList.add("error");box.textContent="Enter a valid Clash of Clans player tag.";return;}
  $("connectButton").disabled=true;
  try{
   const r=await fetch("/api/account/player-link",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({tag})});
   const data=await r.json();
   if(!r.ok) throw new Error(data.message||"Player could not be linked.");
   box.classList.add("success");box.textContent="✓ "+(data.player.name||"Player")+" "+data.player.tag+" linked successfully.";
   setTimeout(()=>location.reload(),700);
  }catch(e){box.classList.add("error");box.textContent=e.message||"Could not link the player.";$("connectButton").disabled=false;}
 };
 function normalize(v){const raw=String(v||"").trim().toUpperCase();return raw.startsWith("#")?raw:"#"+raw;}
})();
</script></body></html>`);
});

router.get("/api/account/subscription", async (req, res): Promise<void> => {
  const session = getAuthenticatedSession(req);
  if (!session) { res.status(401).json({ authenticated: false }); return; }
  const result = await pool.query(
    `SELECT plan, status, updated_at FROM clash_iq_accounts WHERE google_sub = $1 LIMIT 1`,
    [session.sub],
  );
  const row = result.rows[0];
  res.json({
    authenticated: true,
    subscription: {
      plan: row?.plan ?? "free",
      status: row?.status ?? "active",
      updatedAt: row?.updated_at ?? null,
    },
  });
});

router.get("/api/account", async (req, res): Promise<void> => {
  const session = getAuthenticatedSession(req);
  if (!session) { res.status(401).json({ authenticated: false }); return; }
  const result = await pool.query(
    `SELECT player_tag, player_name, player_data FROM clash_iq_accounts WHERE google_sub = $1 LIMIT 1`,
    [session.sub],
  );
  const row = result.rows[0];
  if (!row?.player_tag) { res.json({ authenticated: true, player: null }); return; }
  res.json({ authenticated: true, player: { ...(row.player_data ?? {}), tag: row.player_tag, name: row.player_name } });
});

router.post("/api/account/player-link", async (req, res): Promise<void> => {
  const session = getAuthenticatedSession(req);
  if (!session) { res.status(401).json({ message: "You must be signed in to link a player." }); return; }
  const tag = normalizeTag(req.body?.tag);
  if (!/^#[A-Z0-9]{3,15}$/.test(tag)) { res.status(400).json({ message: "Enter a valid Clash of Clans player tag." }); return; }
  try {
    const origin = `${req.protocol}://${req.get("host")}`;
    const lookup = await fetch(`${origin}/api/clash/player/${encodeURIComponent(tag)}`, { headers: { Accept: "application/json" } });
    const data = await lookup.json() as any;
    if (!lookup.ok || !data?.tag) { res.status(404).json({ message: data?.message || "Player could not be found." }); return; }
    const player = {
      tag: String(data.tag).toUpperCase(),
      name: String(data.name ?? "Player"),
      townHallLevel: Number(data.townHallLevel ?? data.townHall ?? 0),
      trophies: Number(data.trophies ?? 0),
      warStars: Number(data.warStars ?? 0),
    };
    await pool.query(
      `INSERT INTO clash_iq_accounts (google_sub, email, player_tag, player_name, player_data, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, now())
       ON CONFLICT (google_sub) DO UPDATE SET email=EXCLUDED.email, player_tag=EXCLUDED.player_tag, player_name=EXCLUDED.player_name, player_data=EXCLUDED.player_data, updated_at=now()`,
      [session.sub, session.email, player.tag, player.name, JSON.stringify(player)],
    );
    res.json({ linked: true, player });
  } catch (error) {
    req.log?.error?.({ error }, "Player account linking failed");
    res.status(502).json({ message: "Could not link the player right now. Please try again." });
  }
});

export default router;
