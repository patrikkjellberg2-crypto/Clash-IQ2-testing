import { type ReactNode } from 'react';

// The dashboard owns its banner. Other routes render without a banner.
// Mobile pages reserve space at the top so the menu/back controls never overlap page text.
export function ClashIQPageBanner({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
