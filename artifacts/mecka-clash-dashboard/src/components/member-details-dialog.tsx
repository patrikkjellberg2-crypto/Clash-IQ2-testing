import { useEffect, useState } from 'react';
import { X, Trophy, Swords, Shield, Gift, UserRound, Crown, Activity } from 'lucide-react';
import { useGetClashDashboard } from '@workspace/api-client-react';

type Dict = Record<string, unknown>;
const asDict = (value: unknown): Dict => value && typeof value === 'object' ? value as Dict : {};
const str = (value: unknown, fallback = '—') => typeof value === 'string' ? value : fallback;
const num = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback;
const label = (value: unknown, fallback = '—') => str(value, fallback);
const compact = (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const rankingNumber = (value: unknown) => typeof value === 'number' && value > 0 ? value : null;
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'MC';

export function MemberDetailsDialog({ member, onClose }: { member: Dict | null; onClose: () => void }) {
  if (!member) return null;
  const name = label(member.name, 'Unknown player');
  const league = asDict(member.league);
  const rankedLeague = asDict(member.leagueTier);
  const builderLeague = asDict(member.builderBaseLeague);
  const builderHallLevel = num(member.builderHallLevel, num(member.builderBaseHallLevel, num(member.builderHallLevel)));
  const attacks = Array.isArray(member.attacks) ? member.attacks.map(asDict) : [];
  const activity = asDict(member.activity);
  const rankings = asDict(member.rankings);
  const homeVillageRanking = asDict(rankings.homeVillage);
  const rankingLocation = asDict(rankings.location);
  const worldRank = rankingNumber(homeVillageRanking.globalRank);
  const countryRank = rankingNumber(homeVillageRanking.localRank);
  const countryName = str(rankingLocation.name, 'Country');
  const countryCode = str(rankingLocation.countryCode, '');
  const activityScore = num(activity.score, -1);
  const clan = asDict(member.clan);
  const clanBadgeUrls = asDict(clan.badgeUrls);
  const leagueIconUrls = asDict(league.iconUrls);
  const rankedLeagueIconUrls = asDict(rankedLeague.iconUrls);
  const builderLeagueIconUrls = asDict(builderLeague.iconUrls);
  const clanBadgeUrl = str(clanBadgeUrls.medium, str(clanBadgeUrls.large, str(clanBadgeUrls.small, "")));
  const leagueIconUrl = str(leagueIconUrls.medium, str(leagueIconUrls.small, str(leagueIconUrls.tiny, "")));
  const rankedLeagueIconUrl = str(rankedLeagueIconUrls.medium, str(rankedLeagueIconUrls.small, str(rankedLeagueIconUrls.tiny, "")));
  const builderLeagueIconUrl = str(builderLeagueIconUrls.medium, str(builderLeagueIconUrls.small, str(builderLeagueIconUrls.tiny, "")));
  const stars = attacks.reduce((sum, attack) => sum + num(attack.stars), 0);
  const destruction = attacks.length ? Math.round(attacks.reduce((sum, attack) => sum + num(attack.destructionPercentage), 0) / attacks.length) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#061827]/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Player card ${name}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="max-h-[90dvh] w-full max-w-[620px] overflow-y-auto rounded-t-3xl border border-card-border bg-card shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-border/70 bg-card/95 p-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10">
              {clanBadgeUrl ? (
                <img
                  src={clanBadgeUrl}
                  alt=""
                  className="size-11 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,.35)]"
                  loading="lazy"
                  onError={(event) => { event.currentTarget.style.display = "none"; }}
                />
              ) : (
                <span className="font-display text-sm font-bold text-primary">{initials(name)}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-display text-xl font-bold tracking-[-.04em]">{name}</p>
                {leagueIconUrl && (
                  <img
                    src={leagueIconUrl}
                    alt=""
                    className="size-7 shrink-0 object-contain"
                    loading="lazy"
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 font-data text-xs text-muted-foreground">
                <span>{str(member.tag)}</span>
                <span>·</span>
                <span>#{num(member.clanRank)} in clan</span>
                <span>·</span>
                <span className="text-primary">TH {num(member.townHallLevel, num(member.townhallLevel))}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:border-primary/40 hover:text-primary" aria-label="Close player card"><X className="size-4" /></button>
        </header>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {(clanBadgeUrl || leagueIconUrl || rankedLeagueIconUrl || builderLeagueIconUrl) && (
            <div className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-4 sm:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.12em] text-primary">Player identity</p>
                  <p className="mt-1 text-sm font-semibold">{label(clan.name, "Clan member")}</p>
                </div>
                <div className="flex items-center gap-3">
                  {leagueIconUrl && (
                    <div className="grid size-12 place-items-center rounded-xl bg-black/20">
                      <img src={leagueIconUrl} alt="" className="size-9 object-contain" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                    </div>
                  )}
                  {builderLeagueIconUrl && (
                    <div className="grid size-12 place-items-center rounded-xl bg-black/20">
                      <img src={builderLeagueIconUrl} alt="" className="size-9 object-contain" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-secondary/60 p-4"><div className="flex items-center gap-2 text-primary"><Trophy className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Trophies</span></div><p className="mt-2 font-data text-2xl font-bold">{compact(num(member.trophies))}</p><p className="mt-1 text-xs text-muted-foreground">{label(league.name, 'Unranked')}</p></div>
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4"><div className="flex items-center gap-2 text-primary"><Trophy className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Ranked League</span></div><div className="mt-2 flex items-center gap-3">{rankedLeagueIconUrl ? <img src={rankedLeagueIconUrl} alt="" className="size-10 object-contain" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}<div><p className="font-data text-lg font-bold">{label(rankedLeague.name, "Unranked")}</p><p className="mt-1 text-xs text-muted-foreground">Current Ranked Battles league</p></div></div></div>
          <div className="rounded-2xl bg-secondary/60 p-4"><div className="flex items-center gap-2 text-primary"><Crown className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Experience</span></div><p className="mt-2 font-data text-2xl font-bold">Lv {num(member.expLevel)}</p><p className="mt-1 text-xs text-muted-foreground">Town Hall {num(member.townHallLevel, num(member.townhallLevel))}</p></div>
          {(worldRank !== null || countryRank !== null) && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.045] p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-amber-300">
                <Trophy className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em]">Home Village Ranking</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {worldRank !== null && (
                  <div className="rounded-xl border border-amber-400/15 bg-black/10 p-3">
                    <p className="text-xs text-muted-foreground">World Ranking</p>
                    <p className="mt-1 font-data text-2xl font-black text-amber-200">#{worldRank.toLocaleString('en-US')}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Current Home Village global rank</p>
                  </div>
                )}
                {countryRank !== null && (
                  <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.035] p-3">
                    <p className="text-xs text-muted-foreground">{countryName} Ranking</p>
                    <p className="mt-1 font-data text-2xl font-black text-emerald-200">#{countryRank.toLocaleString('en-US')}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Current Home Village local rank</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-secondary/60 p-4"><div className="flex items-center gap-2 text-primary"><Gift className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Donations</span></div><p className="mt-2 font-data text-2xl font-bold">{compact(num(member.donations))}</p><p className="mt-1 text-xs text-muted-foreground">mottagna {compact(num(member.donationsReceived))}</p></div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.035] p-4"><div className="flex items-center gap-2 text-amber-300"><UserRound className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Builder Base</span></div><div className="mt-2 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-amber-400/10"><span className="font-data text-lg font-black text-amber-200">{builderHallLevel > 0 ? `BH${builderHallLevel}` : "BH—"}</span></div><div><p className="font-data text-xl font-bold">{compact(num(member.builderBaseTrophies))}</p><p className="mt-1 text-xs text-muted-foreground">{label(builderLeague.name, 'No league')}</p></div></div></div>
          {activityScore >= 0 && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-emerald-300">
                <Activity className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-[.12em]">War activity</span>
                <span className="ml-auto font-data text-lg font-black">{activityScore}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, activityScore))}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground">Wars</span><p className="font-data font-bold">{num(activity.participatedWars)}/{num(activity.windowWars)}</p></div>
                <div><span className="text-muted-foreground">Attacks</span><p className="font-data font-bold">{num(activity.attacksUsed)}/{num(activity.attacksPossible)}</p></div>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Based on the last 10 completed wars. This measures war activity, not attack quality.</p>
            </div>
          )}

          {attacks.length > 0 && <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:col-span-2"><div className="flex items-center gap-2 text-primary"><Swords className="size-4" /><span className="text-[10px] font-bold uppercase tracking-[.12em]">Current war</span></div><div className="mt-3 grid grid-cols-3 gap-3"><div><p className="text-xs text-muted-foreground">Attacks</p><p className="font-data text-lg font-bold">{attacks.length}/2</p></div><div><p className="text-xs text-muted-foreground">Stars</p><p className="font-data text-lg font-bold">{stars}</p></div><div><p className="text-xs text-muted-foreground">Average destruction</p><p className="font-data text-lg font-bold">{destruction}%</p></div></div></div>}
          {member.clanRank !== undefined && <div className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs text-muted-foreground sm:col-span-2"><Shield className="size-3.5 text-primary" /> Previous clan rank: <span className="font-data font-bold text-foreground">#{num(member.previousClanRank)}</span></div>}
        </div>
      </section>
    </div>
  );
}


/**
 * Global player-card trigger. Any player link (/player/:tag) or element with
 * data-player-tag opens the same Player Card without navigating away.
 */
export function MemberDetailsOverlay() {
  const { data } = useGetClashDashboard();
  const [selected, setSelected] = useState<Dict | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tagged = target.closest('[data-player-tag]') as HTMLElement | null;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      const href = link?.getAttribute('href') || '';
      const playerRoute = href.match(/^\/player\/(.+)$/);

      if (!tagged && !playerRoute) return;

      const tag = (tagged?.getAttribute('data-player-tag') ||
        (playerRoute ? decodeURIComponent(playerRoute[1]) : '')).trim();
      if (!tag) return;

      event.preventDefault();
      event.stopPropagation();

      const dashboard = data && typeof data === 'object' ? data as Dict : {};
      const members = Array.isArray(dashboard.members) ? dashboard.members : [];
      const member = members.find((item) => {
        const candidate = item && typeof item === 'object' ? item as Dict : {};
        return str(candidate.tag, '').toUpperCase() === tag.toUpperCase();
      });

      const clan = dashboard.clan && typeof dashboard.clan === 'object'
        ? dashboard.clan as Dict
        : null;

      const explicitName = tagged?.getAttribute('data-player-name') || '';
      const linkedName = link?.querySelector('p, span')?.textContent?.trim() || '';
      const fallbackName = tagged?.textContent?.trim().split('\\n')[0] || '';
      const name = explicitName || linkedName || fallbackName || 'Unknown player';

      setSelected(
        member && typeof member === 'object'
          ? { ...(member as Dict), clan: clan ?? (member as Dict).clan }
          : { tag, name, clan },
      );
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [data]);

  return <MemberDetailsDialog member={selected} onClose={() => setSelected(null)} />;
}
