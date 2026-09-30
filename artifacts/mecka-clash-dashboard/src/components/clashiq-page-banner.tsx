import { type ReactNode } from 'react';
import { useLocation } from 'wouter';

export function ClashIQPageBanner({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const needsTopClearance = !['/', '/welcome', '/login'].includes(location);
  return (
    <div className={needsTopClearance ? 'clashiq-route-frame pt-16 lg:pt-0 clashiq-landscape-no-top-clearance' : 'clashiq-route-frame'}>
      {children}
    </div>
  );
}
