import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, ArrowUpDown, Shield, Swords, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { AppSidebar } from '@/components/app-sidebar';
import { MemberDetailsDialog } from '@/components/member-details-dialog';

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => v && typeof v === 'object' ? (v as Dict) : {};
const arr = (v: unknown): Dict[] => Array.isArray(v) ? v.map(d) : [];
const s = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
const n = (v: unknown, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const initials = (name: string) => name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'CQ';

type SortKey = 'score' | 'participationRate' | 'attackUtilizationRate' | 'attacksUsed';

function scoreTone(score: number) {
  if (score >= 80) return 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20';
  if (score >= 60) return 'text-amber-300 bg-amber-400/10 border-amber-400/20';
  return 'text-red-300 bg-red-400/10 border-red-400/20';
}

function Loading() {
  return <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] text-white"><div className="text-center"><Activity className="mx-auto size-8 animate-pulse text-amber-300"/><p className="mt-3 text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Loading activity intelligence...</p></div></div>;
}

export default function ActivityPage() {
  const { data, isLoading: dashboardLoading, isError: dashboardError } = useGetClashDashboard();
  const dashboard = data as unknown as Dict | undefined;
  const clan = d(dashboard?.clan);
  const clanTag = s(dashboard?.clanTag);
  const [players, setPlayers] = useState<Dict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [selected, setSelected] = useState<Dict | null>(null);

  useEffect(() => {
    if (!clanTag) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch('/api/clash/activity?clanTag=' + encodeURIComponent(clanTag), { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('activity unavailable')))
      .then(payload => { if (!cancelled) setPlayers(arr(payload?.players)); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clanTag]);

  const sorted = useMemo(() => [...players].sort((a,b) => n(b[sortKey]) - n(a[sortKey])), [players, sortKey]);
  const avg = players.length ? Math.round(players.reduce((t,p)=>t+n(p.score),0)/players.length) : 0;
  const high = players.filter(p=>n(p.score)>=80).length;
  const low = players.filter(p=>n(p.score)<60).length;
  const tracked = players.length ? Math.max(...players.map(p=>n(p.warsTracked))) : 0;

  if (dashboardLoading) return <Loading />;
  if (dashboardError) return <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] p-6 text-white"><div className="rounded-3xl border border-white/10 bg-[#0b1119] p-8 text-center"><Shield className="mx-auto size-8 text-red-300"/><h1 className="mt-4 text-2xl font-black">Activity Offline</h1><p className="mt-2 text-sm text-slate-500">CLASHIQ could not load the clan data.</p></div></div>;

  return <div className="min-h-[100dvh] bg-[#07090d] text-white">
    <div className="flex min-h-[100dvh]">
      <AppSidebar clanName={s(clan.name,'CLASHIQ')} clanTag={clanTag || '#2Q0Q82C9R'}/>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-4 md:px-8 md:pt-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-amber-300 hover:text-amber-200"><ArrowLeft className="size-4"/>Command Center</Link>
          <header className="mt-4 border-b border-white/[.06] pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.22em] text-amber-300">CLASHIQ / Intelligence</p>
                <h1 className="mt-1 text-3xl font-black tracking-[-.04em] sm:text-4xl">Member Activity</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">See who consistently shows up for clan wars. Activity measures participation and attack usage — not attack quality.</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[.04] px-4 py-2"><Activity className="size-4 text-emerald-400"/><span className="text-[10px] font-black uppercase tracking-[.15em] text-emerald-300">War activity online</span></div>
            </div>
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [Activity,'Average Activity',avg+'%', 'Across the current roster'],
              [Zap,'Highly Active',String(high), '80%+ activity score'],
              [Users,'Low Activity',String(low), 'Below 60% activity'],
              [Swords,'Wars Tracked',String(tracked), 'Completed wars in window'],
            ].map(([Icon,label,value,detail]: any)=><article key={label} className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5 shadow-[0_16px_50px_rgba(0,0,0,.18)]"><div className="grid size-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/[.06] text-amber-300"><Icon className="size-5"/></div><p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>)}
          </section>

          <section className="mt-5 overflow-hidden rounded-2xl border border-white/[.08] bg-[#0b1119] shadow-[0_16px_50px_rgba(0,0,0,.18)]">
            <div className="flex flex-col gap-3 border-b border-white/[.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-blue-300">War participation</p><h2 className="mt-1 text-xl font-black">Activity Leaderboard</h2></div>
              <div className="flex flex-wrap gap-2">
                {([['score','Activity'],['participationRate','Participation'],['attackUtilizationRate','Attack usage'],['attacksUsed','Attacks']] as [SortKey,string][]).map(([key,label])=><button key={key} onClick={()=>setSortKey(key)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[9px] font-black uppercase tracking-wider transition ${sortKey===key?'border-amber-400/25 bg-amber-400/10 text-amber-300':'border-white/10 bg-white/[.02] text-slate-500 hover:text-slate-300'}`}><ArrowUpDown className="size-3"/>{label}</button>)}
              </div>
            </div>

            {loading ? <div className="p-10 text-center text-sm text-slate-500">Calculating activity...</div> :
             error ? <div className="p-10 text-center text-sm text-red-300">Activity data could not be loaded.</div> :
             sorted.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No completed war activity is available yet.</div> :
             <div className="divide-y divide-white/[.05]">
               {sorted.map((player,index)=>{
                 const score=n(player.score), name=s(player.playerName,'Unknown player'), tag=s(player.playerTag);
                 const member=arr(dashboard?.members).find(m=>s(m.tag).toUpperCase()===tag.toUpperCase());
                 return <button type="button" key={tag||name} onClick={()=>setSelected(member || {tag,name})} className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-white/[.025] md:grid-cols-[42px_minmax(180px,1.4fr)_1.2fr_150px_150px_120px] md:items-center">
                   <span className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-xs font-black text-slate-400">{index+1}</span>
                   <span className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-400/15 bg-amber-400/[.05] text-xs font-black text-amber-300">{initials(name)}</span><span className="min-w-0"><span className="block truncate font-black">{name}</span><span className="block truncate text-[9px] font-mono text-slate-600">{tag}</span></span></span>
                   <span><span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${scoreTone(score)}`}>{score}%</span><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-emerald-400" style={{width:`${score}%`}}/></span></span>
                   <span><span className="block text-xs font-black">{n(player.participatedWars)}/{n(player.warsTracked)}</span><span className="text-[9px] uppercase tracking-wider text-slate-600">wars</span></span>
                   <span><span className="block text-xs font-black">{n(player.attacksUsed)}/{n(player.attacksPossible)}</span><span className="text-[9px] uppercase tracking-wider text-slate-600">attacks</span></span>
                   <span><span className="block text-xs font-black">{Math.round(n(player.participationRate))}% / {Math.round(n(player.attackUtilizationRate))}%</span><span className="text-[9px] uppercase tracking-wider text-slate-600">participation / usage</span></span>
                 </button>
               })}
             </div>}
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5"><Target className="size-5 text-blue-300"/><h3 className="mt-3 text-sm font-black">What the score means</h3><p className="mt-2 text-xs leading-5 text-slate-500">The current score combines war participation with how consistently a player uses their available attacks.</p></div>
            <div className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5"><TrendingUp className="size-5 text-emerald-300"/><h3 className="mt-3 text-sm font-black">Activity, not skill</h3><p className="mt-2 text-xs leading-5 text-slate-500">A high activity score means the player shows up and uses attacks. It does not rate stars, destruction or attack quality.</p></div>
            <div className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5"><Swords className="size-5 text-amber-300"/><h3 className="mt-3 text-sm font-black">Current window</h3><p className="mt-2 text-xs leading-5 text-slate-500">The activity meter is based on the last completed wars available to the archive, currently up to 10 wars.</p></div>
          </section>
        </div>
      </main>
    </div>
    <MemberDetailsDialog member={selected} onClose={()=>setSelected(null)}/>
  </div>;
}
