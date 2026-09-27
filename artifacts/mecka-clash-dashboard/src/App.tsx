import { lazy, Suspense, type ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClashIQPageBanner } from '@/components/clashiq-page-banner';
import { MemberDetailsOverlay } from '@/components/member-details-dialog';
import { WarArchiver } from '@/components/war-archiver';

import NotFound from '@/pages/not-found';
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const WarCenterPage = lazy(() => import('@/pages/war-center'));
const WarPlannerPage = lazy(() => import('@/pages/war-planner'));
const MembersPage = lazy(() => import('@/pages/members'));
const PlayerPage = lazy(() => import('@/pages/player'));
const CapitalRaidsPage = lazy(() => import('@/pages/capital-raids'));
const AICoachPage = lazy(() => import('@/pages/ai-coach'));
const StatisticsPage = lazy(() => import('@/pages/statistics'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const VillagePage = lazy(() => import('@/pages/village'));
const WarArchivePage = lazy(() => import('@/pages/war-archive'));
const WarChatPage = lazy(() => import('@/pages/war-chat'));
const PlayerHistoryPage = lazy(() => import('@/pages/player-history'));
const ActivityPage = lazy(() => import('@/pages/activity'));
const TrendsPage = lazy(() => import('@/pages/trends'));

import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="grid min-h-[60dvh] place-items-center text-sm text-white/60">
      Loading…
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <ClashIQPageBanner>
        <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/war-center" component={WarCenterPage} />
          <Route path="/war-planner" component={WarPlannerPage} />
          <Route path="/members" component={MembersPage} />
          <Route path="/capital-raids" component={CapitalRaidsPage} />
          <Route path="/ai-coach" component={AICoachPage} />
          <Route path="/statistics" component={StatisticsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/village" component={VillagePage} />
          <Route path="/war-archive" component={WarArchivePage} />
          <Route path="/war-chat" component={WarChatPage} />
          <Route path="/player-history" component={PlayerHistoryPage} />
          <Route path="/activity" component={ActivityPage} />
          <Route path="/trends" component={TrendsPage} />
          <Route path="/player/:tag" component={PlayerPage} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </ClashIQPageBanner>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [location] = useLocation();

  return (
    <ErrorBoundary resetKey={location}>
      {children}
    </ErrorBoundary>
  );
}

function ClashIQPreferences() {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    let settings = { compactMode: false, soundEffects: false };

    const applySettings = (next: typeof settings) => {
      settings = next;
      if (cancelled) return;
      document.documentElement.classList.toggle('clashiq-compact', next.compactMode);
      document.documentElement.dataset.soundEffects = next.soundEffects ? 'on' : 'off';
    };

    const handleSettingsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ compactMode?: boolean; soundEffects?: boolean }>).detail;
      applySettings({
        compactMode: Boolean(detail.compactMode),
        soundEffects: Boolean(detail.soundEffects),
      });
    };

    void fetch('/api/settings', { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('settings unavailable')))
      .then((data) => applySettings({
        compactMode: Boolean(data.compactMode),
        soundEffects: Boolean(data.soundEffects),
      }))
      .catch(() => {
        if (!cancelled) applySettings({ compactMode: false, soundEffects: false });
      });

    const playClick = () => {
      if (cancelled || !settings.soundEffects) return;
      try {
        const AudioContextCtor =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return;

        let context = audioContextRef.current;
        if (!context) {
          context = new AudioContextCtor();
          audioContextRef.current = context;
        }
        if (context.state === 'suspended') void context.resume();

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(680, now);
        oscillator.frequency.exponentialRampToValueAtTime(920, now + 0.045);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.055, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.095);
      } catch {
        // Audio is optional enhancement; never let it break the UI.
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, [role="button"]')) playClick();
    };

    document.addEventListener('clashiq-settings-changed', handleSettingsChanged);
    document.addEventListener('click', handleClick, true);

    return () => {
      cancelled = true;
      document.removeEventListener('clashiq-settings-changed', handleSettingsChanged);
      document.removeEventListener('click', handleClick, true);
      document.documentElement.classList.remove('clashiq-compact');
      delete document.documentElement.dataset.soundEffects;
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context) void context.close();
    };
  }, []);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClashIQPreferences />
      <TooltipProvider>
        <WouterRouter
          base={import.meta.env.BASE_URL.replace(/\/$/, '')}
        >
          <Router />
        </WouterRouter>

        <WarArchiver />
        <MemberDetailsOverlay />

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
