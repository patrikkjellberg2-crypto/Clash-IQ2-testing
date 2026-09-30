import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, ArrowUpDown, Flame, Shield, Swords, Star, Target, Users } from 'lucide-react';
import { Link } from 'wouter';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { AppSidebar } from '@/components/app-sidebar';
import { MemberDetailsDialog } from '@/components/member-details-dialog';

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => v && typeof v === 'object' ? (v as Dict) : {};
const arr = (v: unknown): Dict[] => Array.isArray(v) ? v.map(d) : [];
const s = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
const n = (v: unknown, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;

type SortKey = 'participationRate' | 'attackUtilizationRate' | 'attacksUsed' | 'warsTracked';

function Loading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] text-white">
      <div className="text-center">
        <Activity className="mx-auto size-8 animate-pulse text-amber-300" />
        <p className="mt-3 text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Loading war activity...</p>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { data, isLoading: dashboardLoading, isError: dashboardError } = useGetClashDashboard();
  const dashboard = data as unknown as Dict | undefined;
  const clan = d(dashboard?.clan);
  const clanTag = s(dashboard?.clanTag);
  const [players, setPlayers] = useState<Dict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('participationRate');
  const [selected, setSelected] = useState<Dict | null>(null);
  const [intelligence, setIntelligence] = useState<Dict[]>([]);

  useEffect(() => {
    if (!clanTag) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch('/api/clash/activity?clanTag=' + encodeURIComponent(clanTag), {
      headers: { Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('activity unavailable')))
      .then(payload => {
        if (!cancelled) setPlayers(arr(payload?.players));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [clanTag]);

  useEffect(() => {
    if (!clanTag) return;
    let cancelled = false;

    fetch('/api/clash/war-intelligence?clanTag=' + encodeURIComponent(clanTag), {
      headers: { Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('intelligence unavailable')))
      .then(payload => {
        if (!cancelled) setIntelligence(arr(payload?.players));
      })
      .catch(() => {
        if (!cancelled) setIntelligence([]);
      });

    return () => { cancelled = true; };
  }, [clanTag]);

  const cwlSelection = useMemo(() => {
    return intelligence
      .map(player => {
        const threeStarRate = n(player.threeStarRate);
        const destruction = n(player.recentAvgDestruction || player.avgDestruction);
        const recentStars = n(player.recentAvgStars || player.avgStars);
        const defenseHold = n(player.defenseHoldRate);
        const hasDefense = n(player.defenseAttacks) > 0;
        const formMultiplier = s(player.trend) === 'improving' ? 1.04 : s(player.trend) === 'declining' ? 0.94 : 1;
        // Transparent selection index: recent offense is weighted most,
        // then 3-star rate, destruction and defense holds.
        const base = recentStars / 3 * 45 + threeStarRate * 0.30 + destruction * 0.15 + (hasDefense ? defenseHold * 0.10 : 0);
        return { ...player, cwlScore: Math.round(Math.max(0, Math.min(100, base * formMultiplier))) };
      })
      .sort((a, b) => n(b.cwlScore) - n(a.cwlScore));
  }, [intelligence]);

  const sorted = useMemo(
    () => [...players].sort((a, b) => {
      const primary = n(b[sortKey]) - n(a[sortKey]);
      return primary || s(a.playerName).localeCompare(s(b.playerName));
    }),
    [players, sortKey],
  );

  const avgParticipation = players.length
    ? Math.round(players.reduce((sum, p) => sum + n(p.participationRate), 0) / players.length)
    : 0;
  const avgAttackUsage = players.length
    ? Math.round(players.reduce((sum, p) => sum + n(p.attackUtilizationRate), 0) / players.length)
    : 0;
  const trackedWars = players.length
    ? Math.max(...players.map(p => n(p.warsTracked)))
    : 0;
  const totalAttacks = players.reduce((sum, p) => sum + n(p.attacksUsed), 0);

  if (dashboardLoading) return <Loading />;

  if (dashboardError) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-[#0b1119] p-8 text-center">
          <h1 className="text-2xl font-black">Activity Offline</h1>
          <p className="mt-2 text-sm text-slate-500">CLASH IQ could not load the clan data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <AppSidebar clanName={s(clan.name, 'CLASH IQ')} clanTag={clanTag || '#2Q0Q82C9R'} />

      <main className="min-w-0 lg:pl-0">
        <button
          type="button"
          aria-label="Go back"
          title="Back"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = '/';
          }}
          className="fixed left-[4.75rem] top-4 z-40 grid size-11 place-items-center rounded-xl border border-amber-400/40 bg-[#0b0d12]/95 text-amber-300 shadow-[0_0_18px_rgba(245,190,60,.18)] backdrop-blur-xl transition hover:border-amber-300/70 hover:bg-amber-400/10 hover:text-amber-200 active:scale-95 lg:left-[278px]"
        >
          <ArrowLeft className="size-4" />
        </button>

        <div className="mx-auto max-w-[1155px] px-4 pb-10 sm:px-7">

          <div className="mb-5">
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-amber-300">CLASH IQ / War activity</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-.03em] sm:text-3xl">Member Activity</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Concrete war participation from the recorded archive. This page does not guess whether someone is online.
            </p>
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-amber-400/15 bg-[linear-gradient(135deg,rgba(245,190,60,.07),rgba(11,17,25,.98)_45%)] shadow-[0_16px_60px_rgba(0,0,0,.25)]">
            <div className="border-b border-white/[.06] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Flame className="size-5 text-amber-300" />
                    <p className="text-[9px] font-black uppercase tracking-[.22em] text-amber-300">CWL Selection</p>
                  </div>
                  <h2 className="mt-1 text-2xl font-black">Hetast just nu</h2>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    Senaste krigsformen vägs mot 3★-procent, destruction och försvar. Indexet är ett urvalsstöd – inte en ersättning för lagets beslut.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <Star className="mx-auto size-4 text-amber-300" />
                    <p className="mt-1 text-[8px] font-black uppercase text-slate-600">Offense</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <Target className="mx-auto size-4 text-blue-300" />
                    <p className="mt-1 text-[8px] font-black uppercase text-slate-600">3★ / dest.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <Shield className="mx-auto size-4 text-emerald-300" />
                    <p className="mt-1 text-[8px] font-black uppercase text-slate-600">Defense</p>
                  </div>
                </div>
              </div>
            </div>

            {cwlSelection.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Ingen tillräcklig krigsdata ännu.</div>
            ) : (
              <div className="divide-y divide-white/[.05]">
                {cwlSelection.slice(0, 15).map((player, index) => (
                  <div key={s(player.playerTag)} className="grid gap-3 px-5 py-4 md:grid-cols-[44px_minmax(180px,1.6fr)_repeat(4,1fr)] md:items-center">
                    <div className="grid size-9 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-sm font-black text-amber-300">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black">{s(player.playerName, 'Unknown player')}</p>
                      <p className="font-mono text-[9px] text-slate-600">{s(player.playerTag)}</p>
                      <span className="mt-1 inline-flex rounded-full border border-white/10 bg-white/[.03] px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-500">
                        {s(player.trend, 'stable')}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-black text-amber-300">{n(player.cwlScore)}</p>
                      <p className="text-[8px] uppercase tracking-wider text-slate-600">CWL index</p>
                    </div>
                    <div>
                      <p className="text-sm font-black">{n(player.threeStarRate).toFixed(1)}%</p>
                      <p className="text-[8px] uppercase tracking-wider text-slate-600">3★ rate</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-300">{n(player.recentAvgDestruction || player.avgDestruction).toFixed(1)}%</p>
                      <p className="text-[8px] uppercase tracking-wider text-slate-600">destruction</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-300">
                        {n(player.defenseAttacks) ? n(player.defenseHoldRate).toFixed(1) + '%' : '—'}
                      </p>
                      <p className="text-[8px] uppercase tracking-wider text-slate-600">defense holds</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [Users, 'Members tracked', String(players.length), 'Members with activity records'],
              [Activity, 'Avg. participation', avgParticipation + '%', 'Wars with recorded participation'],
              [Swords, 'Avg. attack usage', avgAttackUsage + '%', 'Available attacks that were used'],
              [Swords, 'Attacks recorded', String(totalAttacks), 'Across the tracked window'],
            ].map(([Icon, label, value, detail]: any) => (
              <article key={label} className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5 shadow-[0_16px_50px_rgba(0,0,0,.18)]">
                <div className="grid size-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/[.06] text-amber-300">
                  <Icon className="size-5" />
                </div>
                <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-slate-500">{label}</p>
                <p className="mt-1 text-3xl font-black">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-5 overflow-hidden rounded-2xl border border-white/[.08] bg-[#0b1119] shadow-[0_16px_50px_rgba(0,.18)]">
            <div className="flex flex-col gap-3 border-b border-white/[.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-blue-300">Recorded war data</p>
                <h2 className="mt-1 text-xl font-black">Participation Overview</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ['participationRate', 'Participation'],
                  ['attackUtilizationRate', 'Attack usage'],
                  ['attacksUsed', 'Attacks used'],
                  ['warsTracked', 'Wars tracked'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[9px] font-black uppercase tracking-wider transition ${sortKey === key ? 'border-amber-400/25 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/[.02] text-slate-500 hover:text-slate-300'}`}
                  >
                    <ArrowUpDown className="size-3" />{label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">Loading recorded war activity...</div>
            ) : error ? (
              <div className="p-10 text-center text-sm text-red-300">Activity data could not be loaded.</div>
            ) : sorted.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">No recorded war activity is available yet.</div>
            ) : (
              <div className="divide-y divide-white/[.05]">
                {sorted.map((player) => {
                  const name = s(player.playerName, 'Unknown player');
                  const tag = s(player.playerTag);
                  const member = arr(dashboard?.members).find(
                    m => s(m.tag).toUpperCase() === tag.toUpperCase(),
                  );

                  return (
                    <button
                      type="button"
                      key={tag || name}
                      onClick={() => setSelected(member || { tag, name })}
                      className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-white/[.025] md:grid-cols-[minmax(180px,1.5fr)_1fr_1fr_1fr_1fr] md:items-center"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-black">{name}</span>
                        <span className="block truncate text-[9px] font-mono text-slate-600">{tag}</span>
                      </span>
                      <span>
                        <span className="block text-xs font-black">{n(player.participatedWars)} / {n(player.warsTracked)}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">wars participated</span>
                      </span>
                      <span>
                        <span className="block text-xs font-black">{n(player.attacksUsed)} / {n(player.attacksPossible)}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">attacks used</span>
                      </span>
                      <span>
                        <span className="block text-xs font-black text-amber-300">{Math.round(n(player.participationRate))}%</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">participation</span>
                      </span>
                      <span>
                        <span className="block text-xs font-black text-blue-300">{Math.round(n(player.attackUtilizationRate))}%</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">attack usage</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <p className="mt-4 text-[10px] leading-5 text-slate-600">
            Window: up to {trackedWars || 10} completed wars available to the archive. Participation is based on recorded war data, not a live online-status signal.
          </p>
        </div>
      </main>

      <MemberDetailsDialog member={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
