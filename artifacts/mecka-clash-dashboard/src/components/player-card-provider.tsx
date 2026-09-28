import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGetClashDashboard } from '@workspace/api-client-react';
import { MemberDetailsDialog } from '@/components/member-details-dialog';

type Dict = Record<string, unknown>;

type PlayerCardContextValue = {
  openPlayerCard: (tag: string, member?: Dict | null) => void;
  closePlayerCard: () => void;
};

const PlayerCardContext = createContext<PlayerCardContextValue | null>(null);

const asDict = (value: unknown): Dict =>
  value && typeof value === 'object' ? value as Dict : {};

const asMembers = (value: unknown): Dict[] =>
  Array.isArray(value)
    ? value.map(asDict)
    : [];

const normalizeTag = (value: unknown) =>
  String(value || '').trim().toUpperCase();

export function usePlayerCard() {
  const context = useContext(PlayerCardContext);
  if (!context) {
    throw new Error('usePlayerCard must be used inside PlayerCardProvider');
  }
  return context;
}

export function PlayerCardProvider({ children }: { children: ReactNode }) {
  const { data: dashboardData } = useGetClashDashboard();
  const [player, setPlayer] = useState<Dict | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const closePlayerCard = useCallback(() => {
    requestId.current += 1;
    setPlayer(null);
    setLoading(false);
  }, []);

  const openPlayerCard = useCallback((rawTag: string, member?: Dict | null) => {
    const tag = normalizeTag(rawTag);
    if (!tag) return;

    const id = ++requestId.current;

    // Open immediately with roster data. Live enrichment is optional and
    // must never be allowed to break the player card.
    setPlayer(member ? { ...member, tag } : { tag });
    setLoading(true);

    fetch(`/api/clash/player/${encodeURIComponent(tag)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((details) => {
        if (id !== requestId.current) return;
        if (details && typeof details === 'object') {
          setPlayer((current) =>
            current ? { ...current, ...(details as Dict), tag } : null,
          );
        }
      })
      .catch(() => {
        // Detailed player data is best-effort. The roster card stays open
        // even when the live player endpoint is unavailable.
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const dashboard = asDict(dashboardData);
    const members = asMembers(dashboard.members);
    const clan = asDict(dashboard.clan);

    const findRosterMember = (tag: string) =>
      members.find((candidate) => normalizeTag(candidate.tag) === normalizeTag(tag)) || null;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const playerElement = target.closest<HTMLElement>('[data-player-tag]');
      if (playerElement) {
        const tag = playerElement.dataset.playerTag;
        if (tag) {
          event.preventDefault();
          event.stopPropagation();

          const member = findRosterMember(tag);
          openPlayerCard(tag, member ? { ...member, clan } : null);
          return;
        }
      }

      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;

      const href = link.getAttribute('href') || '';
      const match = href.match(/^\/player\/([^/?#]+)/);
      if (!match) return;

      const tag = decodeURIComponent(match[1]);
      if (!tag) return;

      event.preventDefault();
      event.stopPropagation();

      const member = findRosterMember(tag);
      openPlayerCard(tag, member ? { ...member, clan } : null);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [dashboardData, openPlayerCard]);

  const value = useMemo(
    () => ({ openPlayerCard, closePlayerCard }),
    [openPlayerCard, closePlayerCard],
  );

  return (
    <PlayerCardContext.Provider value={value}>
      {children}

      {player && (
        <div className="relative">
          {loading && (
            <div className="fixed inset-0 z-[99] pointer-events-none">
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/20 bg-[#07111a]/95 px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] text-amber-300 shadow-xl">
                Loading player intelligence…
              </div>
            </div>
          )}

          <MemberDetailsDialog
            member={player}
            onClose={closePlayerCard}
          />
        </div>
      )}
    </PlayerCardContext.Provider>
  );
}
