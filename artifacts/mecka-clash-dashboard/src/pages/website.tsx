import { ArrowRight, Bot, Crown, Shield, Swords, BarChart3, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Website() {
  const [, navigate] = useLocation();

  const goLogin = () => navigate("/login");

  return (
    <div className="min-h-screen bg-[#05070b] text-white overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3">
            <img src="/clash-iq-logo.webp" className="h-10 w-10 rounded-xl object-cover" alt="Clash IQ" />
            <span className="text-xl font-black tracking-tight">Clash IQ</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={goLogin} className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">Log in</button>
            <button onClick={goLogin} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:bg-white/90">Create account</button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,rgba(234,179,8,.16),transparent_34%),radial-gradient(circle_at_80%_50%,rgba(59,130,246,.10),transparent_30%)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:pt-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-semibold text-yellow-200">
                <Sparkles className="h-4 w-4" /> WAR INTELLIGENCE FOR CLANS
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-tight sm:text-6xl lg:text-7xl">
                Play smarter.
                <span className="block text-yellow-300">Know your game.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
                Clash IQ turns your Clash of Clans data into clear war intelligence, player insights and practical recommendations for your clan.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={goLogin} className="group inline-flex items-center gap-2 rounded-full bg-yellow-300 px-6 py-3.5 font-black text-black hover:bg-yellow-200">
                  Start with Clash IQ <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button onClick={goLogin} className="rounded-full border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white hover:bg-white/10">
                  Log in
                </button>
              </div>
              <p className="mt-4 text-xs text-white/35">New here? Create your account with Google in seconds.</p>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-yellow-400/10 blur-3xl" />
              <div className="rounded-[2rem] border border-white/10 bg-[#0b1018] p-4 shadow-2xl shadow-black/50">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#080c12] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[.2em] text-white/35">Clash IQ</p>
                      <h2 className="mt-1 text-2xl font-black">War Center</h2>
                    </div>
                    <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-yellow-300"><Swords /></div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Stat label="War score" value="91%" />
                    <Stat label="Stars" value="28" />
                    <Stat label="Attacks" value="32" />
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-400/10 p-2 text-blue-300"><Bot className="h-5 w-5" /></div>
                      <div>
                        <p className="text-sm font-bold">Mecka AI Coach</p>
                        <p className="text-xs text-white/40">Analysis ready for your next attack.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[82%] rounded-full bg-yellow-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[.02]">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-yellow-300">Built for serious clans</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Everything you need to understand the war.</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Feature icon={<Swords />} title="War Center" text="See the current war, attacks and key opportunities in one place." />
              <Feature icon={<Bot />} title="AI Coach" text="Turn clan and opponent data into useful attack intelligence." />
              <Feature icon={<BarChart3 />} title="Statistics" text="Track performance, trends and player development over time." />
              <Feature icon={<Shield />} title="Clan Intelligence" text="Understand your roster and make better strategic decisions." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="rounded-[2rem] border border-yellow-400/15 bg-gradient-to-br from-yellow-400/10 to-transparent p-8 sm:p-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-yellow-300"><Crown className="h-5 w-5" /><span className="font-bold">Ready when you are</span></div>
                <h2 className="mt-3 text-3xl font-black">Create your Clash IQ account.</h2>
                <p className="mt-3 max-w-xl text-white/55">Sign in with Google. New users are created automatically and can connect their Clash account afterwards.</p>
              </div>
              <button onClick={goLogin} className="shrink-0 rounded-full bg-white px-7 py-3.5 font-black text-black hover:bg-white/90">Log in / Register</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 text-sm text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Clash IQ</span>
          <button onClick={goLogin} className="text-white/55 hover:text-white">Log in / Register</button>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0e15] p-5">
      <div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-3 text-yellow-300">{icon}</div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/45">{text}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
