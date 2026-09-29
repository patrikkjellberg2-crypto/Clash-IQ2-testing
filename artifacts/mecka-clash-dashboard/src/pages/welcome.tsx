import { useEffect } from "react";
import { useLocation } from "wouter";
import { BarChart3, ChevronRight, Swords, Users } from "lucide-react";

const WELCOME_KEY = "clash_iq_welcome_seen_v2";

export default function WelcomePage() {
  const [, navigate] = useLocation();

  const enter = () => {
    try { localStorage.setItem(WELCOME_KEY, "true"); } catch {}
    navigate("/login");
  };

  useEffect(() => {
    try {
      if (localStorage.getItem(WELCOME_KEY) === "true") navigate("/login");
    } catch {}
  }, [navigate]);

  const features = [
    [Swords, "Analyze", "your wars"],
    [BarChart3, "Improve", "your strategy"],
    [Users, "Dominate", "your clan"],
  ] as const;

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#05080d] text-white">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col overflow-hidden px-5 pb-5 pt-[max(22px,env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,184,52,.15),transparent_28%),radial-gradient(circle_at_15%_70%,rgba(20,72,108,.22),transparent_34%),linear-gradient(180deg,#07111d_0%,#05080d_72%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:32px_32px]" />

        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/clash-iq-logo.webp" alt="Clash IQ" className="h-9 w-9 rounded-xl object-cover shadow-[0_0_20px_rgba(245,190,60,.18)]" />
            <span className="font-display text-sm font-bold tracking-[.12em] text-[#f8d36a]">CLASH-IQ</span>
          </div>
          <button onClick={enter} className="px-2 py-2 text-sm font-semibold text-white/55 transition hover:text-white">Skip</button>
        </header>

        <section className="relative z-10 flex flex-1 flex-col items-center pt-8 text-center">
          <p className="text-[10px] font-black tracking-[.34em] text-[#e9b83f]">AI-POWERED WAR INTELLIGENCE</p>
          <h1 className="mt-3 max-w-[420px] font-display text-[clamp(2.25rem,10vw,3.7rem)] font-black leading-[.94] tracking-[-.04em]">
            WELCOME TO
            <span className="mt-1 block bg-gradient-to-b from-[#fff4bd] via-[#f4c653] to-[#b87916] bg-clip-text text-transparent">CLASH-IQ!</span>
          </h1>
          <p className="mt-4 max-w-[340px] text-sm font-medium uppercase tracking-[.22em] text-white/65">Start your journey to victory.</p>

          <div className="relative mt-7 w-full max-w-[430px]">
            <div className="absolute inset-x-8 top-8 h-40 rounded-full bg-[#e6a92e]/10 blur-3xl" />
            <div className="relative h-[230px] overflow-hidden rounded-[30px] border border-[#d7a83d]/20 bg-[linear-gradient(145deg,#111c27,#081019)] shadow-[0_25px_70px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.06)]">
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(238,190,73,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(238,190,73,.16)_1px,transparent_1px)] [background-size:30px_30px] [transform:perspective(500px)_rotateX(58deg)_scale(1.35)_translateY(38px)]" />
              <div className="absolute left-[15%] top-[24%] h-2.5 w-2.5 rounded-full bg-[#f7d269] shadow-[0_0_18px_#f7d269]" />
              <div className="absolute left-[29%] top-[48%] h-2 w-2 rounded-full bg-[#f7d269] shadow-[0_0_15px_#f7d269]" />
              <div className="absolute right-[28%] top-[32%] h-2.5 w-2.5 rounded-full bg-[#f7d269] shadow-[0_0_18px_#f7d269]" />
              <div className="absolute right-[15%] bottom-[27%] h-2 w-2 rounded-full bg-[#f7d269] shadow-[0_0_15px_#f7d269]" />
              <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center rounded-[28px] border border-[#f3c34c]/50 bg-[radial-gradient(circle,#634816,#17130b_68%)] shadow-[0_0_45px_rgba(245,190,60,.22)]">
                <Swords className="-rotate-45 h-12 w-12 text-[#f8d36a]" strokeWidth={1.6} />
              </div>
              <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
                <div className="text-[8px] font-black tracking-[.22em] text-[#e8ba49]">WAR MAP</div>
                <div className="mt-0.5 text-[11px] font-semibold text-white/70">Plan. Analyze. Win.</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid w-full max-w-[430px] grid-cols-3 gap-2.5">
            {features.map(([Icon, title, subtitle]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[.035] px-2 py-3.5 backdrop-blur-sm">
                <Icon className="mx-auto h-5 w-5 text-[#f3c34c]" strokeWidth={1.8} />
                <div className="mt-2 text-[11px] font-bold text-white/90">{title}</div>
                <div className="text-[10px] leading-4 text-white/45">{subtitle}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto w-full max-w-[430px] pt-6">
            <button onClick={enter} className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#f5d477]/70 bg-gradient-to-b from-[#ffe9a1] via-[#f3c75c] to-[#d39a27] text-[17px] font-black tracking-wide text-[#17120a] shadow-[0_12px_35px_rgba(224,164,43,.22)] transition active:scale-[.985]">
              GET STARTED
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button onClick={enter} className="mt-4 w-full py-2 text-sm text-white/65">
              Already have an account? <span className="font-bold text-[#f2c653]">LOG IN</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
