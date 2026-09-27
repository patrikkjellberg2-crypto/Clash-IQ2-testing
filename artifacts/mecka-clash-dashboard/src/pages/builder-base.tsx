import { useEffect, useMemo, useState } from "react";
import { Castle, Trophy, Users, ArrowLeft, Hammer } from "lucide-react";
import { Link } from "wouter";
import { AppSidebar } from "@/components/app-sidebar";

type Player = Record<string, any>;

const num = (v: any, fallback = 0) =>
  typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : fallback;

const str = (v: any, fallback = "—") =>
  typeof v === "string" && v.trim() ? v : fallback;

export default function BuilderBasePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/clash/dashboard")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setPlayers(Array.isArray(data?.members) ? data.members : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Builder Base data could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() =>
    players
      .map((p) => ({
        ...p,
        builderHallLevel: num(p.builderHallLevel, num(p.builderBaseHallLevel)),
        trophies: num(p.builderBaseTrophies, num(p.builderBaseLeague?.id, 0)),
        league: str(p.builderBaseLeague?.name),
      }))
      .filter((p) => p.builderHallLevel > 0 || p.builderBaseTrophies > 0)
      .sort((a, b) => b.builderHallLevel - a.builderHallLevel || b.trophies - a.trophies),
    [players]
  );

  const avgBH = rows.length ? (rows.reduce((s, p) => s + p.builderHallLevel, 0) / rows.length).toFixed(1) : "—";
  const highestBH = rows.length ? Math.max(...rows.map((p) => p.builderHallLevel)) : 0;
  const totalTrophies = rows.reduce((s, p) => s + p.trophies, 0);

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-16 pt-6 md:px-7">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                <ArrowLeft className="h-4 w-4" /> Command Center
              </Link>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
                  <Castle className="size-6 text-amber-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Builder Base</p>
                  <h1 className="text-2xl font-black md:text-3xl">Builder Hall Intelligence</h1>
                </div>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Builder Hall-nivå, Builder Base-troféer och liga för klanens spelare. Data hämtas från samma player-data som Clash IQ redan använder.
              </p>
            </div>

            {loading && (
              <div className="rounded-2xl border border-white/10 bg-[#11151c] p-6 text-sm text-slate-400">Laddar Builder Base-data…</div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-6 text-sm text-red-200">{error}</div>
            )}

            {!loading && !error && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-[#11151c] p-4">
                    <Users className="size-4 text-amber-300" />
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Players with BH data</p>
                    <p className="mt-1 text-2xl font-black">{rows.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#11151c] p-4">
                    <Hammer className="size-4 text-amber-300" />
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Average BH</p>
                    <p className="mt-1 text-2xl font-black">{avgBH}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#11151c] p-4">
                    <Castle className="size-4 text-amber-300" />
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Highest BH</p>
                    <p className="mt-1 text-2xl font-black">{highestBH || "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#11151c] p-4">
                    <Trophy className="size-4 text-amber-300" />
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Combined trophies</p>
                    <p className="mt-1 text-2xl font-black">{totalTrophies.toLocaleString()}</p>
                  </div>
                </div>

                <section className="rounded-2xl border border-white/10 bg-[#11151c] p-5">
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Clan overview</p>
                    <h2 className="mt-1 text-lg font-black">Builder Hall roster</h2>
                  </div>
                  {rows.length === 0 ? (
                    <p className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-500">
                      Ingen Builder Hall-data finns i den player-data som tjänsten returnerar just nu.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
                            <th className="px-3 py-3">Player</th>
                            <th className="px-3 py-3">BH</th>
                            <th className="px-3 py-3">Trophies</th>
                            <th className="px-3 py-3">League</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((p, i) => (
                            <tr key={p.tag || p.name || i} className="border-b border-white/5">
                              <td className="px-3 py-3 font-bold">{str(p.name)}</td>
                              <td className="px-3 py-3 font-black text-amber-200">BH {p.builderHallLevel || "—"}</td>
                              <td className="px-3 py-3 font-mono text-slate-300">{p.trophies.toLocaleString()}</td>
                              <td className="px-3 py-3 text-slate-400">{p.league}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
