import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Crown, RefreshCw, Shield, Swords, Trophy, UserRound, Users } from "lucide-react";

type User = {
  name?: string | null;
  email?: string;
  picture?: string | null;
  player_tag?: string | null;
  premium_status?: string;
};

type Player = Record<string, any>;

const text = (v: unknown, fallback = "—") =>
  typeof v === "string" && v.trim() ? v : fallback;
const num = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : fallback;

export default function MyPlayerPage() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const me = await fetch("/api/auth/me", { credentials: "include" });
      if (!me.ok) {
        navigate("/login");
        return;
      }
      const meData = await me.json();
      const currentUser = meData.user as User;
      setUser(currentUser);

      if (!currentUser.player_tag) {
        setPlayer(null);
        return;
      }

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

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090d] p-6 text-white">
        <div className="mx-auto max-w-5xl animate-pulse space-y-5">
          <div className="h-10 w-56 rounded-xl bg-white/5" />
          <div className="h-64 rounded-3xl bg-white/5" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user?.player_tag) {
    return (
      <div className="min-h-screen bg-[#07090d] p-6 text-white">
        <div className="mx-auto flex min-h-[75vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-3xl border border-amber-400/15 bg-[#111318] p-8 text-center shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">
              <UserRound className="size-8" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-amber-300/70">
              My Player
            </p>
            <h1 className="mt-2 text-3xl font-black">Connect your village</h1>
            <p className="mt-3 text-sm text-white/50">
              Connect your Clash of Clans Player Tag to create your personal Player Card.
            </p>
            <Link
              href="/connect-player"
              className="mt-6 inline-flex rounded-2xl bg-amber-400 px-6 py-3 font-black text-black"
            >
              Connect Player Tag
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = text(player?.name, user.name || "My Player");
  const tag = text(player?.tag, user.player_tag);
  const townHall = num(player?.townHallLevel ?? player?.town_hall_level);
  const exp = num(player?.expLevel ?? player?.experienceLevel);
  const trophies = num(player?.trophies);
  const bestTrophies = num(player?.bestTrophies);
  const warStars = num(player?.warStars);
  const attackWins = num(player?.attackWins);
  const defenseWins = num(player?.defenseWins);
  const clan = player?.clan as Record<string, any> | undefined;
  const league = player?.league as Record<string, any> | undefined;

  return (
    <div className="min-h-screen bg-[#07090d] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-300/70">Personal Command</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">My Player</h1>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs font-bold text-white/80 hover:bg-white/[.08]"
          >
            <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#17130a] via-[#101318] to-[#080b12] shadow-[0_20px_70px_rgba(0,0,0,.35)]">
          <div className="border-b border-white/[.06] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="grid size-24 shrink-0 place-items-center rounded-3xl border border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_35px_rgba(245,190,60,.10)]">
                <Crown className="size-12" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black">{name}</h2>
                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    TH {townHall || "?"}
                  </span>
                </div>
                <p className="mt-2 font-mono text-sm text-white/45">{tag}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/[.05] px-3 py-1.5 text-white/60">
                    {text(clan?.name, "No clan")}
                  </span>
                  <span className="rounded-full bg-blue-400/10 px-3 py-1.5 text-blue-300">
                    {text(league?.name, "League unavailable")}
                  </span>
                  {user.premium_status === "lifetime" && (
                    <span className="rounded-full bg-amber-400/10 px-3 py-1.5 font-bold text-amber-300">
                      Lifetime Premium
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-white/[.05] sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Trophy} label="Trophies" value={trophies} detail={bestTrophies ? `Best ${bestTrophies}` : "Current"} />
            <Stat icon={Shield} label="War Stars" value={warStars} detail={`${attackWins} attack wins`} />
            <Stat icon={Swords} label="Attack Wins" value={attackWins} detail={`${defenseWins} defense wins`} />
            <Stat icon={Users} label="Experience" value={exp} detail={`Town Hall ${townHall || "—"}`} />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={`/player/${encodeURIComponent(tag)}`}
            className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5 transition hover:border-amber-400/25 hover:bg-white/[.04]"
          >
            <p className="text-xs font-black uppercase tracking-[.16em] text-amber-300/70">Player Intelligence</p>
            <h3 className="mt-2 text-xl font-black">Open full player profile</h3>
            <p className="mt-1 text-sm text-white/45">Detailed stats, war history and player analysis.</p>
          </Link>
          <Link
            href="/war-center"
            className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5 transition hover:border-blue-400/25 hover:bg-white/[.04]"
          >
            <p className="text-xs font-black uppercase tracking-[.16em] text-blue-300/70">War Command</p>
            <h3 className="mt-2 text-xl font-black">Go to War Center</h3>
            <p className="mt-1 text-sm text-white/45">Use your player data in the live war tools.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: any;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="bg-[#0d1015] p-5">
      <div className="grid size-9 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[.15em] text-white/35">{label}</p>
      <p className="mt-1 text-2xl font-black">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-white/35">{detail}</p>
    </div>
  );
}
