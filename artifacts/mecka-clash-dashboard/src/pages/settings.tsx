import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  Activity,
  ArrowLeft,
  Bell,
  Bot,
  Check,
  ChevronRight,
  Database,
  Globe2,
  LockKeyhole,
  Palette,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Shield,
  Swords,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';

function Toggle({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={enabled}
      className={
        enabled
          ? 'relative h-6 w-11 shrink-0 rounded-full border border-amber-300/30 bg-amber-400/80'
          : 'relative h-6 w-11 shrink-0 rounded-full border border-white/10 bg-white/[0.06]'
      }
    >
      <span
        className={
          enabled
            ? 'absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow-md transition'
            : 'absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-md transition'
        }
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bot;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-white/5 py-4 last:border-b-0">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.035]">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: typeof Bot;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#11151c]/90 p-5 shadow-xl md:p-6">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10">
          <Icon className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">{eyebrow}</p>
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wifi;
  label: string;
  value: string;
  tone: 'green' | 'blue' | 'amber';
}) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-300'
      : tone === 'blue'
        ? 'border-blue-400/15 bg-blue-400/[0.04] text-blue-300'
        : 'border-amber-400/15 bg-amber-400/[0.04] text-amber-300';

  return (
    <div className={'rounded-2xl border p-4 ' + toneClass}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [warAlerts, setWarAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const settings = {
    aiEnabled,
    notifications,
    warAlerts,
    autoRefresh,
    compactMode,
    soundEffects,
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setLoading(true);
        setLoadError('');
        const response = await fetch('/api/settings', {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Settings could not be loaded.');
        const data = await response.json();
        if (cancelled) return;
        setAiEnabled(Boolean(data.aiEnabled));
        setNotifications(Boolean(data.notifications));
        setWarAlerts(Boolean(data.warAlerts));
        setAutoRefresh(Boolean(data.autoRefresh));
        setCompactMode(Boolean(data.compactMode));
        setSoundEffects(Boolean(data.soundEffects));
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Settings could not be loaded.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistSettings(next: typeof settings) {
    setSaving(true);
    setLoadError('');
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(next),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Settings could not be saved.');
      }
      const data = await response.json();
      setAiEnabled(Boolean(data.aiEnabled));
      setNotifications(Boolean(data.notifications));
      setWarAlerts(Boolean(data.warAlerts));
      setAutoRefresh(Boolean(data.autoRefresh));
      setCompactMode(Boolean(data.compactMode));
      setSoundEffects(Boolean(data.soundEffects));
      window.dispatchEvent(new CustomEvent('clashiq-settings-changed', { detail: { compactMode: Boolean(data.compactMode), soundEffects: Boolean(data.soundEffects) } }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Settings could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function updateAndSave(key: keyof typeof settings, value: boolean) {
    const next = { ...settings, [key]: value };
    if (key === 'aiEnabled') setAiEnabled(value);
    if (key === 'notifications') setNotifications(value);
    if (key === 'warAlerts') setWarAlerts(value);
    if (key === 'autoRefresh') setAutoRefresh(value);
    if (key === 'compactMode') setCompactMode(value);
    if (key === 'soundEffects') setSoundEffects(value);
    void persistSettings(next);
  }

  function saveSettings() {
    void persistSettings(settings);
  }

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <div className="flex min-h-screen bg-[#07090d]">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <header className="border-b border-white/5 bg-[#07090d]/85 px-5 py-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
              <div className="min-w-0">
                <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 transition hover:text-amber-200">
                  <ArrowLeft className="h-4 w-4" />
                  Command Center
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">Settings</h1>
                  <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">Elite</span>
                </div>
              </div>

              <button
                type="button"
                onClick={saveSettings}
                disabled={loading || saving}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider text-amber-200 transition hover:bg-amber-400/15"
              >
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">{saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}</span>
                <span className="sm:hidden">{saving ? 'Saving…' : saved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 md:px-8 md:py-8">
          {loadError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-200">
              {loadError}
            </div>
          ) : null}

            <section className="relative overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-[#17130b] via-[#0e1117] to-[#090b10] p-6 shadow-2xl md:p-8">
              <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                      <SettingsIcon className="h-5 w-5 text-amber-300" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">Command configuration</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                    CLAN COMMAND
                    <span className="block text-amber-300">SETTINGS</span>
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                    Control how Clash IQ behaves, how often data refreshes and which tactical alerts and AI features are active.
                  </p>
                </div>

                <div className="hidden h-36 w-36 shrink-0 place-items-center rounded-full border border-amber-400/20 bg-black/20 lg:grid">
                  <div className="relative grid h-24 w-24 place-items-center rounded-full border border-amber-400/10">
                    <SettingsIcon className="h-10 w-10 text-amber-300/80" />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <StatusCard icon={Wifi} label="Clash data" value="Connected" tone="green" />
              <StatusCard icon={Database} label="War archive" value="Available" tone="blue" />
              <StatusCard icon={Bot} label="AI Coach" value={aiEnabled ? 'Enabled' : 'Disabled'} tone="amber" />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Section icon={Globe2} eyebrow="01 • General" title="Interface">
                <SettingRow icon={RefreshCw} title="Automatic refresh" description="Keep clan, war and player data refreshed while you work.">
                  <Toggle enabled={autoRefresh} onClick={() => updateAndSave('autoRefresh', !autoRefresh)} />
                </SettingRow>
                <SettingRow icon={Palette} title="Compact interface" description="Use tighter spacing when you want more information on screen.">
                  <Toggle enabled={compactMode} onClick={() => updateAndSave('compactMode', !compactMode)} />
                </SettingRow>
                <SettingRow icon={Volume2} title="Sound effects" description="Enable interface feedback for important command-center actions.">
                  <Toggle enabled={soundEffects} onClick={() => updateAndSave('soundEffects', !soundEffects)} />
                </SettingRow>
              </Section>

              <Section icon={Bot} eyebrow="02 • Intelligence" title="AI Coach">
                <SettingRow icon={Sparkles} title="AI analysis" description="Allow tactical analysis and recommendations from AI Coach.">
                  <Toggle enabled={aiEnabled} onClick={() => updateAndSave('aiEnabled', !aiEnabled)} />
                </SettingRow>
                <div className="mt-4 rounded-2xl border border-blue-400/15 bg-blue-400/[0.04] p-4">
                  <div className="flex items-start gap-3">
                    <Bot className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider text-blue-300">Tactical intelligence</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Analyze your clan or opponent and get attack priorities, threats and strategic recommendations.
                      </p>
                      <Link href="/ai-coach" className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-300 hover:text-blue-200">
                        Open AI Coach <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Section>

              <Section icon={Swords} eyebrow="03 • War operations" title="War alerts">
                <SettingRow icon={Bell} title="Notifications" description="Enable Clash IQ command-center notifications.">
                  <Toggle enabled={notifications} onClick={() => updateAndSave('notifications', !notifications)} />
                </SettingRow>
                <SettingRow icon={Swords} title="War alerts" description="Highlight important active-war and attack activity.">
                  <Toggle enabled={warAlerts} onClick={() => updateAndSave('warAlerts', !warAlerts)} />
                </SettingRow>
              </Section>

              <Section icon={Shield} eyebrow="04 • Privacy" title="Security">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                    <LockKeyhole className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="text-xs font-black text-white">API credentials stay server-side</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Clash and AI credentials are not displayed in the app interface.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                    <Database className="mt-0.5 h-5 w-5 text-blue-300" />
                    <div>
                      <p className="text-xs font-black text-white">Persistent war data</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Archived war and raid data is stored by the Clash IQ backend.</p>
                    </div>
                  </div>
                </div>
              </Section>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
