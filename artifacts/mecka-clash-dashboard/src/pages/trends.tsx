import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingDown, TrendingUp, Minus, BarChart3, ArrowLeft } from "lucide-react";
import { useGetClashDashboard } from "@workspace/api-client-react";
import { AppSidebar } from "@/components/app-sidebar";
import { ClashIQInlineBanner } from "@/components/clashiq-inline-banner";
import { useLocation } from "wouter";

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => (v && typeof v === "object" ? (v as Dict) : {});
const s = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

type Mover = {
  playerTag: string;
  playerName: string;
  trend: "improving" | "declining" | "stable";
  recentAvgStars: number;
  previousAvgStars: number;
  recentAvgDestruction: number;
  previousAvgDestruction: number;
  warsCounted: number;
};

function dateLabel(value: unknown) {
  const raw = s(value);
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  const time = match
    ? Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])
    : Date.parse(raw);
  return Number.isNaN(time)
    ? "—"
    : new Date(time).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function trendDelta(mover: Mover) {
  return mover.recentAvgStars - mover.previousAvgStars;
}

export default function TrendsPage() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetClashDashboard();
  const dashboard = data as unknown as Dict | undefined;
  const clan = d(dashboard?.clan);
  const clanTag = s(dashboard?.clanTag);

  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [playerWars, setPlayerWars] = useState(20);

  const clanQuery = useQuery({
    queryKey: ["clash-trends-clan", clanTag],
    enabled: Boolean(clanTag),
    queryFn: async () => {
      const r = await fetch(
        `/api/clash/trends/clan?clanTag=${encodeURIComponent(clanTag)}&wars=20`,
      );
      if (!r.ok) throw new Error("Could not load clan trends");
      const body = await r.json();
      return Array.isArray(body?.wars) ? body.wars : [];
    },
  });

  const moversQuery = useQuery({
    queryKey: ["clash-trends-movers", clanTag],
    enabled: Boolean(clanTag),
    queryFn: async (): Promise<Mover[]> => {
      const r = await fetch(
        `/api/clash/trends/movers?clanTag=${encodeURIComponent(clanTag)}`,
      );
      if (!r.ok) throw new Error("Could not load player trends");
      const body = await r.json();
      return Array.isArray(body?.players) ? body.players : [];
    },
  });

  const movers = moversQuery.data ?? [];
  const activePlayer = selectedPlayer || movers[0]?.playerTag || "";

  const playerQuery = useQuery({
    queryKey: ["clash-trends-player", clanTag, activePlayer, playerWars],
    enabled: Boolean(clanTag && activePlayer),
    queryFn: async () => {
      const r = await fetch(
        `/api/clash/trends/player/${encodeURIComponent(activePlayer)}?clanTag=${encodeURIComponent(clanTag)}&wars=${playerWars}`,
      );
      if (!r.ok) throw new Error("Could not load player history");
      const body = await r.json();
      return Array.isArray(body?.wars) ? body.wars : [];
    },
  });

  const activeMover = movers.find((m) => m.playerTag === activePlayer);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090d] text-white">
        <AppSidebar clanName={s(clan.name, "ClashIQ Clan")} clanTag={clanTag} />
        <main className="min-w-0 lg:pl-0"><ClashIQInlineBanner /><div className="p-8 text-sm text-white/40">Loading Trends…</div></main>
      </div>
    );
  }

  const clanName = s(clan.name, "ClashIQ Clan");

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#07090d] text-white">
      <AppSidebar clanName={clanName} clanTag={clanTag} />
      <main className="min-w-0 lg:pl-0">
        <ClashIQInlineBanner />

        <button
          type="button"
          aria-label="Go back"
          title="Back"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else setLocation("/");
          }}
          className="fixed left-[4.75rem] top-4 z-40 grid size-11 place-items-center rounded-xl border border-white/10 bg-[#07090d]/95 text-slate-300 shadow-xl backdrop-blur-xl transition hover:border-amber-400/30 hover:bg-white/[.08] hover:text-white active:scale-95 lg:left-[278px]"
        >
          <ArrowLeft className="size-4" />
        </button>

          <header className="border-b border-white/[.06] bg-[#07090d]/85 px-4 py-5 backdrop-blur-xl md:px-8">
            <div className="mx-auto max-w-[1400px]">
              <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#f4c542]">
                Intelligence / Trends
              </p>
              <h1 className="mt-1 font-display text-3xl font-black tracking-[-.05em]">
                War Trends
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                See how the clan and individual players are performing across the archived wars.
              </p>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-5 p-4 md:p-8">
            <section className="rounded-2xl border border-white/[.07] bg-[#06111b]/90 p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-[#f4c542]/10 text-[#f4c542]">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-white/35">
                    Clan performance
                  </p>
                  <h2 className="text-lg font-black">Stars over the last 20 wars</h2>
                </div>
              </div>

              <div className="mt-5 h-[300px]">
                {clanQuery.isLoading ? (
                  <div className="grid h-full place-items-center text-sm text-white/35">Loading archived wars…</div>
                ) : clanQuery.isError ? (
                  <div className="grid h-full place-items-center text-sm text-red-200">Could not load trend data.</div>
                ) : clanQuery.data?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clanQuery.data}>
                      <CartesianGrid stroke="rgba(255,255,255,.06)" />
                      <XAxis dataKey="endTime" tickFormatter={dateLabel} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={dateLabel}
                        contentStyle={{ background: "#07111b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="ourStars" name="Our stars" stroke="#f4c542" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="opponentStars" name="Opponent stars" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-center text-sm text-white/35">
                    No archived war data yet. The graph will populate as wars are archived.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-5">
              <article className="rounded-2xl border border-white/[.07] bg-[#06111b]/90 p-5">
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#5da9ff]">Player trend</p>
                <h2 className="mt-1 text-lg font-black">{activeMover?.playerName || "Select a player"}</h2>
                <p className="mt-1 text-xs text-white/35">Stars and average destruction per completed war.</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[5, 10, 20, 50, 60].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setPlayerWars(count)}
                      className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${playerWars === count ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-white/[.07] bg-white/[.02] text-white/40 hover:bg-white/[.05] hover:text-white/70"}`}
                    >
                      {count === 60 ? "Last 60" : `Last ${count}`} wars
                    </button>
                  ))}
                </div>

                <div className="mt-5 h-[300px]">
                  {playerQuery.isLoading ? (
                    <div className="grid h-full place-items-center text-sm text-white/35">Loading player history…</div>
                  ) : playerQuery.isError ? (
                    <div className="grid h-full place-items-center text-sm text-red-200">Could not load player history.</div>
                  ) : playerQuery.data?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={playerQuery.data}>
                        <CartesianGrid stroke="rgba(255,255,255,.06)" />
                        <XAxis dataKey="endTime" tickFormatter={dateLabel} tick={{ fill: "#64748b", fontSize: 11 }} />
                        <YAxis yAxisId="stars" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                        <YAxis yAxisId="destruction" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={dateLabel}
                          contentStyle={{ background: "#07111b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }}
                        />
                        <Legend />
                        <Line yAxisId="stars" type="monotone" dataKey="stars" name="Stars" stroke="#f4c542" strokeWidth={3} dot={false} />
                        <Line yAxisId="destruction" type="monotone" dataKey="destruction" name="Destruction %" stroke="#5da9ff" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-white/30">
                      Select a player with archived war data.
                    </div>
                  )}
                </div>
              </article>
              <article className="rounded-2xl border border-white/[.07] bg-[#06111b]/90 p-5">
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f4c542]">Member movement</p>
                <h2 className="mt-1 text-lg font-black">Who is trending?</h2>
                <p className="mt-1 text-xs text-white/35">Latest 5 completed wars vs. the 5 before them.</p>

                <div className="mt-4 space-y-2">
                  {movers.slice(0, 20).map((mover) => {
                    const Icon =
                      mover.trend === "improving"
                        ? TrendingUp
                        : mover.trend === "declining"
                          ? TrendingDown
                          : Minus;
                    const active = mover.playerTag === activePlayer;

                    return (
                      <button
                        key={mover.playerTag}
                        type="button"
                        onClick={() => setSelectedPlayer(mover.playerTag)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-[#f4c542]/25 bg-[#f4c542]/[.06]" : "border-white/[.06] bg-white/[.02] hover:bg-white/[.04]"}`}
                      >
                        <Icon className={`size-4 ${mover.trend === "improving" ? "text-emerald-300" : mover.trend === "declining" ? "text-rose-300" : "text-slate-400"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">
                            {mover.playerName}
                          </span>
                          <span className="text-[10px] text-white/30">{mover.warsCounted} wars tracked</span>
                        </span>
                        <span className="text-right">
                          <span className="block text-xs font-black">{trendDelta(mover) >= 0 ? "+" : ""}{trendDelta(mover).toFixed(2)}★</span>
                          <span className="text-[9px] uppercase tracking-wider text-white/25">{mover.trend}</span>
                        </span>
                      </button>
                    );
                  })}
                  {!movers.length && <p className="py-8 text-center text-sm text-white/30">No player trend data yet.</p>}
                </div>
              </article>
            </section>          </div>
      </main>
    </div>
  );
}
