import { Router, type IRouter } from "express";

const router: IRouter = Router();

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
</style>
</head>
<body><main><div class="card">
<div class="muted">CLASH IQ · PRIVATE TEST</div>
<h1>Welcome to your Clash IQ account</h1>
<p class="muted">Your Google account is now connected. Next, connect your Clash of Clans player.</p>
<div id="status">Checking your session…</div>
<div id="app" hidden>
<div class="user"><img id="avatar" class="avatar" alt=""><div><strong id="name"></strong><div id="email" class="muted"></div></div></div>
<h2>Connect your Clash of Clans player</h2>
<p class="muted">Enter your player tag. We will fetch the live player data before we build the permanent account link.</p>
<input id="tag" placeholder="#PLAYER_TAG" autocomplete="off">
<button id="connect">Find player</button>
<div id="result" class="result" hidden></div>
<p style="margin-top:28px"><a href="/auth/logout">Sign out</a></p>
</div></div></main>
<script>
(async()=>{
 const status=document.getElementById('status'), app=document.getElementById('app');
 try{
  const r=await fetch('/api/me',{credentials:'same-origin'}), me=await r.json();
  if(!me.authenticated){status.innerHTML='You are not signed in. <a href="/auth/google?returnTo=%2Faccount">Continue with Google</a>';return;}
  status.remove(); app.hidden=false;
  document.getElementById('name').textContent=me.user.name||'Clash IQ user';
  document.getElementById('email').textContent=me.user.email;
  if(me.user.picture) document.getElementById('avatar').src=me.user.picture;
 }catch(e){status.textContent='Could not check the Clash IQ session.'}
 document.getElementById('connect').onclick=async()=>{
  const tag=document.getElementById('tag').value.trim().replace(/^#?/, '#').toUpperCase();
  const box=document.getElementById('result'); box.hidden=false; box.textContent='Looking up player…';
  if(!/^#[A-Z0-9]{3,15}$/.test(tag)){box.textContent='Enter a valid Clash of Clans player tag.';return;}
  try{
   const r=await fetch('/api/clash/player/'+encodeURIComponent(tag),{credentials:'same-origin'});
   const data=await r.json();
   if(!r.ok){box.textContent=data.message||'Player could not be found.';return;}
   box.innerHTML='<strong>'+String(data.name||'Player')+'</strong><br>'+tag+
     '<br>Town Hall: '+String(data.townHallLevel||data.townHall||'–')+
     '<br>Trophies: '+String(data.trophies??'–')+
     '<br>War stars: '+String(data.warStars??'–')+
     '<br><br><span class="muted">Player found. Permanent account linking is the next step.</span>';
  }catch(e){box.textContent='Could not reach the Clash IQ player service.'}
 };
})();
</script></body></html>`);
});

export default router;
