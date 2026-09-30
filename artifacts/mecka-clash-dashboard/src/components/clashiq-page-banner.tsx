import { type ReactNode } from 'react';

// The dashboard owns its banner. Other routes intentionally render without a global banner.
export function ClashIQPageBanner({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
