import { useEffect } from "react";
import { useLocation } from "wouter";
import { BrainCircuit, ChevronRight, Shield, Swords } from "lucide-react";

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
    [Swords, "WAR INTELLIGENCE", "Analyze every war."],
    [Shield, "PLAYER INTELLIGENCE", "Know who is performing."],
    [BrainCircuit, "AI COACH", "Make smarter decisions."],
  ] as const;

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#030507] text-white">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col overflow-hidden px-5 pb-5 pt-[max(18px,env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(245,190,60,.18),transparent_28%),radial-gradient(circle_at_12%_62%,rgba(20,55,80,.30),transparent_35%),linear-gradient(180deg,#0a1119_0%,#030507_74%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-[radial-gradient(ellipse_at_50%_5%,rgba(255,190,50,.12),transparent_55%)]" />

        <header className="relative z-20 flex items-center justify-end">
          <button
            onClick={enter}
            className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[10px] font-black uppercase tracking-[.2em] text-white/45 backdrop-blur transition hover:text-white"
          >
            Skip
          </button>
        </header>

        <section className="relative z-10 flex flex-1 flex-col items-center text-center">
          <div className="mt-3 w-full">
            <p className="text-[10px] font-black uppercase tracking-[.38em] text-amber-300">WAR INTELLIGENCE.</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[.28em] text-white/45">Built for your clan.</p>
          </div>

          <div className="relative mt-5 flex w-full flex-1 flex-col items-center">
            <div className="absolute top-2 h-[310px] w-[310px] rounded-full bg-amber-400/10 blur-[80px]" />

            <div className="relative mt-2 flex h-[285px] w-full max-w-[480px] items-center justify-center overflow-hidden">
              <div className="absolute inset-x-4 top-8 h-56 rounded-[50%] bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent blur-2xl" />
              <div className="absolute bottom-2 left-1/2 h-20 w-[110%] -translate-x-1/2 rounded-[50%] border border-amber-400/10 bg-gradient-to-t from-black/80 to-transparent" />

              <div className="absolute top-2 h-48 w-48 rounded-full border border-amber-300/10 bg-[radial-gradient(circle_at_50%_38%,rgba(255,218,120,.28),rgba(84,53,14,.12)_45%,transparent_70%)] shadow-[0_0_80px_rgba(245,190,60,.16)]" />

              <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-amber-400/25 bg-[radial-gradient(circle,rgba(74,52,18,.72),rgba(6,8,11,.96)_66%)] shadow-[0_0_70px_rgba(245,190,60,.18)]">
                <div className="absolute inset-3 rounded-full border border-amber-300/10" />
                <img
                  src="/clash-iq-icon.svg"
                  alt="Clash IQ"
                  className="relative z-10 h-40 w-40 object-contain drop-shadow-[0_0_28px_rgba(245,190,60,.42)]"
                />
              </div>

              <div className="absolute left-[8%] top-[32%] size-1.5 rounded-full bg-amber-200 shadow-[0_0_15px_#f7d269]" />
              <div className="absolute right-[10%] top-[23%] size-1 rounded-full bg-amber-300 shadow-[0_0_12px_#f7d269]" />
              <div className="absolute left-[17%] bottom-[25%] size-1 rounded-full bg-amber-200 shadow-[0_0_12px_#f7d269]" />
              <div className="absolute right-[19%] bottom-[20%] size-1.5 rounded-full bg-amber-300 shadow-[0_0_15px_#f7d269]" />
            </div>

            <div className="mt-1">
              <h1 className="font-display text-[clamp(2.4rem,12vw,4.2rem)] font-black leading-none tracking-[-.055em]">
                CLASH <span className="text-amber-300">IQ</span>
              </h1>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[.32em] text-amber-300/90">Elite War Command</p>
            </div>

            <div className="mt-7 grid w-full max-w-[470px] grid-cols-3 gap-2">
              {features.map(([Icon, title, subtitle]) => (
                <div key={title} className="rounded-2xl border border-amber-400/15 bg-black/25 px-2 py-3.5 backdrop-blur-md">
                  <div className="mx-auto grid size-9 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/[.06]">
                    <Icon className="size-4 text-amber-300" />
                  </div>
                  <p className="mt-2 text-[8px] font-black uppercase tracking-[.13em] text-white/85">{title}</p>
                  <p className="mt-1 text-[9px] leading-3.5 text-white/40">{subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-6 w-full max-w-[470px]">
            <button
              onClick={enter}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-[#ffe8a0] via-[#f3c75c] to-[#c98e20] text-[16px] font-black tracking-[.08em] text-[#17120a] shadow-[0_12px_45px_rgba(224,164,43,.24)] transition hover:brightness-105 active:scale-[.985]"
            >
              ENTER CLASH IQ
              <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-4 text-[9px] font-bold uppercase tracking-[.28em] text-white/30">Your clan. Your data. Your war.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
