import { Bot, Shield, Swords, BarChart3, Sparkles, FlaskConical, Download, Github } from "lucide-react";

const LOGO = "/clash-iq-logo.webp";

export default function Website() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white overflow-x-hidden">
      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_15%,rgba(250,190,40,.18),transparent_32%),radial-gradient(circle_at_85%_35%,rgba(37,99,235,.12),transparent_30%)]" />
          <div className="mx-auto max-w-7xl px-5 pb-20 pt-12 lg:pb-28 lg:pt-16">
            <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
              <div>
                <div className="mb-7 flex justify-center lg:justify-start">
                  <div className="rounded-[2.5rem] border border-yellow-300/20 bg-black/30 p-4 shadow-[0_0_70px_rgba(250,190,40,.14)]">
                    <img src={LOGO} className="h-52 w-52 rounded-[2rem] object-cover sm:h-60 sm:w-60 lg:h-72 lg:w-72" alt="Clash IQ logo" />
                  </div>
                </div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-bold tracking-wide text-yellow-200">
                  <Sparkles className="h-4 w-4" /> CLASH OF CLANS INTELLIGENCE
                </div>
                <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-tight sm:text-6xl lg:text-7xl">
                  Clash IQ
                  <span className="block text-yellow-300">Play smarter.</span>
                </h1>
                <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
                  Clash IQ is an intelligence and analytics app for Clash of Clans players and clans. Analyze wars, players and performance and turn your game data into useful information.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <a href="#download" className="inline-flex items-center gap-2 rounded-full bg-yellow-300 px-7 py-3.5 font-black text-black hover:bg-yellow-200">
                    <Download className="h-5 w-5" /> Download Beta Test
                  </a>
                  <a href="https://github.com/patrikkjellberg2-crypto/Clash-IQ2-testing" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-7 py-3.5 font-black text-white hover:bg-white/10">
                    <Github className="h-5 w-5" /> GitHub
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-10 -z-10 rounded-[4rem] bg-yellow-400/10 blur-3xl" />
                <div className="rounded-[2rem] border border-white/10 bg-[#0b1018]/90 p-4 shadow-2xl shadow-black/60">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#080c12] p-5">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs uppercase tracking-[.2em] text-white/35">Clash IQ</p><h2 className="mt-1 text-2xl font-black">War Center</h2></div>
                      <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-yellow-300"><Swords /></div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <Stat label="War score" value="91%" /><Stat label="Stars" value="28" /><Stat label="Attacks" value="32" />
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.03] p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-400/10 p-2 text-blue-300"><Bot className="h-5 w-5" /></div>
                        <div><p className="text-sm font-bold">AI Coach</p><p className="text-xs text-white/40">Analysis for your next attack.</p></div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-yellow-300" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[.02]">
          <div className="mx-auto max-w-7xl px-5 py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-yellow-300">About Clash IQ</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Your Clash data, turned into intelligence.</h2>
              <p className="mt-5 text-base leading-8 text-white/55">Clash IQ brings important Clash of Clans information together in one place. The app is designed to help players understand their progress, help clans prepare for wars and make large amounts of game data easier to use.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Feature icon={<Swords />} title="War Center" text="Follow the current war, attacks, stars and important opportunities for your clan." />
              <Feature icon={<Bot />} title="AI Coach" text="Use AI-powered analysis to turn clan and opponent data into practical war intelligence." />
              <Feature icon={<BarChart3 />} title="Player Statistics" text="Explore player performance, progression and useful statistics in one place." />
              <Feature icon={<Shield />} title="Clan Intelligence" text="Understand your roster and use data to support better preparation and planning." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20">
          <div className="grid gap-6 lg:grid-cols-3">
            <InfoCard title="War Analysis" text="Get a clearer view of the war situation, attacks and performance instead of relying only on the in-game overview." />
            <InfoCard title="Player Insights" text="See player information and statistics together so progression and performance are easier to understand." />
            <InfoCard title="AI-powered Recommendations" text="Clash IQ can analyze available game data and provide suggestions designed to help with war decisions." />
          </div>
        </section>

        <section id="download" className="mx-auto max-w-7xl scroll-mt-8 px-5 pb-20">
          <div className="rounded-[2rem] border border-blue-400/20 bg-gradient-to-br from-blue-400/10 via-transparent to-yellow-400/10 p-8 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300"><FlaskConical className="h-7 w-7" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-blue-200/70">Android beta</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Download Clash IQ Beta Test</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/50">Download the Android beta and test the latest Clash IQ features. This is a test version and may be updated regularly.</p>
            <a href="https://github.com/patrikkjellberg2-crypto/Clash-IQ2-testing/releases/latest" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-7 py-3.5 font-black text-black hover:bg-yellow-200">
              <Download className="h-5 w-5" /> Download Beta Test
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 text-sm text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Clash IQ</span><span>Clash of Clans analytics &amp; war intelligence</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0a0e15] p-5"><div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-3 text-yellow-300">{icon}</div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{text}</p></div>;
}
function InfoCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0a0e15] p-6"><h3 className="text-lg font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-white/45">{text}</p></div>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.03] p-3"><p className="text-[10px] uppercase tracking-wider text-white/30">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;
}
