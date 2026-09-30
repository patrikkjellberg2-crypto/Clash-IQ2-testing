import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Activity,
  BarChart3,
  Crown,
  Crosshair,
  RefreshCw,
  Shield,
  Swords,
  Target,
  Trophy,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

type User = {
  name?: string | null;
  email?: string;
  picture?: string | null;
  player_tag?: string | null;
  premium_status?: string;
  premium_until?: string | null;
};

type AnyRecord = Record<string, any>;

const text = (v: unknown, fallback = "—") =>
  typeof v === "string" && v.trim() ? v : fallback;
const num = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const pct = (v: unknown) => `${Math.round(num(v))}%`;
const stars = (v: unknown) => Math.max(0, Math.round(num(v)));

function fmtDate(v: unknown) {
  if (!v) return "Unknown date";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

export default function MyPlayerPage() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<AnyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const me = await fetch("/api/auth/me", { credentials: "include" });
      if (!me.ok) { navigate("/login"); return; }
      const meData = await me.json();
      const currentUser = meData.user as User;
      setUser(currentUser);

      if (!currentUser.player_tag) { setPlayer(null); return; }

      const response = await fetch(
        "/api/clash/player/" + encodeURIComponent(currentUser.player_tag),
        { credentials: "include", headers: { Accept: "application/json" } },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not load player");
      setPlayer(data.player ?? data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load player");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#07090d] p-6 text-white">
      <div className="mx-auto max-w-7xl animate-pulse space-y-5">
        <div className="h-10 w-64 rounded-xl bg-white/5" />
        <div className="h-72 rounded-3xl bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5" />)}
        </div>
      </div>
    </div>
  );

  if (!user?.player_tag) return (
    <div className="min-h-screen bg-[#07090d] p-6 text-white">
      <div className="mx-auto flex min-h-[75vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-3xl border border-amber-400/15 bg-[#111318] p-8 text-center shadow-2xl">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">
            <UserRound className="size-8" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-amber-300/70">My Player</p>
          <h1 className="mt-2 text-3xl font-black">Connect your village</h1>
          <p className="mt-3 text-sm text-white/50">Connect your Clash of Clans Player Tag to unlock personal analytics.</p>
          <Link href="/connect-player" className="mt-6 inline-flex rounded-2xl bg-amber-400 px-6 py-3 font-black text-black">Connect Player Tag</Link>
        </div>
      </div>
    </div>
  );

  const name = text(player?.name, user.name || "My Player");
  const tag = text(player?.tag, user.player_tag);
  const townHall = num(player?.townHallLevel ?? player?.town_hall_level);
  const exp = num(player?.expLevel ?? player?.experienceLevel);
  const trophies = num(player?.trophies);
  const bestTrophies = num(player?.bestTrophies);
  const attackWins = num(player?.attackWins);
  const defenseWins = num(player?.defenseWins);
  const warStars = num(player?.warStars);
  const clan = player?.clan as AnyRecord | undefined;
  const league = player?.league as AnyRecord | undefined;
  const stats = (player?.historicalWarStats ?? {}) as AnyRecord;
  const activity = (player?.activity ?? {}) as AnyRecord;
  const recentWars = Array.isArray(stats.recentWars) ? stats.recentWars : [];
  const allAttacks = recentWars.flatMap((w: AnyRecord) =>
    Array.isArray(w.attacks) ? w.attacks.map((a: AnyRecord) => ({ ...a, opponentName: w.opponentName, endTime: w.endTime, result: w.result })) : [],
  );
  const starCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  allAttacks.forEach((a: AnyRecord) => {
    const s = Math.max(0, Math.min(3, stars(a.stars))) as 0|1|2|3;
    starCounts[s]++;
  });
  const recentForm = recentWars.slice(0, 10);
  const threeRate = stats.totalAttacks ? (num(stats.threeStarAttacks) / num(stats.totalAttacks)) * 100 : 0;
  const score = Math.round(
    Math.min(100, Math.max(0,
      num(activity.score, 0) * 0.35 +
      Math.min(100, num(stats.averageStarsPerAttack) / 3 * 100) * 0.35 +
      Math.min(100, num(stats.averageDestruction)) * 0.30,
    )),
  );

  const heroes = Array.isArray(player?.heroes) ? player.heroes : [];
  const pets = Array.isArray(player?.heroEquipment) ? player.heroEquipment : Array.isArray(player?.pets) ? player.pets : [];
  const troops = Array.isArray(player?.troops) ? player.troops : [];
  const spells = Array.isArray(player?.spells) ? player.spells : [];
  const achievements = Array.isArray(player?.achievements) ? player.achievements : [];

  return (
    <div className="min-h-screen bg-[#07090d] p-4 text-white sm:p-6">
      <AppSidebar clanName={user?.name || "CLASH IQ"} clanTag={user?.player_tag || "#2Q0Q82C9R"} />
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-amber-300/70">Personal Command Center</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">My Player</h1>
            <p className="mt-1 text-sm text-white/35">Your complete Clash IQ player intelligence dashboard.</p>
          </div>
          <button type="button" onClick={() => void load(true)} disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs font-bold text-white/80 hover:bg-white/[.08]">
            <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} /> Refresh data
          </button>
        </header>

        {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{error}</div>}

        <section className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#17130a] via-[#101318] to-[#080b12] shadow-[0_20px_70px_rgba(0,0,0,.35)]">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
            <div className="grid size-24 shrink-0 place-items-center rounded-3xl border border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_35px_rgba(245,190,60,.10)]">
              <Crown className="size-12" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-black">{name}</h2>
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">TH {townHall || "?"}</span>
                {user.premium_status === "lifetime" && <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">Lifetime Premium</span>}
              </div>
              <p className="mt-2 font-mono text-sm text-white/40">{tag}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/[.05] px-3 py-1.5 text-white/60">{text(clan?.name, "No clan")}</span>
                <span className="rounded-full bg-blue-400/10 px-3 py-1.5 text-blue-300">{text(league?.name, "League unavailable")}</span>
                <span className="rounded-full bg-white/[.05] px-3 py-1.5 text-white/45 capitalize">{text(player?.role, "member")}</span>
              </div>
            </div>
            <div className="min-w-[170px] rounded-2xl border border-amber-400/15 bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300/60">Clash IQ Player Score</p>
              <p className="mt-1 text-4xl font-black text-amber-300">{score}</p>
              <p className="mt-1 text-[10px] text-white/35">Calculated from available war performance + activity.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[.06] bg-white/[.05] sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Trophy} label="War Stars" value={warStars} detail={`${num(stats.totalStars)} archived attack stars`} />
          <Stat icon={Crosshair} label="War Attacks" value={num(stats.totalAttacks)} detail={`${pct(stats.averageStarsPerAttack / 3 * 100)} star efficiency`} />
          <Stat icon={Target} label="Avg Destruction" value={Math.round(num(stats.averageDestruction))} suffix="%" detail={`Best ${Math.round(num(stats.maxDestruction))}%`} />
          <Stat icon={Activity} label="Activity" value={num(activity.score)} detail={text(activity.label, "No activity data")} />
        </div>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl lg:col-span-2">
            <SectionTitle icon={BarChart3} eyebrow="War performance" title="Attack statistics" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total attacks" value={num(stats.totalAttacks)} />
              <Metric label="Average stars" value={num(stats.averageStarsPerAttack).toFixed(2)} />
              <Metric label="3-star attacks" value={num(stats.threeStarAttacks)} />
              <Metric label="1★ or less" value={num(stats.oneStarOrLess)} />
              <Metric label="Max destruction" value={`${Math.round(num(stats.maxDestruction))}%`} />
              <Metric label="Wars tracked" value={num(stats.wars)} />
              <Metric label="Missed wars" value={num(stats.missedWars)} />
              <Metric label="3-star rate" value={pct(threeRate)} />
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-wider text-white/35"><span>Star distribution</span><span>{num(stats.totalAttacks)} attacks</span></div>
              <div className="flex h-9 overflow-hidden rounded-xl border border-white/5 bg-white/[.03]">
                {[0,1,2,3].map(s => {
                  const width = num(stats.totalAttacks) ? (starCounts[s as 0|1|2|3] / num(stats.totalAttacks)) * 100 : 0;
                  return <div key={s} style={{ width: `${width}%` }} className={s === 3 ? "bg-emerald-400/70" : s === 2 ? "bg-amber-400/70" : s === 1 ? "bg-orange-400/60" : "bg-red-400/50"} title={`${s} stars: ${starCounts[s as 0|1|2|3]}`} />;
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/40">
                {[0,1,2,3].map(s => <span key={s}>{s}★ <b className="text-white/75">{starCounts[s as 0|1|2|3]}</b></span>)}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
            <SectionTitle icon={Zap} eyebrow="Recent form" title="Last 10 wars" />
            <div className="flex items-end gap-1.5">
              {recentForm.length ? recentForm.map((w: AnyRecord, i: number) => {
                const a = Array.isArray(w.attacks) ? w.attacks : [];
                const s = a.reduce((n: number, x: AnyRecord) => n + stars(x.stars), 0);
                return <div key={i} className="flex-1" title={`${text(w.opponentName)} · ${s} stars`}>
                  <div className="flex h-28 items-end justify-center rounded-lg bg-white/[.025] p-1">
                    <div className={w.result === "won" ? "w-full rounded bg-emerald-400/60" : w.result === "lost" ? "w-full rounded bg-red-400/50" : "w-full rounded bg-amber-400/50"} style={{ height: `${Math.max(10, Math.min(100, (s / Math.max(1, a.length * 3)) * 100))}%` }} />
                  </div>
                  <p className="mt-1 text-center text-[9px] text-white/30">{a.length}A</p>
                </div>;
              }) : <p className="text-sm text-white/35">No archived war data yet.</p>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Metric label="Participation" value={pct(activity.participationRate)} />
              <Metric label="Attack usage" value={pct(activity.attackUtilizationRate)} />
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
          <SectionTitle icon={Swords} eyebrow="Combat log" title="Recent attacks" />
          {allAttacks.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead><tr className="border-b border-white/[.06] text-[9px] uppercase tracking-[.16em] text-white/30">
                  <th className="px-3 py-3">Date</th><th className="px-3 py-3">Opponent</th><th className="px-3 py-3">Stars</th><th className="px-3 py-3">Destruction</th><th className="px-3 py-3">Result</th>
                </tr></thead>
                <tbody>{allAttacks.slice(0, 25).map((a: AnyRecord, i: number) => (
                  <tr key={i} className="border-b border-white/[.04] text-xs">
                    <td className="px-3 py-3 text-white/40">{fmtDate(a.endTime)}</td>
                    <td className="px-3 py-3 font-bold text-white/75">{text(a.opponentName)}</td>
                    <td className="px-3 py-3 font-black text-amber-300">{stars(a.stars)}★</td>
                    <td className="px-3 py-3 font-mono text-white/60">{Math.round(num(a.destructionPercentage))}%</td>
                    <td className="px-3 py-3"><span className="rounded-md bg-white/[.04] px-2 py-1 text-[9px] font-black uppercase text-white/50">{text(a.result, "war")}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="rounded-xl border border-white/5 bg-white/[.02] p-5 text-sm text-white/35">No individual attacks are archived yet.</p>}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
            <SectionTitle icon={Shield} eyebrow="Progression" title="Heroes & Pets" />
            <div className="grid gap-2 sm:grid-cols-2">
              {[...heroes, ...pets].slice(0, 20).map((x: AnyRecord, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.025] p-3">
                  <span className="text-xs font-bold text-white/65">{text(x.name)}</span>
                  <span className="font-mono text-xs font-black text-amber-300">Lv {num(x.level)}</span>
                </div>
              ))}
              {!heroes.length && !pets.length && <p className="text-sm text-white/35">No hero/pet data returned by the current API response.</p>}
            </div>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
            <SectionTitle icon={Swords} eyebrow="Army" title="Troops & Spells" />
            <div className="grid gap-2 sm:grid-cols-2">
              {[...troops, ...spells].slice(0, 24).map((x: AnyRecord, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.025] p-3">
                  <span className="truncate text-xs font-bold text-white/65">{text(x.name)}</span>
                  <span className="font-mono text-xs font-black text-blue-300">Lv {num(x.level)}</span>
                </div>
              ))}
              {!troops.length && !spells.length && <p className="text-sm text-white/35">No troop/spell data returned by the current API response.</p>}
            </div>
          </article>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <InfoCard title="Trophy profile" rows={[
            ["Current trophies", trophies.toLocaleString()],
            ["Best trophies", bestTrophies.toLocaleString()],
            ["Attack wins", attackWins.toLocaleString()],
            ["Defense wins", defenseWins.toLocaleString()],
          ]} />
          <InfoCard title="Account profile" rows={[
            ["Town Hall", townHall ? `TH ${townHall}` : "—"],
            ["Experience", exp.toLocaleString()],
            ["Clan", text(clan?.name)],
            ["Role", text(player?.role, "member")],
          ]} />
          <InfoCard title="War archive" rows={[
            ["Wars tracked", num(stats.wars).toLocaleString()],
            ["Attacks", num(stats.totalAttacks).toLocaleString()],
            ["War stars", num(stats.totalStars).toLocaleString()],
            ["Missed wars", num(stats.missedWars).toLocaleString()],
          ]} />
        </section>

        {achievements.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl">
            <SectionTitle icon={Trophy} eyebrow="Progression" title="Achievements" />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.slice(0, 18).map((a: AnyRecord, i: number) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/[.025] p-3">
                  <div className="flex justify-between gap-3"><span className="truncate text-xs font-bold text-white/65">{text(a.name)}</span><span className="font-mono text-[10px] text-amber-300">{num(a.value)}/{num(a.target)}</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-amber-400/70" style={{ width: `${Math.min(100, num(a.target) ? num(a.value)/num(a.target)*100 : 0)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3 pb-4">
          <Link href={`/player/${encodeURIComponent(tag)}`} className="inline-flex items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[.04] px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-400/[.08]"><BarChart3 className="size-4" /> Full Player Intelligence</Link>
          <Link href="/war-center" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs font-bold text-white/55 hover:text-white"><Swords className="size-4" /> War Center</Link>
          <Link href="/ai-coach" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5 text-xs font-bold text-white/55 hover:text-white"><Zap className="size-4" /> AI Coach</Link>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, eyebrow, title }: { icon: any; eyebrow: string; title: string }) {
  return <div className="mb-5 flex items-center gap-3">
    <div className="grid size-10 place-items-center rounded-xl border border-amber-400/15 bg-amber-400/[.06] text-amber-300"><Icon className="size-5" /></div>
    <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300/60">{eyebrow}</p><h2 className="text-lg font-black">{title}</h2></div>
  </div>;
}

function Stat({ icon: Icon, label, value, detail, suffix = "" }: { icon: any; label: string; value: number; detail: string; suffix?: string }) {
  return <div className="bg-[#0d1015] p-5">
    <div className="grid size-9 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><Icon className="size-4" /></div>
    <p className="mt-3 text-[10px] font-black uppercase tracking-[.15em] text-white/35">{label}</p>
    <p className="mt-1 text-2xl font-black">{value.toLocaleString()}{suffix}</p>
    <p className="mt-1 text-xs text-white/35">{detail}</p>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/5 bg-white/[.025] p-3"><p className="text-[9px] uppercase tracking-wider text-white/30">{label}</p><p className="mt-1 text-lg font-black text-white/80">{value}</p></div>;
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return <article className="rounded-2xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl"><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-300/60">{title}</p><div className="mt-4 space-y-3">{rows.map(([k,v]) => <div key={k} className="flex justify-between gap-4 border-b border-white/[.04] pb-2 text-xs"><span className="text-white/35">{k}</span><span className="max-w-[60%] truncate font-bold text-white/70">{v}</span></div>)}</div></article>;
}
