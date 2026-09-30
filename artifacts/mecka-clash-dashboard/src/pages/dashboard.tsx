import { useEffect, useMemo, useState } from "react";
import { useGetClashDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MemberDetailsDialog } from "@/components/member-details-dialog";
import WarTimer from "@/components/WarTimer";
import { AppSidebar } from "@/components/app-sidebar";
import { ClashIQInlineBanner } from "@/components/clashiq-inline-banner";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  Coins,
  Crown,
  Database,
  Flag,
  Gem,
  Medal,
  RefreshCw,
  ShieldAlert,
  Swords,
  Trophy,
  Users,
  WifiOff,
  X,
} from "lucide-react";

type Dict = Record<string, unknown>;

type DashboardShape = {
  clan: unknown;
  members: unknown[];
  currentWar: unknown;
  warlog: unknown[];
  capitalRaidSeasons: unknown[];
  fetchedAt: string;
  clanTag: string;
  apiConfigured: boolean;
};

const d = (v: unknown): Dict =>
  v && typeof v === "object" ? (v as Dict) : {};

const arr = (v: unknown): Dict[] =>
  Array.isArray(v) ? v.map(d) : [];

const s = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : fallback;

const n = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : fallback;

const compact = (v: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map(x => x[0])
    .join("")
    .toUpperCase() || "MC";

const dateText = (v: unknown) => {
  const date = new Date(s(v));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const ago = (v: unknown) => {
  const date = new Date(s(v));

  if (Number.isNaN(date.getTime())) {
    return "just now";
  }

  const hours = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 36e5),
  );

  return hours < 24
    ? `${hours}h ago`
    : `${Math.round(hours / 24)}d ago`;
};

function Loading() {
  return (
    <div className="min-h-screen bg-background p-5">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="h-20 animate-pulse rounded-2xl bg-card" />

        <div className="h-44 animate-pulse rounded-2xl bg-card" />

        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="premium-card max-w-md rounded-3xl p-8 text-center">
        <WifiOff className="mx-auto size-8 text-red-400" />

        <h1 className="mt-4 text-2xl font-bold">
          Could not load clan data
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The live Clash feed did not respond.
        </p>

        <button
          type="button"
          onClick={retry}
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold"
        >
          Retry connection
        </button>
      </div>
    </div>
  );
}

function Setup() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="premium-card max-w-lg rounded-3xl p-9 text-center">
        <Database className="mx-auto size-8 text-accent" />

        <h1 className="mt-4 text-3xl font-bold">
          Connect the Clash API
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Add the official Clash API token to the server.
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
  gold = false,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
  gold?: boolean;
}) {
  return (
    <article className="premium-card stat-glow group rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 hover:border-sky-400/35">
      <div
        className={`grid size-10 place-items-center rounded-xl ${
          gold
            ? "bg-amber-400/15 text-amber-300"
            : "bg-sky-400/15 text-sky-300"
        }`}
      >
        <Icon className="size-5" />
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {detail}
      </p>
    </article>
  );
}

function WarCard({
  war,
  clanName,
}: {
  war: Dict;
  clanName: string;
}) {
  const own = d(war.clan);
  const opponent = d(war.opponent);

  return (
    <article className="premium-card war-command-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[.015] px-5 py-4">
        <div>
          <p className="section-kicker">Live battlefield</p>
          <h2 className="mt-1 text-lg font-black tracking-tight">Current War</h2>
        </div>

        <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-[12px] font-black uppercase tracking-[.16em] text-amber-300 shadow-[0_0_20px_rgba(245,190,60,.08)]">
          {s(war.state, "Unknown")}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <WarTimer currentWar={war} />
        <div className="grid min-h-[235px] place-items-center rounded-2xl border border-white/[.06] bg-black/10 p-4">
          <div className="grid w-full max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div>
            <div className="mx-auto grid size-16 place-items-center rounded-2xl border-2 border-amber-400 bg-amber-500/10 text-2xl font-bold text-amber-300">
              {n(own.clanLevel)}
            </div>

            <p className="mt-3 truncate font-bold">
              {s(own.name, clanName)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              ⭐ {n(own.stars)} ·{" "}
              {Math.round(
                n(own.destructionPercentage),
              )}
              %
            </p>
          </div>

          <div>
            <p className="text-xl font-bold text-amber-300">
              VS
            </p>

            <Link
              href="/war-center"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
            >
              View War Center
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div>
            <div className="mx-auto grid size-16 place-items-center rounded-2xl border-2 border-sky-400 bg-sky-400/10 text-2xl font-bold text-sky-300">
              {n(opponent.clanLevel)}
            </div>

            <p className="mt-3 truncate font-bold">
              {s(opponent.name, "Opponent")}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              ⭐ {n(opponent.stars)} ·{" "}
              {Math.round(
                n(opponent.destructionPercentage),
              )}
              %
            </p>
          </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function getWarResult(
  war: Dict,
  clanTag: string,
): "won" | "lost" | "draw" | null {
  const own = d(war.clan);
  const opponent = d(war.opponent);
  const requested = clanTag.trim().toUpperCase();
  const ownTag = s(own.tag).trim().toUpperCase();
  const opponentTag = s(opponent.tag).trim().toUpperCase();

  if (ownTag !== requested && opponentTag !== requested) {
    return null;
  }

  const ourSide = ownTag === requested ? own : opponent;
  const enemySide = ownTag === requested ? opponent : own;

  const state = s(war.state).toLowerCase();
  if (!["won", "lost", "draw", "tie"].includes(state)) {
    return null;
  }

  const ourStars = n(ourSide.stars);
  const enemyStars = n(enemySide.stars);
  const ourDestruction = n(ourSide.destructionPercentage);
  const enemyDestruction = n(enemySide.destructionPercentage);

  // Calculate the result from the two sides first. This prevents a war from
  // being displayed backwards when the API returned our clan as opponent.
  if (ourStars > enemyStars || (ourStars === enemyStars && ourDestruction > enemyDestruction)) {
    return "won";
  }
  if (ourStars < enemyStars || (ourStars === enemyStars && ourDestruction < enemyDestruction)) {
    return "lost";
  }

  if (state === "draw" || state === "tie") {
    return "draw";
  }

  // If the API did not provide usable scores, fall back to its clan-scoped
  // state. The backend normally orients the requested clan as war.clan.
  if (state === "won" || state === "lost") {
    return ownTag === requested
      ? (state === "won" ? "won" : "lost")
      : (state === "won" ? "lost" : "won");
  }

  return null;
}

function IntelligencePulse({
  war,
  clanName,
}: {
  war: Dict;
  clanName: string;
}) {
  const own = d(war.clan);
  const opponent = d(war.opponent);
  const ownMembers = arr(own.members);
  const enemyMembers = arr(opponent.members);
  const state = s(war.state, "unknown").toLowerCase();
  const active = state === "inwar";

  if (!war.clan || !war.opponent) {
    return (
      <article className="premium-card rounded-2xl border border-sky-400/15 p-5">
        <div className="flex items-center gap-3">
          <BrainCircuit className="size-5 text-sky-300" />
          <div>
            <h2 className="text-xl font-bold">Intelligence Pulse</h2>
            <p className="text-sm text-muted-foreground">No active war board available.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Clash IQ will surface live war changes here when the next war starts.
        </p>
      </article>
    );
  }

  const attacksPerMember = Math.max(1, n(war.attacksPerMember, 2));
  const teamSize = Math.max(
    n(war.teamSize),
    ownMembers.length,
    enemyMembers.length,
  );
  const maxAttacks = teamSize * attacksPerMember;
  const ownUsed = n(own.attacks);
  const enemyUsed = n(opponent.attacks);
  const ownRemaining = Math.max(0, maxAttacks - ownUsed);
  const enemyRemaining = Math.max(0, maxAttacks - enemyUsed);
  const starDelta = n(own.stars) - n(opponent.stars);
  const destructionDelta = n(own.destructionPercentage) - n(opponent.destructionPercentage);

  const cleanupTargets = enemyMembers
    .map(member => {
      const attacks = arr(member.attacks);
      const best = attacks.reduce((best, attack) => {
        if (!best) return attack;
        const stars = n(attack.stars);
        const bestStars = n(best.stars);
        const destruction = n(attack.destructionPercentage);
        const bestDestruction = n(best.destructionPercentage);
        return stars < bestStars || (stars === bestStars && destruction > bestDestruction)
          ? attack
          : best;
      }, null as Dict | null);
      return { member, best };
    })
    .filter(({ member, best }) => n(member.attacks?.length) > 0 && best && n(best.stars) < 3)
    .sort((a, b) => n(b.best?.destructionPercentage) - n(a.best?.destructionPercentage))
    .slice(0, 2);

  const unusedPlayers = active
    ? ownMembers.filter(member => n(member.attacks?.length) < attacksPerMember).length
    : 0;

  const alerts: { tone: "red" | "amber" | "green" | "sky"; title: string; detail: string }[] = [];

  if (active && ownRemaining > 0) {
    alerts.push({
      tone: unusedPlayers > 0 ? "amber" : "sky",
      title: `${ownRemaining} attack${ownRemaining === 1 ? "" : "s"} remaining`,
      detail: `${unusedPlayers} clan member${unusedPlayers === 1 ? " has" : "s have"} an unused attack.`,
    });
  }

  if (active && starDelta < 0) {
    alerts.push({
      tone: "red",
      title: "Enemy is ahead",
      detail: `${Math.abs(starDelta)} star${Math.abs(starDelta) === 1 ? "" : "s"} behind · destruction gap ${Math.abs(destructionDelta).toFixed(1)}%.`,
    });
  } else if (active && starDelta > 0) {
    alerts.push({
      tone: "green",
      title: `${starDelta} star lead`,
      detail: `Your destruction is ${destructionDelta >= 0 ? "also" : "not"} ahead by ${Math.abs(destructionDelta).toFixed(1)}%.`,
    });
  } else if (active) {
    alerts.push({
      tone: "amber",
      title: "Close war",
      detail: `Stars are tied · destruction decides the current edge.`,
    });
  }

  if (cleanupTargets.length) {
    const target = cleanupTargets[0];
    alerts.push({
      tone: "sky",
      title: "Cleanup opportunity",
      detail: `#${n(target.member.mapPosition)} ${s(target.member.name, "Enemy")} has been attacked without a 3★ clear.`,
    });
  }

  const toneClasses = {
    red: "border-red-400/20 bg-red-400/[.06] text-red-200",
    amber: "border-amber-400/20 bg-amber-400/[.06] text-amber-200",
    green: "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-200",
    sky: "border-sky-400/20 bg-sky-400/[.06] text-sky-200",
  } as const;

  return (
    <article className="premium-card overflow-hidden rounded-2xl border border-sky-400/15">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
            <BrainCircuit className="size-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Intelligence Pulse</h2>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
              {active ? `Live · ${clanName}` : "War intelligence"}
            </p>
          </div>
        </div>
        <Link
          href="/war-planner"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-sm font-bold text-sky-200"
        >
          Open Planner <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">Board</p>
          <p className="mt-2 text-4xl font-black">{n(own.stars)}–{n(opponent.stars)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {active ? `${ownRemaining} own · ${enemyRemaining} enemy attacks left` : "Latest captured state"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">Destruction</p>
          <p className="mt-2 text-4xl font-black">{n(own.destructionPercentage).toFixed(1)}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Opponent {n(opponent.destructionPercentage).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">Detected</p>
          <p className="mt-2 text-4xl font-black">{alerts.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">data-backed signals</p>
        </div>
      </div>

      <div className="grid gap-2 px-5 pb-5">
        {alerts.slice(0, 3).map((alert, index) => (
          <div key={`${alert.title}-${index}`} className={`rounded-xl border p-3 ${toneClasses[alert.tone]}`}>
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-base font-bold">{alert.title}</p>
                <p className="mt-1 text-sm leading-5 opacity-80">{alert.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}


function RecentAttacksWidget({ war }: { war: Dict }) {
  const own = d(war.clan);
  const members = arr(own.members);
  const attacks = members.flatMap(member =>
    arr(member.attacks).map(attack => ({ attack, member })),
  ).sort((a, b) => n(b.attack.order) - n(a.attack.order)).slice(0, 5);
  const opponentMembers = arr(d(war.opponent).members);
  const opponentByTag = new Map(opponentMembers.map(member => [s(member.tag).toUpperCase(), member]));
  return (
    <article className="premium-card overflow-hidden rounded-2xl border border-amber-400/15">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div><p className="section-kicker">Live war widget</p><h2 className="mt-1 text-xl font-black tracking-tight">Senaste attacker</h2></div>
        <Swords className="size-5 text-amber-300" />
      </div>
      {!attacks.length ? <div className="p-6 text-sm text-muted-foreground">Inga attacker registrerade ännu.</div> : (
        <div className="divide-y divide-white/[.06]">
          {attacks.map(({ attack, member }, index) => {
            const attackerName = s(member.name, "Unknown");
            const defender = opponentByTag.get(s(attack.defenderTag).toUpperCase());
            const target = defender ? s(defender.name, "#" + n(defender.mapPosition)) : "#" + (n(attack.defenderMapPosition) || n(attack.mapPosition) || "?");
            const stars = Math.max(0, Math.min(3, n(attack.stars)));
            const destruction = Math.round(n(attack.destructionPercentage));
            const starText = "★".repeat(stars) + "☆".repeat(3 - stars);
            return (
              <div key={s(attack.attackerTag, attackerName) + "-" + String(attack.order || index)} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-5 py-4">
                <div className="min-w-0"><p className="truncate text-base font-bold text-white">{attackerName}</p><p className="mt-0.5 truncate text-xs text-slate-500">mot {target}</p></div>
                <div className="text-lg font-black tracking-tight text-amber-300" aria-label={stars + " stjärnor"}>{starText}</div>
                <div className="min-w-[3.5rem] text-right text-sm font-bold text-slate-300">{destruction}%</div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
function WarPerformance({
  warlog,
  clanTag,
}: {
  warlog: Dict[];
  clanTag: string;
}) {
  const results = warlog
    .map(war => getWarResult(war, clanTag))
    .filter((result): result is "won" | "lost" | "draw" => result !== null)
    .slice(0, 8);

  const wins = results.filter(result => result === "won").length;
  const losses = results.filter(result => result === "lost").length;
  const draws = results.filter(result => result === "draw").length;
  const completed = wins + losses + draws;
  const rate = completed
    ? Math.round((wins / completed) * 100)
    : 0;

  return (
    <article className="premium-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">
            Recent War Performance
          </h2>

          <p className="text-xs text-muted-foreground">
            {results.length > 0
              ? `Last ${results.length} recorded wars`
              : "No verified war data"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold">
            {results.length > 0 ? `${rate}%` : "—"}
          </p>

          <p className="text-[10px] uppercase text-muted-foreground">
            Win rate
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-1.5">
        {results
          .slice()
          .reverse()
          .map((result, i) => {
            const won = result === "won";
            const draw = result === "draw";

            return (
              <span
                key={i}
                className={`grid size-8 place-items-center rounded-md text-[10px] font-black ${
                  won
                    ? "bg-emerald-500/80"
                    : draw
                      ? "bg-amber-500/80"
                      : "bg-red-500/80"
                }`}
              >
                {won ? "W" : draw ? "D" : "L"}
              </span>
            );
          })}
      </div>
    </article>
  );
}

function EnemyAnalysisIntro({
  war,
}: {
  war: Dict;
}) {
  const opponent = d(war.opponent);

  const state = s(
    war.state,
    "Unknown",
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-red-400/20 bg-red-400/[.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-red-300">
          Enemy Clan
        </p>

        <p className="mt-2 truncate text-lg font-bold">
          {s(
            opponent.name,
            "Opponent",
          )}
        </p>
      </div>

      <div className="rounded-xl border border-sky-400/20 bg-sky-400/[.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-sky-300">
          War Status
        </p>

        <p className="mt-2 text-lg font-bold">
          {state}
        </p>
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[.06] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-300">
          Enemy Score
        </p>

        <p className="mt-2 text-lg font-bold">
          ⭐ {n(opponent.stars)} ·{" "}
          {Math.round(
            n(
              opponent.destructionPercentage,
            ),
          )}
          %
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [selected, setSelected] =
    useState<Dict | null>(null);

  const [activityPlayers, setActivityPlayers] = useState<Dict[]>([]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useGetClashDashboard();

  const dash =
    data as unknown as DashboardShape | undefined;

  useEffect(() => {
    const activeClanTag = dash?.clanTag;
    if (!activeClanTag) return;
    let cancelled = false;
    fetch(`/api/clash/activity?clanTag=${encodeURIComponent(activeClanTag)}`)
      .then(response => response.ok ? response.json() : null)
      .then(payload => {
        if (!cancelled && payload && Array.isArray(payload.players)) {
          setActivityPlayers(payload.players.map((player: unknown) => d(player)));
        }
      })
      .catch(() => {
        if (!cancelled) setActivityPlayers([]);
      });
    return () => { cancelled = true; };
  }, [dash?.clanTag]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refetch();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [refetch]);

  const members = useMemo(
    () =>
      arr(dash?.members).sort(
        (a, b) =>
          n(a.clanRank, 99) -
          n(b.clanRank, 99),
      ),
    [dash?.members],
  );

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <ErrorState
        retry={() => void refetch()}
      />
    );
  }

  if (!dash?.apiConfigured) {
    return <Setup />;
  }

  const clan = d(dash.clan);
  // The member card is a clan-level count, not the length of the roster
  // payload. The roster can be unavailable while the official clan endpoint
  // still provides the correct current member count.
  const memberCount =
    typeof clan.members === "number" && clan.members > 0
      ? clan.members
      : null;
  const hasLiveRoster =
    memberCount !== null &&
    members.length >= Math.max(1, Math.floor(memberCount * 0.8));

  const war = d(dash.currentWar);

  const warClan = d(war.clan);

  const warOpponent = d(
    war.opponent,
  );

  const warlog = arr(dash.warlog);

  const seasons = arr(
    dash.capitalRaidSeasons,
  );

  const latest = seasons[0] || {};

  // Clash of Clans exposes the all-time war-win count, but the clan feed
  // does not reliably expose an all-time loss count. Never treat a missing
  // loss value as zero, because that creates false records such as 440-0.
  const wins = n(clan.warWins);
  const rawLosses = clan.warLosses;
  const hasLosses = typeof rawLosses === "number";
  const losses = hasLosses ? n(rawLosses) : null;
  const totalWars =
    losses !== null ? wins + losses : 0;

  const rate = totalWars
    ? Math.round(
        (wins / totalWars) * 100,
      )
    : null;

  const clanName = s(
    clan.name,
    "Clash IQ",
  );

  return (
    <div className="clashiq-overview min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">
        <AppSidebar
          clanName={clanName}
          clanTag={dash.clanTag}
        />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1400px] space-y-5 p-4 md:p-7">
            <ClashIQInlineBanner />

            <header className="border-b border-white/5 bg-[#07090d]/85 px-5 py-4 backdrop-blur-xl">
              <div className="mx-auto flex max-w-[1400px] items-center justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Command Center
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                      {clanName}
                    </h1>
                    <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                      Elite
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {dash.clanTag}
                    <span className="mx-2 text-amber-300">|</span>
                    Stronger Together
                  </p>
                </div>
                <div className="hidden items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-2 sm:flex">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">
                    Live data
                  </span>
                </div>
              </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Stat
                icon={ShieldAlert}
                label="Clan Level"
                value={String(
                  n(clan.clanLevel),
                )}
                detail="Clan level"
                gold
              />

              <Stat
                icon={Users}
                label="Members"
                value={memberCount !== null ? `${memberCount}/50` : "—"}
                detail={
                  memberCount !== null
                    ? hasLiveRoster
                      ? "Live official roster"
                      : "Live official count · roster unavailable"
                    : "Live member data unavailable"
                }
              />

              <Stat
                icon={Swords}
                label="War Wins"
                value={String(wins)}
                detail={
                  losses !== null
                    ? `${rate}% win rate`
                    : "Classic war wins"
                }
              />

              <Stat
                icon={X}
                label="War Losses"
                value={losses !== null ? String(losses) : "—"}
                detail={
                  losses !== null
                    ? "Classic war losses"
                    : "Loss data unavailable"
                }
              />

              <Stat
                icon={Gem}
                label="Capital Points"
                value={typeof clan.clanCapitalPoints === "number"
                  ? compact(n(clan.clanCapitalPoints))
                  : "—"}
                detail={typeof clan.clanCapitalPoints === "number"
                  ? s(clan.capitalLeague, "Unranked")
                  : "Live Capital data unavailable"}
                gold
              />

              <Stat
                icon={Coins}
                label="Capital Raids"
                value={seasons.length > 0 ? String(seasons.length) : "—"}
                detail={seasons.length > 0
                  ? `${compact(n(latest.capitalTotalLoot))} loot`
                  : "Live raid data unavailable"}
                gold
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-[1.35fr_.9fr_.8fr]">
              <WarCard
                war={war}
                clanName={clanName}
              />

              <WarPerformance
                warlog={warlog}
                clanTag={dash.clanTag}
              />

              <article className="premium-card rounded-2xl p-5">
                <h2 className="text-lg font-bold">
                  Capital Raid Summary
                </h2>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <Trophy className="size-7 text-amber-300" />

                    <p className="mt-2 text-2xl font-bold">
                      {seasons.length > 0
                        ? compact(n(latest.capitalTotalLoot))
                        : "—"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {seasons.length > 0
                        ? "Total loot"
                        : "Live raid data unavailable"}
                    </p>
                  </div>

                  <div>
                    <Medal className="size-7 text-sky-300" />

                    <p className="mt-2 text-2xl font-bold">
                      {seasons.length > 0
                        ? n(latest.offensiveReward) +
                          n(latest.defensiveReward)
                        : "—"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {seasons.length > 0
                        ? "Raid rewards"
                        : "Live raid data unavailable"}
                    </p>
                  </div>
                </div>

                <Link
                  href="/capital-raids"
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 py-2.5 text-xs font-bold text-sky-200"
                >
                  View Capital Raids
                  <ArrowRight className="size-3.5" />
                </Link>
              </article>
            </section>

            <IntelligencePulse
              war={war}
              clanName={clanName}
            />

            <details className="group overflow-hidden rounded-2xl border border-white/[.08] bg-[#0b1119]/80 shadow-[0_16px_50px_rgba(0,0,0,.16)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-white/[.025] [&::-webkit-details-marker]:hidden">
                <div>
                  <p className="section-kicker">Deeper intelligence</p>
                  <h2 className="mt-1 font-black tracking-tight">Clan details</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Member activity, roster, recent wars and quick actions.</p>
                </div>
                <span className="rounded-lg border border-amber-400/20 bg-amber-400/[.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300 transition group-open:rotate-180">⌄</span>
              </summary>
              <div className="space-y-5 border-t border-white/[.06] p-4 md:p-5">
                <RecentAttacksWidget war={war} />
                <section className="premium-card overflow-hidden rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                  <div>
                    <p className="section-kicker">Member pulse</p>
                    <h2 className="mt-1 font-black tracking-tight">Most Active Members</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">War activity · last 10 completed wars</p>
                </div>
                <Link
                  href="/activity"
                  className="rounded-lg bg-primary/15 px-3 py-1.5 text-[10px] font-bold text-sky-300"
                >
                  View All
                </Link>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
                {activityPlayers.slice(0, 5).map((player, index) => {
                  const score = n(player.score);
                  const name = s(player.playerName, "Unknown");
                  return (
                    <button
                      type="button"
                      key={s(player.playerTag, String(index))}
                      onClick={() => {
                        const member = members.find(
                          candidate => s(candidate.tag).toUpperCase() === s(player.playerTag).toUpperCase(),
                        );
                        setSelected(member ?? { tag: player.playerTag, name: player.playerName });
                      }}
                      className="group relative rounded-2xl border border-white/[.08] bg-gradient-to-br from-white/[.055] to-white/[.015] p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-sky-400/35 hover:shadow-[0_12px_30px_rgba(0,0,0,.22)]"
                    >
                      <span className="absolute right-3 top-3 text-[9px] font-black text-white/20">#{index + 1}</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-9 place-items-center rounded-xl border border-sky-300/10 bg-sky-400/10 text-xs font-bold text-sky-200">
                          {initials(name)}
                        </span>
                        <span className="font-data text-lg font-black text-emerald-300">{score}%</span>
                      </div>
                      <p className="mt-3 truncate text-sm font-bold">{name}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${score}%` }} />
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {n(player.attacksUsed)}/{n(player.attacksPossible)} attacks · {n(player.participatedWars)}/{n(player.warsTracked)} wars
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.05fr_1fr_.72fr]">
              <article className="premium-card overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="section-kicker">Roster</p>
                    <h2 className="mt-1 font-black">Top Members</h2>
                  </div>

                  <Link
                    href="/members"
                    className="rounded-lg bg-primary/15 px-3 py-1.5 text-[10px] font-bold text-sky-300"
                  >
                    View All
                  </Link>
                </div>

                <div className="divide-y divide-white/5">
                  {members
                    .slice(0, 5)
                    .map(
                      (
                        member,
                        i,
                      ) => {
                        const name =
                          s(
                            member.name,
                            "Unknown",
                          );

                        return (
                          <button
                            type="button"
                            key={s(
                              member.tag,
                              String(i),
                            )}
                            onClick={() =>
                              setSelected(
                                member,
                              )
                            }
                            className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-white/[.03]"
                          >
                            <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-xs font-bold">
                              {i === 0 ? (
                                <Crown className="size-4 text-amber-300" />
                              ) : (
                                i + 1
                              )}
                            </span>

                            <span className="grid size-9 place-items-center rounded-lg bg-sky-400/10 text-xs font-bold text-sky-200">
                              {initials(
                                name,
                              )}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">
                                {name}
                              </span>

                              <span className="text-[10px] text-muted-foreground">
                                {s(
                                  d(
                                    member.league,
                                  ).name,
                                  "Member",
                                )}
                              </span>
                            </span>

                            <span className="text-xs font-bold">
                              {n(
                                member.trophies,
                              ).toLocaleString()}
                            </span>
                          </button>
                        );
                      },
                    )}
                </div>
              </article>

              <article className="premium-card overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/10 bg-white/[.015] px-5 py-4">
                  <div>
                    <p className="section-kicker">Battle history</p>
                    <h2 className="mt-1 font-black">Latest War Log</h2>
                  </div>
                  <ArrowRight className="size-4 text-white/25" />
                </div>

                <div className="divide-y divide-white/5">
                  {warlog
                    .slice(0, 5)
                    .map((w, i) => {
                      const own =
                        d(w.clan);

                      const opponent =
                        d(
                          w.opponent,
                        );

                      const won =
                        s(
                          w.state,
                        ).toLowerCase() ===
                        "won";

                      const warId =
                        `${dash.clanTag}__${s(opponent.tag)}__${s(w.endTime)}`;

                      return (
                        <Link
                          key={i}
                          href={`/war-archive?war=${encodeURIComponent(warId)}`}
                          className="group flex items-center gap-3 px-5 py-3 transition hover:bg-white/[.04]"
                        >
                          <span
                            className={`grid size-8 place-items-center rounded-lg ${
                              won
                                ? "bg-emerald-400/15 text-emerald-300"
                                : "bg-red-400/15 text-red-300"
                            }`}
                          >
                            {won ? (
                              <Check className="size-4" />
                            ) : (
                              <X className="size-4" />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                              vs{" "}
                              {s(
                                opponent.name,
                                "Unknown",
                              )}
                            </p>

                            <p className="text-[10px] text-muted-foreground">
                              {dateText(
                                w.endTime,
                              )} · Click to open
                            </p>
                          </div>

                          <p className="text-sm font-bold">
                            {n(
                              own.stars,
                            )}{" "}
                            -{" "}
                            {n(
                              opponent.stars,
                            )}
                          </p>
                        </Link>
                      );
                    })}
                </div>
              </article>

              <article className="premium-card overflow-hidden rounded-2xl">
                <div className="border-b border-white/10 bg-white/[.015] px-5 py-4">
                  <p className="section-kicker">Command deck</p>
                  <h2 className="mt-1 font-black">Quick Actions</h2>
                </div>

                <div className="space-y-2 p-4">
                  {[
                    [
                      "/war-center",
                      "Open War Center",
                      Swords,
                    ],
                    [
                      "/war-planner",
                      "Go to War Planner",
                      Flag,
                    ],
                    [
                      "/capital-raids",
                      "View Capital Raids",
                      Trophy,
                    ],
                    [
                      "/members",
                      "Manage Members",
                      Users,
                    ],
                  ].map(
                    ([
                      href,
                      label,
                      Icon,
                    ]: any) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm font-bold"
                      >
                        <Icon className="size-5 text-sky-300" />

                        <span className="flex-1">
                          {label}
                        </span>

                        <ArrowRight className="size-4 text-slate-500" />
                      </Link>
                    ),
                  )}
                </div>
              </article>
              </section>
              </div>
            </details>

            <footer className="flex justify-between border-t border-white/10 pt-4 text-[10px] text-muted-foreground">
              <span>
                Clash IQ · Official Clash of Clans
                data
              </span>

              <span className="flex items-center gap-1">
                <Clock3 className="size-3" />

                Last fetch{" "}
                {dateText(
                  dash.fetchedAt,
                )}
              </span>
            </footer>
          </div>
        </main>
      </div>

      <MemberDetailsDialog
        member={selected}
        onClose={() =>
          setSelected(null)
        }
      />
    </div>
  );
}
