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
              </div>

            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-yellow-400/20 bg-gradient-to-r from-yellow-400/[.08] via-[#0b1018] to-blue-400/[.08]">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_50%,rgba(250,190,40,.16),transparent_30%),radial-gradient(circle_at_80%_50%,rgba(37,99,235,.10),transparent_30%)]" />
          <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
            <div className="mx-auto max-w-4xl rounded-[2rem] border border-yellow-400/20 bg-[#080c12]/80 p-7 text-center shadow-2xl shadow-black/40 sm:p-10">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-yellow-200">
                <FlaskConical className="h-4 w-4" /> Beta Program
              </div>
              <h2 className="mt-6 text-5xl font-black uppercase tracking-tight text-yellow-300 sm:text-6xl lg:text-7xl">Test Pilot</h2>
              <p className="mt-5 text-xl font-bold text-white sm:text-2xl">Become a Clash IQ Test Pilot</p>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/60">
                Want to help us improve Clash IQ before the public release? Contact us at
                <a href="mailto:Clashiq.app@gmail.com" className="mx-1 font-black text-yellow-300 hover:text-yellow-200">Clashiq.app@gmail.com</a>
                to become a beta test pilot.
              </p>
              <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-yellow-400/20 bg-yellow-400/[.06] px-5 py-4">
                <p className="text-sm leading-7 text-white/75">
                  As a thank-you for helping us test, give feedback and improve the app, <span className="font-black text-yellow-200">Test Pilots are offered Lifetime Premium</span> at no cost.
                </p>
              </div>
              <a href="mailto:Clashiq.app@gmail.com?subject=Clash%20IQ%20Test%20Pilot" className="mt-7 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-8 py-4 font-black text-black shadow-lg shadow-yellow-400/10 hover:bg-yellow-200">
                Become a Test Pilot <Sparkles className="h-5 w-5" />
              </a>
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
