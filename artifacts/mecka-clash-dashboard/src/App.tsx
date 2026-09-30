import React, { lazy, Suspense, type ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClashIQPageBanner } from '@/components/clashiq-page-banner';
import { registerNotificationServiceWorker, notificationsSupported } from '@/lib/notifications';
import { MemberDetailsOverlay } from '@/components/member-details-dialog';
import { WarArchiver } from '@/components/war-archiver';

import NotFound from '@/pages/not-found';
const LoginPage = lazy(() => import('@/pages/login'));
const WebsitePage = lazy(() => import('@/pages/website'));
const AccountPage = lazy(() => import('@/pages/account'));
const WelcomePage = lazy(() => import('@/pages/welcome'));
const ConnectPlayerPage = lazy(() => import('@/pages/connect-player'));
const MyPlayerPage = lazy(() => import('@/pages/my-player'));
const ConnectYouTubePage = lazy(() => import('@/pages/connect-youtube'));
const AccountAdminPage = lazy(() => import('@/pages/account-admin'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const WarCenterPage = lazy(() => import('@/pages/war-center'));
const WarPlannerPage = lazy(() => import('@/pages/war-planner'));
const MembersPage = lazy(() => import('@/pages/members'));
const PlayerPage = lazy(() => import('@/pages/player'));
const CapitalRaidsPage = lazy(() => import('@/pages/capital-raids'));
const AICoachPage = lazy(() => import('@/pages/ai-coach'));
const StatisticsPage = lazy(() => import('@/pages/statistics'));
import SettingsPage from '@/pages/settings';
import AdminPage from '@/pages/admin';
const VillagePage = lazy(() => import('@/pages/village'));
const WarArchivePage = lazy(() => import('@/pages/war-archive'));
const WarChatPage = lazy(() => import('@/pages/war-chat'));
const PlayerHistoryPage = lazy(() => import('@/pages/player-history'));
const ActivityPage = lazy(() => import('@/pages/activity'));
const TrendsPage = lazy(() => import('@/pages/trends'));
const ClanMusicPage = lazy(() => import('@/pages/clan-music'));

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

function AppUpdateBanner() {
  const [update, setUpdate] = React.useState<{ latestVersion: string; releaseUrl: string; notes?: string } | null>(null);

  useEffect(() => {
    const match = navigator.userAgent.match(/ClashIQ\\/([0-9]+(?:\\.[0-9]+){0,2})/i);
    const currentVersion = match?.[1];
    if (!currentVersion) return;

    const versionParts = (value: string) => value.split('.').map((part) => Number.parseInt(part, 10) || 0);
    const isNewer = (latest: string, current: string) => {
      const a = versionParts(latest);
      const b = versionParts(current);
      for (let i = 0; i < 3; i += 1) {
        if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
        if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
      }
      return false;
    };

    fetch('/app-version.json?ts=' + Date.now(), { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('version check failed')))
      .then((data) => {
        if (data?.latestVersion && data?.releaseUrl && isNewer(String(data.latestVersion), currentVersion)) {
          setUpdate({
            latestVersion: String(data.latestVersion),
            releaseUrl: String(data.releaseUrl),
            notes: data.notes ? String(data.notes) : undefined,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!update) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-amber-400/30 bg-[#10141b]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300">↑</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wider text-amber-300">New Clash IQ version</p>
          <p className="mt-1 text-sm font-bold text-white">Version {update.latestVersion} is available.</p>
          {update.notes ? <p className="mt-1 text-xs text-slate-500">{update.notes}</p> : null}
        </div>
        <a
          href={update.releaseUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-200 transition hover:bg-amber-400/15"
        >
          Update
        </a>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="grid min-h-[60dvh] place-items-center text-sm text-white/60">
      Loading…
    </div>
  );
}

function AuthGate({ children }: { children: ReactNode }) { const [location,navigate]=useLocation(); const [ready,setReady]=React.useState(false); useEffect(()=>{if(location==='/login'||location==='/welcome'||location==='/website'){setReady(true);return;} try{if(location==='/'&&localStorage.getItem('clash_iq_welcome_seen_v2')!=='true'){navigate('/welcome');return;}}catch{} fetch('/api/auth/me',{credentials:'include'}).then(r=>{if(!r.ok&&location!=='/login')navigate('/login');else setReady(true)}).catch(()=>{if(location!=='/login')navigate('/login');setReady(true)})},[location,navigate]); if(location==='/login'||location==='/welcome')return <>{children}</>; if(!ready)return <PageLoader/>; return <>{children}</>; }

function Router() {
  return (
    <RoutedErrorBoundary>
      <ClashIQPageBanner>
        <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/website" component={WebsitePage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/welcome" component={WelcomePage} />
          <Route path="/connect-player" component={ConnectPlayerPage} />
          <Route path="/my-player" component={MyPlayerPage} />
          <Route path="/connect-youtube" component={ConnectYouTubePage} />
          <Route path="/" component={DashboardPage} />
          <Route path="/war-center" component={WarCenterPage} />
          <Route path="/war-planner" component={WarPlannerPage} />
          <Route path="/members" component={MembersPage} />
          <Route path="/capital-raids" component={CapitalRaidsPage} />
          <Route path="/ai-coach" component={AICoachPage} />
          <Route path="/statistics" component={StatisticsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/admin-tools" component={AdminPage} />
          <Route path="/admin" component={AccountAdminPage} />
          <Route path="/village" component={VillagePage} />
          <Route path="/war-archive" component={WarArchivePage} />
          <Route path="/war-chat" component={WarChatPage} />
          <Route path="/player-history" component={PlayerHistoryPage} />
          <Route path="/activity" component={ActivityPage} />
          <Route path="/trends" component={TrendsPage} />
          <Route path="/music" component={ClanMusicPage} />
          <Route path="/player/:tag" component={PlayerPage} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </ClashIQPageBanner>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClashIQWarNotifications() {
  useEffect(() => {
    if (!notificationsSupported()) return;
    let cancelled = false;
    const STORAGE_KEY = 'clash-iq-war-notifications-v1';
    const NEAR_END_MS = 2 * 60 * 60 * 1000;
    const readSent = (): Record<string, boolean> => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
    };
    const markSent = (key: string) => { const sent = readSent(); sent[key] = true; localStorage.setItem(STORAGE_KEY, JSON.stringify(sent)); };
    const show = async (title: string, body: string, tag: string) => {
      if (Notification.permission !== 'granted') return;
      const registration = await registerNotificationServiceWorker();
      if (!registration) return;
      const worker = (await navigator.serviceWorker.ready).active;
      worker?.postMessage({ type: 'CLASH_IQ_PUSH_NOTIFICATION', title, body, tag });
    };
    const check = async () => {
      try {
        const response = await fetch('/api/clash/dashboard', { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (!response.ok || cancelled) return;
        const dashboard = await response.json();
        const war = dashboard?.currentWar;
        const activeStorageKey = 'clash-iq-active-war-v1';
        const storedActive = (() => {
          try { return JSON.parse(localStorage.getItem(activeStorageKey) || 'null'); } catch { return null; }
        })();

        if (!war || !['preparation', 'inWar', 'matchmaking'].includes(String(war.state || ''))) {
          if (storedActive?.warId) {
            const sent = readSent();
            if (!sent[storedActive.warId + ':ended']) {
              await show('🏁 War avslutad', 'War mot ' + (storedActive.opponent || 'motståndaren') + ' är avslutad.', storedActive.warId + ':ended');
              markSent(storedActive.warId + ':ended');
            }
            localStorage.removeItem(activeStorageKey);
          }
          return;
        }
        const start = Date.parse(String(war.startTime || ''));
        const end = Date.parse(String(war.endTime || ''));
        if (!Number.isFinite(start)) return;
        const opponent = war?.opponent?.name || war?.opponent?.tag || 'motståndaren';
        const warId = String(war.warId || (war.opponent?.tag || opponent) + '-' + war.startTime);
        const sent = readSent();
        if (!sent[warId + ':started'] && Date.now() >= start) { await show('⚔️ Ny war startar', 'War mot ' + opponent + ' är igång.', warId + ':started'); markSent(warId + ':started'); }
        if (!sent[warId + ':12h'] && Date.now() >= start + 12 * 60 * 60 * 1000) { await show('⏱️ 12 timmar har gått', 'War mot ' + opponent + ' har passerat 12 timmar.', warId + ':12h'); markSent(warId + ':12h'); }
        if (Number.isFinite(end) && !sent[warId + ':near-end'] && end - Date.now() <= NEAR_END_MS && end > Date.now()) { await show('🚨 War närmar sig slutet', 'Mindre än 2 timmar kvar mot ' + opponent + '.', warId + ':near-end'); markSent(warId + ':near-end'); }
      } catch {}
    };
    void registerNotificationServiceWorker();
    void check();
    const timer = window.setInterval(() => void check(), 30_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);
  return null;
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
      applySettings({ compactMode: Boolean(detail.compactMode), soundEffects: Boolean(detail.soundEffects) });
    };

    void fetch('/api/settings', { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('settings unavailable')))
      .then((data) => applySettings({ compactMode: Boolean(data.compactMode), soundEffects: Boolean(data.soundEffects) }))
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
      } catch {}
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
      <ClashIQWarNotifications />
      <AppUpdateBanner />
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthGate><Router /></AuthGate>
        </WouterRouter>
        <WarArchiver />
        <MemberDetailsOverlay />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
