import { type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export function ClashIQPageBanner({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const needsTopClearance = !['/', '/welcome', '/login'].includes(location);
  const publicRoute = ['/', '/welcome', '/login', '/website', '/account'].includes(location);
  return (
    <div className={needsTopClearance ? 'clashiq-route-frame pt-16 lg:pt-0 clashiq-landscape-no-top-clearance' : 'clashiq-route-frame'}>
      {!publicRoute ? (
        <button
          type="button"
          aria-label="Go back"
          title="Back"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = '/';
          }}
          className="clashiq-global-back fixed z-50 grid size-11 place-items-center rounded-xl border border-amber-400/40 bg-[#0b0d12]/95 text-amber-300 shadow-[0_0_18px_rgba(245,190,60,.18)] backdrop-blur-xl transition hover:border-amber-300/70 hover:bg-amber-400/10 hover:text-amber-200 active:scale-95"
        >
          <ArrowLeft className="size-4" />
        </button>
      ) : null}
      {children}
    </div>
  );
}
