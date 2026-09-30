import { useEffect, useState } from "react";
import { Activity, ArrowLeft, BrainCircuit, Gauge, ShieldAlert, Users } from "lucide-react";
import { Link } from "wouter";

type Usage=any;
export default function AdminPage(){
  const [key,setKey]=useState(()=>localStorage.getItem("clashiq-admin-key")||"");
  const [usage,setUsage]=useState<Usage|null>(null);
  const [error,setError]=useState("");
  const [daily,setDaily]=useState("25");
  const [hourly,setHourly]=useState("8");
  const [enabled,setEnabled]=useState(true);
  const load=async()=>{setError("");const r=await fetch("/api/admin/ai-usage",{headers:{"X-ClashIQ-Admin-Key":key}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load admin data");setUsage(d);setDaily(String(d.limits.daily));setHourly(String(d.limits.hourly));setEnabled(Boolean(d.limits.enabled));localStorage.setItem("clashiq-admin-key",key);};
  useEffect(()=>{if(key)void load().catch(e=>setError(e.message));},[]);
  const save=async()=>{setError("");const r=await fetch("/api/admin/ai-usage/controls",{method:"POST",headers:{"Content-Type":"application/json","X-ClashIQ-Admin-Key":key},body:JSON.stringify({daily:Number(daily),hourly:Number(hourly),enabled})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not update controls");setUsage(d);};
  return <div className="min-h-[100dvh] bg-[#07090d] text-white p-5 md:p-8">
    <main className="mx-auto max-w-[1200px] space-y-5">
      <div className="flex items-center justify-between">
        <div><Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-300"><ArrowLeft className="h-4 w-4"/>Back to Command Center</Link><h1 className="mt-3 text-3xl font-black">Clash IQ Admin</h1><p className="mt-1 text-sm text-slate-500">AI usage, limits and safety controls</p></div>
        <BrainCircuit className="h-8 w-8 text-amber-300"/>
      </div>
      <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end"><label className="flex-1"><span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Admin key</span><input value={key} onChange={e=>setKey(e.target.value)} type="password" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-amber-400/40"/></label><button onClick={()=>void load().catch(e=>setError(e.message))} className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-xs font-black uppercase text-amber-200">Load usage</button></div>
      </section>
      {error&&<div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>}
      {usage&&<><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Activity} label="Today" value={usage.today.requests} sub="AI requests"/>
        <Stat icon={Users} label="Clients" value={usage.today.uniqueClients} sub="Unique clients today"/>
        <Stat icon={Gauge} label="7 days" value={usage.week.requests} sub="AI requests"/>
        <Stat icon={ShieldAlert} label="Status" value={usage.limits.enabled?"ON":"OFF"} sub="Global AI switch"/>
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5">
        <div className="mb-4"><h2 className="text-lg font-black">AI safety controls</h2><p className="text-xs text-slate-500">Runtime controls take effect immediately. 0 means unlimited.</p></div>
        <div className="grid gap-3 md:grid-cols-3"><Field label="Daily limit / client" value={daily} setValue={setDaily}/><Field label="Hourly limit / client" value={hourly} setValue={setHourly}/><button onClick={()=>{setEnabled(!enabled);}} className={`rounded-xl border px-4 py-3 text-xs font-black uppercase ${enabled?"border-emerald-400/20 bg-emerald-400/10 text-emerald-300":"border-red-400/20 bg-red-400/10 text-red-300"}`}>AI {enabled?"Enabled":"Disabled"}</button></div>
        <button onClick={()=>void save().catch(e=>setError(e.message))} className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 text-xs font-black uppercase text-amber-200">Save controls</button>
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5"><h2 className="text-lg font-black">Top AI clients today</h2><div className="mt-4 space-y-2">{usage.byClient.map((x:any)=><div key={x.client} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.02] p-3"><div><p className="text-xs font-bold text-white">{x.client.slice(0,24)}</p><p className="text-[10px] text-slate-600">{new Date(x.lastAt).toLocaleString()}</p></div><span className="text-sm font-black text-amber-300">{x.requests} calls</span></div>)}</div></section></>}
    </main>
  </div>;
}
function Stat({icon:Icon,label,value,sub}:{icon:any;label:string;value:any;sub:string}){return <div className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5"><Icon className="h-5 w-5 text-amber-300"/><p className="mt-3 text-[9px] font-black uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-3xl font-black">{value}</p><p className="mt-1 text-[10px] text-slate-600">{sub}</p></div>}
function Field({label,value,setValue}:{label:string;value:string;setValue:(v:string)=>void}){return <label><span className="text-[9px] font-black uppercase tracking-wider text-slate-600">{label}</span><input type="number" min="0" value={value} onChange={e=>setValue(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-amber-400/40"/></label>}
