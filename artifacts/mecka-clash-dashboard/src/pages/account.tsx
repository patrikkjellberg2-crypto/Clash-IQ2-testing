import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, BarChart3, Crown, Gamepad2, LogOut, RefreshCw, Settings, Shield, Sparkles, Swords, Trophy, Users, Zap } from "lucide-react";

type User={name?:string|null;email?:string;picture?:string|null;player_tag?:string|null;premium_status?:string;premium_until?:string|null};
type R=Record<string,any>;
const val=(v:unknown,f="—")=>v===null||v===undefined||v===""?f:String(v);
const num=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)?v:0;
const dateText=(v:unknown)=>{if(!v)return "";const d=new Date(String(v));return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString("sv-SE",{year:"numeric",month:"long",day:"numeric"});};

function openClashIQ(){
 const isAndroid=/Android/i.test(navigator.userAgent);
 if(!isAndroid){window.location.assign("/");return;}
 let fallback=window.setTimeout(()=>window.location.assign("/"),1800);
 const cancel=()=>{window.clearTimeout(fallback);document.removeEventListener("visibilitychange",cancel);};
 document.addEventListener("visibilitychange",cancel,{once:true});
 window.location.assign("clashiq://open");
}

export default function AccountPage(){
 const[,navigate]=useLocation(); const[user,setUser]=useState<User|null>(null); const[player,setPlayer]=useState<R|null>(null); const[loading,setLoading]=useState(true); const[refreshing,setRefreshing]=useState(false); const[error,setError]=useState("");
 async function load(refresh=false){
  if(refresh)setRefreshing(true);else setLoading(true);setError("");
  try{
   const me=await fetch("/api/auth/me",{credentials:"include"}); if(!me.ok){navigate("/login");return;}
   const md=await me.json(); const u=md.user as User; setUser(u);
   if(!u.player_tag){setPlayer(null);return;}
   const r=await fetch("/api/clash/player/"+encodeURIComponent(u.player_tag),{credentials:"include",headers:{Accept:"application/json"},cache:"no-store"});
   const d=await r.json(); if(!r.ok)throw Error(d?.error||"Could not load player data"); setPlayer(d.player??d);
  }catch(e){setError(e instanceof Error?e.message:"Could not load account data");}
  finally{setLoading(false);setRefreshing(false);}
 }
 useEffect(()=>{void load();},[]);
 async function logout(){try{await fetch("/api/auth/logout",{method:"POST",credentials:"include"});}finally{navigate("/website");}}
 if(loading)return <div className="min-h-screen bg-[#05070b] p-5 text-white"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-20 rounded-3xl bg-white/5"/><div className="h-64 rounded-3xl bg-white/5"/><div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-36 rounded-2xl bg-white/5"/>)}</div></div></div>;
 const premium=user?.premium_status==="lifetime"||user?.premium_status==="premium";
 const clan=player?.clan as R|undefined, league=player?.league as R|undefined, stats=(player?.historicalWarStats??{}) as R, activity=(player?.activity??{}) as R;
 const townHall=num(player?.townHallLevel??player?.town_hall_level), trophies=num(player?.trophies), best=num(player?.bestTrophies), warStars=num(player?.warStars), attacks=num(stats.totalAttacks), avg=num(stats.averageStarsPerAttack), three=attacks?Math.round(num(stats.threeStarAttacks)/attacks*100):0, activityScore=num(activity.score);
 const heroes=Array.isArray(player?.heroes)?player.heroes.length:0, troops=Array.isArray(player?.troops)?player.troops.length:0, achievements=Array.isArray(player?.achievements)?player.achievements.length:0;
 return <div className="min-h-screen bg-[#05070b] text-white">
  <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070b]/90 backdrop-blur-xl"><div className="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between gap-4 px-5">
   <button onClick={()=>navigate("/website")} className="flex items-center gap-3"><img src="/clash-iq-logo.webp" className="h-12 w-12 rounded-2xl object-cover" alt="Clash IQ"/><div className="hidden sm:block"><p className="text-lg font-black">Clash IQ</p><p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/35">Account Center</p></div></button>
   <div className="flex items-center gap-2"><button onClick={()=>void load(true)} disabled={refreshing} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/60"><RefreshCw className={refreshing?"size-4 animate-spin":"size-4"}/></button><button onClick={openClashIQ} className="hidden rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-xs font-black text-amber-200 sm:inline-flex">Open Clash IQ</button><button onClick={()=>void logout()} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/55" title="Log out"><LogOut className="size-4"/></button></div>
  </div></header>
  <main className="mx-auto max-w-6xl space-y-5 px-5 py-7 md:py-9">
   {error&&<div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">{error}</div>}
   <section className="relative overflow-hidden rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-[#1b160a] via-[#0f131a] to-[#080b11] p-6 shadow-2xl md:p-8"><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"/><div className="relative flex flex-col gap-6 md:flex-row md:items-center">
    {user?.picture?<img src={user.picture} className="size-20 rounded-3xl border border-white/10 object-cover" alt=""/>:<div className="grid size-20 place-items-center rounded-3xl border border-amber-400/20 bg-amber-400/10 text-amber-300"><Crown className="size-9"/></div>}
    <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.25em] text-amber-300/70">Your Clash IQ account</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">{val(user?.name,"Clash IQ User")}</h1><p className="mt-1 truncate text-sm text-white/40">{val(user?.email)}</p></div>
    <div className="rounded-2xl border border-amber-400/20 bg-black/20 px-5 py-4"><div className="flex items-center gap-2 text-amber-300"><Crown className="size-4"/><span className="text-xs font-black uppercase tracking-wider">{premium?"Premium":"Free"}</span></div><p className="mt-1 text-sm font-bold">{premium?"Lifetime Premium":"Free plan"}</p>{user?.premium_until&&<p className="mt-1 text-[10px] text-white/35">Until {dateText(user.premium_until)}</p>}</div>
   </div></section>
   <section className="grid gap-4 md:grid-cols-3">
    <article className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-transparent p-5"><div className="flex items-center gap-3"><Crown className="size-5 text-amber-300"/><p className="text-xs font-black uppercase tracking-wider text-amber-200">Membership</p></div><h2 className="mt-3 text-2xl font-black">{premium?"Lifetime Premium":"Free"}</h2><p className="mt-2 text-sm leading-6 text-white/45">{premium?"Your account has permanent Premium access.":"Upgrade to unlock the full Clash IQ experience."}</p><button onClick={()=>navigate("/settings")} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs font-black text-amber-200">Manage membership <ArrowRight className="size-3.5"/></button></article>
    <article className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex items-center gap-3"><Gamepad2 className="size-5 text-blue-300"/><p className="text-xs font-black uppercase tracking-wider text-blue-200">Connected player</p></div>{user?.player_tag?<><h2 className="mt-3 text-xl font-black">{val(player?.name,"Player")}</h2><p className="mt-1 font-mono text-xs text-white/35">{user.player_tag}</p><p className="mt-3 text-sm text-white/50">{val(clan?.name,"No clan connected")}</p></>:<><h2 className="mt-3 text-xl font-black">No player connected</h2><button onClick={()=>navigate("/connect-player")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-400 px-4 py-2.5 text-xs font-black text-black">Connect Player Tag <ArrowRight className="size-3.5"/></button></>}</article>
    <article className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex items-center gap-3"><Shield className="size-5 text-emerald-300"/><p className="text-xs font-black uppercase tracking-wider text-emerald-200">Clan</p></div><h2 className="mt-3 text-xl font-black">{val(clan?.name,"Not connected")}</h2><p className="mt-1 text-xs text-white/35">{val(clan?.tag,"")}</p>{player&&<p className="mt-3 text-sm text-white/50">Role: {val(player?.role,"member")}</p>}</article>
   </section>
   {player?<><section className="rounded-2xl border border-white/10 bg-[#0b1018]/90 p-5 md:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-300/70">Player progress</p><h2 className="mt-1 text-2xl font-black">Your Clash profile at a glance</h2></div><button onClick={()=>navigate("/my-player")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs font-black text-white/75">Full player profile <ArrowRight className="size-3.5"/></button></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Progress icon={Trophy} label="Town Hall" value={townHall||"—"} detail={trophies.toLocaleString()+" trophies"}/><Progress icon={Swords} label="War stars" value={warStars} detail={attacks+" archived attacks"}/><Progress icon={Zap} label="Activity" value={activityScore} detail={val(activity.label,"No activity data")}/><Progress icon={Sparkles} label="3★ rate" value={three+"%"} detail={avg.toFixed(2)+" avg stars / attack"}/></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><Mini label="Heroes / pets" value={heroes}/><Mini label="Troops" value={troops}/><Mini label="Achievements" value={achievements}/></div>
    <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/[.05] px-3 py-1.5 text-white/55">Best trophies: {best.toLocaleString()}</span><span className="rounded-full bg-blue-400/10 px-3 py-1.5 text-blue-300">{val(league?.name,"League unavailable")}</span></div>
   </section><section className="grid gap-4 md:grid-cols-4"><Quick icon={Swords} title="War Center" text="Current war and attacks" href="/" navigate={navigate}/><Quick icon={BarChart3} title="Statistics" text="Detailed player stats" href="/statistics" navigate={navigate}/><Quick icon={Users} title="My Clan" text="Roster and clan intelligence" href="/members" navigate={navigate}/><Quick icon={Settings} title="Settings" text="App and notification settings" href="/settings" navigate={navigate}/></section></>:<section className="rounded-3xl border border-blue-400/15 bg-blue-400/[.04] p-7 text-center"><Gamepad2 className="mx-auto size-10 text-blue-300"/><h2 className="mt-4 text-2xl font-black">Connect your Clash of Clans player</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/45">Your account is ready. Connect your Player Tag once and Clash IQ will use it for your personal stats, progress and clan data.</p><button onClick={()=>navigate("/connect-player")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-black text-black">Connect Player Tag <ArrowRight className="size-4"/></button></section>}
   <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between"><span>Clash IQ Account Center · {val(user?.email)}</span><button onClick={()=>void logout()} className="inline-flex items-center gap-2 text-white/45"><LogOut className="size-3.5"/> Log out</button></footer>
  </main>
 </div>;
}
function Progress({icon:Icon,label,value,detail}:{icon:typeof Trophy;label:string;value:string|number;detail:string}){return <div className="rounded-2xl border border-white/5 bg-white/[.025] p-4"><div className="flex items-center gap-2 text-white/45"><Icon className="size-4"/><span className="text-[10px] font-black uppercase tracking-wider">{label}</span></div><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-1 text-[11px] text-white/30">{detail}</p></div>;}
function Mini({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-white/5 bg-black/15 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wider text-white/25">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;}
function Quick({icon:Icon,title,text,href,navigate}:{icon:typeof Swords;title:string;text:string;href:string;navigate:(to:string)=>void}){return <button onClick={()=>navigate(href)} className="group rounded-2xl border border-white/10 bg-[#0b1018] p-5 text-left transition hover:border-amber-400/20 hover:bg-white/[.04]"><Icon className="size-5 text-amber-300"/><p className="mt-4 font-black">{title}</p><p className="mt-1 text-xs text-white/35">{text}</p><ArrowRight className="mt-4 size-4 text-white/25 group-hover:translate-x-1 group-hover:text-amber-300"/></button>;}
