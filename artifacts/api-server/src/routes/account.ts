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
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Clash IQ — Account</title>
<style>
body{margin:0;background:#08090b;color:#f5f1e8;font-family:Inter,system-ui,sans-serif;min-height:100vh}
main{max-width:900px;margin:0 auto;padding:48px 22px}
.card{background:#111318;border:1px solid #292c32;border-radius:20px;padding:28px;box-shadow:0 20px 60px #0008}
h1{margin:0 0 8px;font-size:32px}.muted{color:#9ca3af}
.user{display:flex;gap:14px;align-items:center;margin:24px 0}
.avatar{width:52px;height:52px;border-radius:50%;background:#222;object-fit:cover}
input{width:100%;box-sizing:border-box;background:#090a0d;color:#fff;border:1px solid #363941;border-radius:10px;padding:13px;margin:10px 0}
button{background:#d8b15a;color:#111;border:0;border-radius:10px;padding:13px 18px;font-weight:700;cursor:pointer}
.result{margin-top:20px;padding:18px;border-radius:14px;background:#0b0d10;border:1px solid #272a30}
a{color:#d8b15a}
.success{border-color:#6f8f4e}
</style>
</head>
<body><main><div class="card">
<div class="muted">CLASH IQ · PRIVATE TEST</div>
<h1>Welcome to your Clash IQ account</h1>
<p class="muted">Your Google account is connected. Connect your Clash of Clans player to continue.</p>
<div id="status">Checking your session…</div>
<div id="app" hidden>
<div class="user"><img id="avatar" class="avatar" alt=""><div><strong id="name"></strong><div id="email" class="muted"></div></div></div>
<h2>Connect your Clash of Clans player</h2>
<p id="intro" class="muted">Enter your player tag. We will verify the live player before saving the permanent account link.</p>
<input id="tag" placeholder="#PLAYER_TAG" autocomplete="off">
<button id="connect">Find player</button>
<div id="result" class="result" hidden></div>
<p id="linked" class="muted" hidden></p>
<p style="margin-top:28px"><a href="/auth/logout">Sign out</a></p>
</div></div></main>
<script>
(async()=>{
 const status=document.getElementById('status'), app=document.getElementById('app');
 const tagInput=document.getElementById('tag'), button=document.getElementById('connect');
 const box=document.getElementById('result'), linked=document.getElementById('linked');
 try{
  const r=await fetch('/api/me',{credentials:'same-origin'}), me=await r.json();
  if(!me.authenticated){status.innerHTML='You are not signed in. <a href="/auth/google?returnTo=%2Faccount">Continue with Google</a>';return;}
  status.remove(); app.hidden=false;
  document.getElementById('name').textContent=me.user.name||'Clash IQ user';
  document.getElementById('email').textContent=me.user.email;
  if(me.user.picture) document.getElementById('avatar').src=me.user.picture;

  const account=await fetch('/api/account',{credentials:'same-origin'});
  if(account.ok){
    const data=await account.json();
    if(data.player){
      tagInput.value=data.player.tag;
      tagInput.disabled=true;
      button.textContent='Player linked';
      button.disabled=true;
      linked.hidden=false;
      linked.textContent='✓ Your Clash of Clans player is permanently linked to this Clash IQ account.';
      box.hidden=false;
      box.classList.add('success');
      box.innerHTML='<strong>'+String(data.player.name||'Player')+'</strong><br>'+String(data.player.tag)+
        '<br>Town Hall: '+String(data.player.townHallLevel||data.player.townHall||'–')+
        '<br>Trophies: '+String(data.player.trophies??'–')+
        '<br>War stars: '+String(data.player.warStars??'–');
    }
  }
 }catch(e){status.textContent='Could not check the Clash IQ session.'}

 button.onclick=async()=>{
  const tag=tagInput.value.trim().replace(/^#?/, '#').toUpperCase();
  box.hidden=false; box.classList.remove('success'); box.textContent='Looking up player…';
  if(!/^#[A-Z0-9]{3,15}$/.test(tag)){box.textContent='Enter a valid Clash of Clans player tag.';return;}
  button.disabled=true;
  try{
   const r=await fetch('/api/account/player-link',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     credentials:'same-origin',
     body:JSON.stringify({tag})
   });
   const data=await r.json();
   if(!r.ok){box.textContent=data.message||'Player could not be linked.';button.disabled=false;return;}
   box.classList.add('success');
   box.innerHTML='<strong>'+String(data.player.name||'Player')+'</strong><br>'+String(data.player.tag)+
     '<br>Town Hall: '+String(data.player.townHallLevel||data.player.townHall||'–')+
     '<br>Trophies: '+String(data.player.trophies??'–')+
     '<br>War stars: '+String(data.player.warStars??'–')+
     '<br><br>✓ Player permanently linked to your Clash IQ account.';
   linked.hidden=false;
   linked.textContent='✓ Your Clash of Clans player is now permanently linked to this Clash IQ account.';
   tagInput.value=data.player.tag;
   tagInput.disabled=true;
   button.textContent='Player linked';
  }catch(e){box.textContent='Could not reach the Clash IQ account service.';button.disabled=false;}
 };
})();
</script></body></html>`);
});

router.get("/api/account", async (req, res): Promise<void> => {
  const session = getAuthenticatedSession(req);
  if (!session) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const result = await pool.query(
    `SELECT player_tag, player_name, player_data
     FROM clash_iq_accounts
     WHERE google_sub = $1
     LIMIT 1`,
    [session.sub],
  );

  const row = result.rows[0];
  if (!row?.player_tag) {
    res.json({ authenticated: true, player: null });
    return;
  }

  res.json({
    authenticated: true,
    player: {
      ...(row.player_data ?? {}),
      tag: row.player_tag,
      name: row.player_name,
    },
  });
});

router.post("/api/account/player-link", async (req, res): Promise<void> => {
  const session = getAuthenticatedSession(req);
  if (!session) {
    res.status(401).json({ message: "You must be signed in to link a player." });
    return;
  }

  const tag = normalizeTag(req.body?.tag);
  if (!/^#[A-Z0-9]{3,15}$/.test(tag)) {
    res.status(400).json({ message: "Enter a valid Clash of Clans player tag." });
    return;
  }

  try {
    const origin = `${req.protocol}://${req.get("host")}`;
    const lookup = await fetch(
      `${origin}/api/clash/player/${encodeURIComponent(tag)}`,
      { headers: { Accept: "application/json" } },
    );
    const data = await lookup.json() as any;

    if (!lookup.ok || !data?.tag) {
      res.status(404).json({ message: data?.message || "Player could not be found." });
      return;
    }

    const player = {
      tag: String(data.tag).toUpperCase(),
      name: String(data.name ?? "Player"),
      townHallLevel: Number(data.townHallLevel ?? data.townHall ?? 0),
      trophies: Number(data.trophies ?? 0),
      warStars: Number(data.warStars ?? 0),
    };

    await pool.query(
      `INSERT INTO clash_iq_accounts
         (google_sub, email, player_tag, player_name, player_data, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, now())
       ON CONFLICT (google_sub)
       DO UPDATE SET
         email = EXCLUDED.email,
         player_tag = EXCLUDED.player_tag,
         player_name = EXCLUDED.player_name,
         player_data = EXCLUDED.player_data,
         updated_at = now()`,
      [session.sub, session.email, player.tag, player.name, JSON.stringify(player)],
    );

    res.json({ linked: true, player });
  } catch (error) {
    req.log?.error?.({ error }, "Player account linking failed");
    res.status(502).json({ message: "Could not link the player right now. Please try again." });
  }
});

export default router;
