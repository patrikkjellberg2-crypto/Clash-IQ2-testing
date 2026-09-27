import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Swords, Target } from 'lucide-react';
import { Link } from 'wouter';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { AppSidebar } from '@/components/app-sidebar';

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => (v && typeof v === 'object' ? (v as Dict) : {});
const s = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

/** Clash timestamps look like "20240115T120000.000Z". Falls back to Date.parse. */
function toDateLabel(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  const clash = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  const timestamp = clash
    ? Date.UTC(+clash[1], +clash[2] - 1, +clash[3], +clash[4], +clash[5], +clash[6])
    : Date.parse(raw);
  if (Number.isNaN(timestamp)) return '—';
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type ClanTrendPoint = {
  warId: string;
  endTime: string | null;
  opponentName: string | null;
  result: string | null;
  ourStars: number;
  ourDestruction: number;
  opponentStars: number;
  opponentDestruction: number;
};

type Mover = {
  playerTag: string;
  playerName: string;
  trend: 'improving' | 'declining' | 'stable';
  recentAvgStars: number;
  previousAvgStars: number;
  recentAvgDestruction: number;
  previousAvgDestruction: number;
  warsCounted: number;
};

type PlayerTrendPoint = {
  warId: string;
  endTime: string | null;
  opponentName: string | null;
  result: string | null;
  attacksUsed: number;
  stars: number;
  destruction: number;
};

const TREND_STYLE: Record<Mover['trend'], { icon: typeof TrendingUp; label: string; className: string }> = {
  improving: { icon: TrendingUp, label: 'Improving', className: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/[.06]' },
  declining: { icon: TrendingDown, label: 'Declining', className: 'text-rose-300 border-rose-400/20 bg-rose-400/[.06]' },
  stable: { icon: Minus, label: 'Stable', className: 'text-slate-300 border-white/10 bg-white/[.02]' },
};

const CHART_GRID = 'rgba(255,255,255,.06)';
const CHART_TICK = { fill: '#64748b', fontSize: 11 };

function ChartCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-white/[.08] bg-[#0b1119] p-5">
      <div className="border-b border-white/[.06] pb-4">
        <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-black">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="mt-4 h-[280px] w-full">{children}</div>
    </section>
  );
}

export default function TrendsPage() {
  const { data, isLoading: dashboardLoading } = useGetClashDashboard();
  const dashboard = data as unknown as Dict | undefined;
  const clan = d(dashboard?.clan);
  const clanTag = s(dashboard?.clanTag, '#2Q0Q82C9R');

  const [selectedPlayerTag, setSelectedPlayerTag] = useState<string | null>(null);

  const clanTrendQuery = useQuery({
    queryKey: ['clash-trends-clan', clanTag],
    enabled: Boolean(clanTag),
    queryFn: async (): Promise<ClanTrendPoint[]> => {
      const response = await fetch(`/api/clash/trends/clan?clanTag=${encodeURIComponent(clanTag)}&wars=20`);
      if (!response.ok) throw new Error('Failed to load clan trends');
      const body = await response.json();
      return Array.isArray(body?.wars) ? body.wars : [];
    },
  });

  const moversQuery = useQuery({
    queryKey: ['clash-trends-movers', clanTag],
    enabled: Boolean(clanTag),
    queryFn: async (): Promise<Mover[]> => {
      const response = await fetch(`/api/clash/trends/movers?clanTag=${encodeURIComponent(clanTag)}`);
      if (!response.ok) throw new Error('Failed to load player movers');
      const body = await response.json();
      return Array.isArray(body?.players) ? body.players : [];
    },
  });

  const movers = moversQuery.data ?? [];
  const activePlayerTag = selectedPlayerTag ?? movers[0]?.playerTag ?? null;

  const playerTrendQuery = useQuery({
    queryKey: ['clash-trends-player', clanTag, activePlayerTag],
    enabled: Boolean(clanTag && activePlayerTag),
    queryFn: async (): Promise<PlayerTrendPoint[]> => {
      const response = await fetch(
        `/api/clash/trends/player/${encodeURIComponent(activePlayerTag as string)}?clanTag=${encodeURIComponent(clanTag)}&wars=20`,
      );
      if (!response.ok) throw new Error('Failed to load player trend');
      const body = await response.json();
      return Array.isArray(body?.wars) ? body.wars : [];
    },
  });

  const clanChartData = useMemo(
    () =>
      (clanTrendQuery.data ?? []).map((war) => ({
        label: toDateLabel(war.endTime),
        opponent: war.opponentName ?? 'Unknown',
        'Our stars': war.ourStars,
        'Opponent stars': war.opponentStars,
        'Our destruction %': Math.round(war.ourDestruction),
        'Opponent destruction %': Math.round(war.opponentDestruction),
      })),
    [clanTrendQuery.data],
  );

  const playerChartData = useMemo(
    () =>
      (playerTrendQuery.data ?? []).map((war) => ({
        label: toDateLabel(war.endTime),
        opponent: war.opponentName ?? 'Unknown',
        Stars: war.stars,
        'Destruction %': war.destruction,
      })),
    [playerTrendQuery.data],
  );

  const activePlayerName = movers.find((m) => m.playerTag === activePlayerTag)?.playerName ?? activePlayerTag ?? '';

  if (dashboardLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] text-white">
        <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Loading trends...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-[100dvh]">
        <AppSidebar clanName={s(clan.name, 'BHABE DHEMONS')} clanTag={clanTag} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-3 md:px-8 md:pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-amber-300 hover:text-amber-200"
            >
              <ArrowLeft className="size-4" />
              Command Center
            </Link>

            <header className="mt-4 border-b border-white/[.06] pb-5">
              <p className="text-[9px] font-black uppercase tracking-[.22em] text-slate-500">CLASHIQ / Intelligence</p>
              <h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Trends</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                How the clan - and individual members - have performed over the wars Clash IQ has archived, not just the
                short window the live API exposes.
              </p>
            </header>

            <ChartCard
              eyebrow="Clan"
              title="War performance over time"
              subtitle={
                clanChartData.length
                  ? `Stars and destruction for the last ${clanChartData.length} archived wars`
                  : 'No archived wars yet - play a few wars for Clash IQ to build this history'
              }
            >
              {clanTrendQuery.isLoading ? (
                <div className="grid h-full place-items-center text-xs text-slate-500">Loading...</div>
              ) : clanChartData.length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-slate-500">Nothing to chart yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={clanChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke={CHART_GRID} vertical={false} />
                    <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
                    <YAxis tick={CHART_TICK} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0b1119', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#f59e0b', fontWeight: 700 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Our stars" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Opponent stars" stroke="#64748b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <section className="mt-5 rounded-2xl border border-white/[.08] bg-[#0b1119] p-5">
              <div className="flex items-end justify-between gap-4 border-b border-white/[.06] pb-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">Members</p>
                  <h2 className="mt-1 text-xl font-black">Trending up or down</h2>
                </div>
                <span className="rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">
                  Last 5 wars vs. previous 5
                </span>
              </div>

              {moversQuery.isLoading ? (
                <div className="mt-4 text-xs text-slate-500">Loading...</div>
              ) : movers.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                  Not enough archived wars yet to detect trends.
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {movers.map((mover) => {
                    const style = TREND_STYLE[mover.trend];
                    const Icon = style.icon;
                    const active = mover.playerTag === activePlayerTag;
                    return (
                      <button
                        key={mover.playerTag}
                        type="button"
                        onClick={() => setSelectedPlayerTag(mover.playerTag)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                          active ? 'border-amber-400/40 bg-amber-400/[.08]' : 'border-white/[.08] bg-white/[.02] hover:bg-white/[.05]'
                        }`}
                      >
                        <span className={`grid size-7 shrink-0 place-items-center rounded-lg border ${style.className}`}>
                          <Icon className="size-3.5" />
                        </span>
                        <span>
                          <span className="block text-xs font-bold">{mover.playerName}</span>
                          <span className="block text-[10px] text-slate-500">
                            {mover.recentAvgStars.toFixed(1)}★ avg ({style.label.toLowerCase()})
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <ChartCard
              eyebrow="Player"
              title={activePlayerName ? `${activePlayerName}'s performance over time` : 'Player performance over time'}
              subtitle={
                playerChartData.length
                  ? `Stars and destruction across ${playerChartData.length} archived wars`
                  : activePlayerTag
                    ? 'No archived attacks for this player yet'
                    : 'Pick a member above to see their trend'
              }
            >
              {!activePlayerTag ? (
                <div className="grid h-full place-items-center text-xs text-slate-500">
                  <Target className="mx-auto mb-2 size-6 text-slate-600" />
                  Select a member above
                </div>
              ) : playerTrendQuery.isLoading ? (
                <div className="grid h-full place-items-center text-xs text-slate-500">Loading...</div>
              ) : playerChartData.length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-slate-500">
                  <Swords className="mx-auto mb-2 size-6 text-slate-600" />
                  Nothing archived for this player yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={playerChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke={CHART_GRID} vertical={false} />
                    <XAxis dataKey="label" tick={CHART_TICK} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
                    <YAxis tick={CHART_TICK} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0b1119', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#f59e0b', fontWeight: 700 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Stars" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Destruction %" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </main>
      </div>
    </div>
  );
}
