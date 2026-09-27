import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MemberDetailsDialog } from '@/components/member-details-dialog';

type Dict = Record<string, unknown>;

type PlayerCardContextValue = {
  openPlayerCard: (tag: string, member?: Dict | null) => void;
  closePlayerCard: () => void;
};

const PlayerCardContext = createContext<PlayerCardContextValue | null>(null);

export function usePlayerCard() {
  const context = useContext(PlayerCardContext);
  if (!context) {
    throw new Error('usePlayerCard must be used inside PlayerCardProvider');
  }
  return context;
}

export function PlayerCardProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Dict | null>(null);
  const [loading, setLoading] = useState(false);

  const closePlayerCard = useCallback(() => {
    setPlayer(null);
    setLoading(false);
  }, []);

  const openPlayerCard = useCallback((rawTag: string, member?: Dict | null) => {
    const tag = String(rawTag || '').trim().toUpperCase();
    if (!tag) return;

    setPlayer(member ? { ...member, tag } : { tag });
    setLoading(true);

    fetch(`/api/clash/player/${encodeURIComponent(tag)}`)
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((details) => {
        if (details && typeof details === 'object') {
          setPlayer((current) => current ? { ...current, ...(details as Dict), tag } : null);
        }
      })
      .catch(() => {
        // The roster data is still useful even if the detailed player request fails.
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const playerElement = target.closest<HTMLElement>('[data-player-tag]');
      if (playerElement) {
        const tag = playerElement.dataset.playerTag;
        if (tag) {
          event.preventDefault();
          event.stopPropagation();
          openPlayerCard(tag);
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
      openPlayerCard(tag);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [openPlayerCard]);

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
