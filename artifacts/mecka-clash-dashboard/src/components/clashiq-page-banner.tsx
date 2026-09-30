import { type ReactNode } from 'react';
import { useLocation } from 'wouter';

// The dashboard owns its banner. Other routes render without a banner.
// Mobile pages reserve space at the top so the menu/back controls never overlap page text.
export function ClashIQPageBanner({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const compactRoutes = location !== '/' && location !== '/welcome' && location !== '/login';

  if (!compactRoutes) return <>{children}</>;

  return (
    <div className="clashiq-route-frame">
      <style>{`
        @media (max-width: 1023px) {
          .clashiq-route-frame main {
            padding-top: 64px !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
