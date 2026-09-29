import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Swords, Target, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { AppSidebar } from '@/components/app-sidebar';

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => v && typeof v === 'object' ? (v as Dict) : {};
const arr = (v: unknown): Dict[] => Array.isArray(v) ? v.map(d) : [];
const s = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;
const n = (v: unknown, fallback = 0) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const value = Number(v.replace(/,/g, ''));
    if (Number.isFinite(value)) return value;
  }
  return fallback;
};

const normalizeTag = (value: string) => {
  const trimmed = value.trim().toUpperCase().replace(/\s+/g, '');
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

const warTime = (war: Dict) => {
  for (const value of [war.endTime, war.warEndTime, war.startTime, war.warStartTime, war.prepStartTime]) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const clash = value.trim().match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (clash) return Date.UTC(+clash[1], +clash[2] - 1, +clash[3], +clash[4], +clash[5], +clash[6]);
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

const ownSideOf = (war: Dict, clanTag: string) => {
  const clan = d(war.clan);
  const opponent = d(war.opponent);
  const tag = normalizeTag(clanTag);
  return normalizeTag(s(clan.tag)) === tag ? clan : normalizeTag(s(opponent.tag)) === tag ? opponent : clan;
};

const resultOf = (war: Dict, clanTag: string) => {
  const state = s(war.state).toLowerCase();
  if (['won', 'win', 'victory'].includes(state)) return 'WIN';
  if (['lost', 'loss', 'lose', 'defeat'].includes(state)) return 'LOSS';
  if (['draw', 'tied'].includes(state)) return 'DRAW';

  const own = ownSideOf(war, clanTag);
  const enemy = own === d(war.clan) ? d(war.opponent) : d(war.clan);

  if (n(own.stars) !== n(enemy.stars)) return n(own.stars) > n(enemy.stars) ? 'WIN' : 'LOSS';
  if (n(own.destructionPercentage) !== n(enemy.destructionPercentage)) {
    return n(own.destructionPercentage) > n(enemy.destructionPercentage) ? 'WIN' : 'LOSS';
  }
  return 'DRAW';
};

const validDestruction = (value: unknown) => {
  const valueNumber = n(value, -1);
  return valueNumber >= 0 && valueNumber <= 100 ? valueNumber : null;
};

const opponentLabel = (war: Dict, own: Dict, enemy: Dict) => {
  const name = s(enemy.name).trim();
  const tag = s(enemy.tag).trim();
  if (name || tag) return name || tag;

  // CWL season data can arrive as several wars without a populated
  // opponent identity. A multi-star entry is the recognizable CWL shape.
  if (n(own.stars) > 3) return 'CVL';

  return 'Unknown opponent';
};

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Trophy; label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5 shadow-[0_16px_50px_rgba(0,0,0,.18)]">
    <div className="grid size-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/[.06] text-amber-300"><Icon className="size-5" /></div>
    <p className="mt-4 text-[9px] font-black uppercase tracking-[.2em] text-slate-500">{label}</p>
    <p className="mt-1 text-3xl font-black tracking-tight text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{detail}</p>
  </article>;
}

export default function StatisticsPage() {
  const { data, isLoading, isError } = useGetClashDashboard();
  const [archiveWars, setArchiveWars] = useState<Dict[]>([]);
  const [playerStats, setPlayerStats] = useState<Dict[]>([]);
  const dashboard = data as unknown as Dict | undefined;
  const clan = d(dashboard?.clan);
  const clanTag = s(dashboard?.clanTag);

  useEffect(() => {
    let active = true;
    fetch('/api/clash/war-archive')
      .then(res => res.ok ? res.json() : null)
      .then(payload => {
        if (!active) return;
        setArchiveWars(arr(payload?.wars));
        setPlayerStats(arr(payload?.players));
      })
      .catch(() => {
        if (active) {
          setArchiveWars([]);
          setPlayerStats([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const wars = useMemo(
    () => arr(dashboard?.warlog)
      .sort((a, b) => warTime(b) - warTime(a))
      .map(war => ({ war, result: resultOf(war, clanTag) })),
    [dashboard?.warlog, clanTag],
  );

  const stats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let destructionTotal = 0;
    let destructionCount = 0;

    for (const { war, result } of wars) {
      if (result === 'WIN') wins++;
      else if (result === 'LOSS') losses++;
      else draws++;

      const own = ownSideOf(war, clanTag);
      const destruction = validDestruction(own.destructionPercentage);
      if (destruction !== null) {
        destructionTotal += destruction;
        destructionCount++;
      }
    }

    let attacks = playerStats.reduce((sum, player) => sum + n(player.attacksUsed), 0);
    let threeStars = playerStats.reduce((sum, player) => sum + n(player.threeStars), 0);

    if (attacks === 0) {
      for (const war of archiveWars) {
        const own = ownSideOf(war, clanTag);
        for (const member of arr(own.members)) {
          for (const attack of arr(member.attacks)) {
            attacks += 1;
            if (n(attack.stars) >= 3) threeStars += 1;
          }
        }
      }
    }

    const completed = wins + losses + draws;

    return {
      completed,
      wins,
      losses,
      draws,
      winRate: completed ? Math.round(wins / completed * 100) : 0,
      avgDestruction: destructionCount ? Math.round(destructionTotal / destructionCount) : null,
      attacks,
      threeStars,
      threeStarRate: attacks ? Math.round(threeStars / attacks * 100) : null,
    };
  }, [wars, archiveWars, clanTag]);

  const warInsights = useMemo(() => {
    const ordered = wars.map(({ war, result }) => ({
      war,
      result,
      own: ownSideOf(war, clanTag),
      enemy: ownSideOf(war, clanTag) === d(war.clan) ? d(war.opponent) : d(war.clan),
    }));

    let currentWinStreak = 0;
    for (const item of ordered) {
      if (item.result !== 'WIN') break;
      currentWinStreak++;
    }

    let longestWinStreak = 0;
    let runningWinStreak = 0;
    for (const item of [...ordered].reverse()) {
      if (item.result === 'WIN') {
        runningWinStreak++;
        longestWinStreak = Math.max(longestWinStreak, runningWinStreak);
      } else {
        runningWinStreak = 0;
      }
    }

    const avgStars = ordered.length
      ? Math.round(ordered.reduce((sum, item) => sum + n(item.own.stars), 0) / ordered.length * 10) / 10
      : null;

    const bestWar = [...ordered]
      .sort((a, b) =>
        n(b.own.stars) - n(a.own.stars) ||
        validDestruction(b.own.destructionPercentage) - validDestruction(a.own.destructionPercentage),
      )[0] ?? null;

    const recent = ordered.slice(0, 10);
    const recentWins = recent.filter(item => item.result === 'WIN').length;
    const recentLosses = recent.filter(item => item.result === 'LOSS').length;
    const recentDraws = recent.filter(item => item.result === 'DRAW').length;

    return {
      currentWinStreak,
      longestWinStreak,
      avgStars,
      bestWar,
      recent,
      recentWins,
      recentLosses,
      recentDraws,
    };
  }, [wars, clanTag]);

  const clanOverview = useMemo(() => {
    const members = arr(dashboard?.members);
    const townHalls = new Map<number, number>();
    let trophies = 0;
    let donations = 0;

    for (const member of members) {
      const th = n(member.townHallLevel, 0);
      if (th > 0) townHalls.set(th, (townHalls.get(th) ?? 0) + 1);
      trophies += Math.max(0, n(member.trophies));
      donations += Math.max(0, n(member.donations));
    }

    return {
      memberCount: members.length,
      trophies,
      donations,
      townHalls: Array.from(townHalls.entries()).sort((a, b) => b[0] - a[0]),
    };
  }, [dashboard?.members]);

  const leaderboards = useMemo(() => {
    const fallbackThreeStarMap = new Map<string, { tag: string; name: string; threeStars: number; attacks: number }>();
    for (const war of archiveWars) {
      const own = ownSideOf(war, clanTag);
      for (const member of arr(own.members)) {
        const tag = normalizeTag(s(member.tag));
        if (!tag || tag === '#') continue;
        const entry = fallbackThreeStarMap.get(tag) || { tag, name: s(member.name, tag), threeStars: 0, attacks: 0 };
        for (const attack of arr(member.attacks)) {
          entry.attacks += 1;
          if (n(attack.stars) >= 3) entry.threeStars += 1;
        }
        fallbackThreeStarMap.set(tag, entry);
      }
    }

    const threeStarSource = playerStats.some(player => n(player.attacksUsed) > 0)
      ? playerStats.map(player => ({
          tag: s(player.playerTag),
          name: s(player.playerName, s(player.playerTag, 'Unknown')),
          threeStars: n(player.threeStars),
          attacks: n(player.attacksUsed),
        }))
      : Array.from(fallbackThreeStarMap.values());

    const threeStar = threeStarSource
      .map(player => ({
        ...player,
        rate: player.attacks ? Math.round(player.threeStars / player.attacks * 100) : 0,
      }))
      .filter(player => player.attacks > 0)
      .sort((a, b) => b.threeStars - a.threeStars || b.rate - a.rate || b.attacks - a.attacks)
      .slice(0, 5);

    const defenses = new Map<string, { tag: string; name: string; count: number; stars: number; destruction: number; zeroStars: number }>();

    for (const war of archiveWars) {
      const own = ownSideOf(war, clanTag);

      for (const member of arr(own.members)) {
        const tag = normalizeTag(s(member.tag));
        if (!tag || tag === '#') continue;
        if (!defenses.has(tag)) {
          defenses.set(tag, {
            tag,
            name: s(member.name, tag),
            count: 0,
            stars: 0,
            destruction: 0,
            zeroStars: 0,
          });
        }
      }

      // Each attack record belongs to the attacker, but its defenderTag tells
      // us which of our bases received the attack.
      for (const attacker of arr(own.members)) {
        for (const attack of arr(attacker.attacks)) {
          const tag = normalizeTag(s(attack.defenderTag));
          const entry = defenses.get(tag);
          if (!entry) continue;
          entry.count += 1;
          entry.stars += n(attack.stars);
          entry.destruction += Math.max(0, Math.min(100, n(attack.destructionPercentage)));
          if (n(attack.stars) === 0) entry.zeroStars += 1;
        }
      }
    }

    const bestDefense = Array.from(defenses.values())
      .filter(player => player.count > 0)
      .map(player => ({
        ...player,
        avgStars: player.stars / player.count,
        avgDestruction: player.destruction / player.count,
      }))
      .sort((a, b) => a.avgStars - b.avgStars || a.avgDestruction - b.avgDestruction || b.zeroStars - a.zeroStars)
      .slice(0, 5);

    return { threeStar, bestDefense };
  }, [playerStats, archiveWars, clanTag]);

  if (isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] text-white"><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Loading statistics...</p></div>;
  if (isError) return <div className="grid min-h-[100dvh] place-items-center bg-[#07090d] p-6 text-white"><div className="rounded-3xl border border-white/10 bg-[#0b1119] p-8 text-center"><BarChart3 className="mx-auto size-8 text-amber-300"/><h1 className="mt-4 text-2xl font-black">Statistics Offline</h1><p className="mt-2 text-sm text-slate-500">CLASHIQ could not load the clan statistics.</p></div></div>;

  return <div className="min-h-[100dvh] bg-[#07090d] text-white"><div className="flex min-h-[100dvh]"><AppSidebar clanName={s(clan.name, 'BHABE DHEMONS')} clanTag={clanTag || '#2Q0Q82C9R'}/><main className="min-w-0 flex-1"><div className="mx-auto max-w-[1400px] px-5 pb-10 pt-3 md:px-8 md:pt-4">
    <Link href="/" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-amber-300 hover:text-amber-200"><ArrowLeft className="size-4"/>Command Center</Link>
    <header className="mt-4 border-b border-white/[.06] pb-5"><p className="text-[9px] font-black uppercase tracking-[.22em] text-slate-500">CLASHIQ / Intelligence</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">Statistics</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">A clear summary of the verified war data available to Clash IQ.</p></header>
    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Trophy} label="Win Rate" value={`${stats.winRate}%`} detail={`${stats.wins} wins · ${stats.losses} losses · ${stats.draws} draws`}/>
      <StatCard icon={Swords} label="Completed Wars" value={String(stats.completed)} detail="Wars in the available log"/>
      <StatCard icon={Target} label="Three-Star Rate" value={stats.threeStarRate == null ? '—' : `${stats.threeStarRate}%`} detail={stats.attacks ? `${stats.threeStars} of ${stats.attacks} archived attacks with attack-level data` : 'No attack-level data is available in the war archive yet'}/>
      <StatCard icon={TrendingUp} label="Avg. Destruction" value={stats.avgDestruction == null ? '—' : `${stats.avgDestruction}%`} detail={stats.avgDestruction == null ? 'No valid 0–100% destruction values available' : 'Average destruction per completed war'}/>
    </section>
    <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Swords} label="Avg. Stars / War" value={warInsights.avgStars == null ? '—' : warInsights.avgStars.toFixed(1)} detail="Our average stars per completed war"/>
      <StatCard icon={TrendingUp} label="Current Win Streak" value={String(warInsights.currentWinStreak)} detail="Consecutive wins from the latest war"/>
      <StatCard icon={Trophy} label="Longest Win Streak" value={String(warInsights.longestWinStreak)} detail="Longest winning run in the available log"/>
      <StatCard icon={Target} label="Recent 10" value={warInsights.recent.length ? `${warInsights.recentWins}/${warInsights.recent.length}` : '—'} detail={warInsights.recent.length ? `${warInsights.recentWins}W · ${warInsights.recentLosses}L · ${warInsights.recentDraws}D` : 'No recent wars available'}/>
    </section>
    <section className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5">
        <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">Peak Performance</p>
        <h2 className="mt-1 text-xl font-black">Best War</h2>
        {warInsights.bestWar ? <div className="mt-4 rounded-xl border border-white/[.06] bg-white/[.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="truncate text-lg font-black">vs {opponentLabel(warInsights.bestWar.war, warInsights.bestWar.own, warInsights.bestWar.enemy)}</p><p className="mt-1 text-xs text-slate-500">{warInsights.bestWar.result} · {Math.round(Math.max(0, Math.min(100, n(warInsights.bestWar.own.destructionPercentage))))}% destruction</p></div>
            <p className="shrink-0 text-2xl font-black text-amber-300">{n(warInsights.bestWar.own.stars)}★</p>
          </div>
        </div> : <p className="mt-4 text-sm text-slate-500">No completed wars available yet.</p>}
      </div>

      <div className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5">
        <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">Recent Form</p>
        <h2 className="mt-1 text-xl font-black">Last 10 Wars</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {warInsights.recent.length ? warInsights.recent.map((item, index) => (
            <div key={`${warTime(item.war)}-${index}`} className="grid min-w-[70px] place-items-center rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-2">
              <span className={`text-[9px] font-black tracking-[.16em] ${item.result === 'WIN' ? 'text-emerald-300' : item.result === 'LOSS' ? 'text-rose-300' : 'text-amber-300'}`}>{item.result}</span>
              <span className="mt-1 text-sm font-black">{n(item.own.stars)}★</span>
            </div>
          )) : <p className="text-sm text-slate-500">No recent wars available yet.</p>}
        </div>
      </div>
    </section>

    <section className="mt-5 rounded-2xl border border-white/[.08] bg-[#0b1119] p-5">
      <div className="flex items-end justify-between gap-4 border-b border-white/[.06] pb-4">
        <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">Clan Overview</p><h2 className="mt-1 text-xl font-black">Roster Snapshot</h2></div>
        <span className="rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">{clanOverview.memberCount} members</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Members</p><p className="mt-1 text-2xl font-black">{clanOverview.memberCount}</p></div>
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Total Trophies</p><p className="mt-1 text-2xl font-black">{clanOverview.trophies.toLocaleString()}</p></div>
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Total Donations</p><p className="mt-1 text-2xl font-black">{clanOverview.donations.toLocaleString()}</p></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {clanOverview.townHalls.map(([th, count]) => <span key={th} className="rounded-lg border border-white/[.06] bg-white/[.02] px-3 py-2 text-xs font-bold text-slate-300">TH{th} <span className="text-amber-300">× {count}</span></span>)}
      </div>
    </section>

    <section className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5">
        <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">Attack Leaders</p>
        <h2 className="mt-1 text-xl font-black">Three-Star Top 5</h2>
        <p className="mt-1 text-xs text-slate-500">Most 3★ attacks in the archived war data.</p>
        <div className="mt-4 space-y-2">
          {leaderboards.threeStar.length ? leaderboards.threeStar.map((player, index) => (
            <Link key={player.tag} href={`/player/${encodeURIComponent(player.tag)}`} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-3 hover:border-amber-400/25 hover:bg-white/[.04]">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-400/[.06] text-xs font-black text-amber-300">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">{player.name}</span>
                <span className="text-[10px] text-slate-500">{player.threeStars} three-stars · {player.attacks} attacks · {player.rate}% rate</span>
              </span>
              <span className="text-amber-300">★★★</span>
            </Link>
          )) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">No attack-level data yet.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[.08] bg-[#0b1119] p-5">
        <p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">Defense Leaders</p>
        <h2 className="mt-1 text-xl font-black">Best Defenders</h2>
        <p className="mt-1 text-xs text-slate-500">Lowest average stars and destruction conceded.</p>
        <div className="mt-4 space-y-2">
          {leaderboards.bestDefense.length ? leaderboards.bestDefense.map((player, index) => (
            <Link key={player.tag} href={`/player/${encodeURIComponent(player.tag)}`} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-3 hover:border-amber-400/25 hover:bg-white/[.04]">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-400/[.06] text-xs font-black text-amber-300">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">{player.name}</span>
                <span className="text-[10px] text-slate-500">{player.count} defenses · {player.avgStars.toFixed(1)}★ conceded · {Math.round(player.avgDestruction)}% destruction</span>
              </span>
              <span className="text-xs font-black text-emerald-300">{player.zeroStars} × 0★</span>
            </Link>
          )) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">No defense data yet.</p>}
        </div>
      </div>
    </section>

    <section className="mt-5 rounded-2xl border border-white/[.08] bg-[#0b1119] p-5"><div className="flex items-end justify-between gap-4 border-b border-white/[.06] pb-4"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">War History</p><h2 className="mt-1 text-xl font-black">Recent Performance</h2></div><span className="rounded-full border border-white/[.08] bg-white/[.02] px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">{wars.length} wars</span></div>
      {wars.length ? <div className="mt-4 grid gap-2 lg:grid-cols-2">{wars.slice(0,12).map(({war,result},index) => {
        const own = ownSideOf(war, clanTag);
        const enemy = own === d(war.clan) ? d(war.opponent) : d(war.clan);
        return <div key={`${warTime(war)}-${index}`} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-4 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-amber-400/15 bg-amber-400/[.05] text-amber-300"><Swords className="size-4"/></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><p className="truncate text-sm font-bold">vs {opponentLabel(war, own, enemy)}</p><span className="text-[8px] font-black tracking-[.15em] text-amber-300">{result}</span></div>
            <p className="mt-0.5 text-[10px] text-slate-500">{Math.round(Math.max(0, Math.min(100, n(own.destructionPercentage))))}% destruction</p>
          </div>
          <p className="text-sm font-black">{n(own.stars)} - {n(enemy.stars)}</p>
        </div>;
      })}</div> : <div className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No completed war statistics available yet.</div>}
    </section>
  </div></main></div></div>;
}
