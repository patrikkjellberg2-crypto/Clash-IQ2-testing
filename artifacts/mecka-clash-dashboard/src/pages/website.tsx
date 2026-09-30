import { Bot, Shield, Swords, BarChart3, Sparkles, Download, Users, X, Maximize2, Target, Trophy, BrainCircuit } from "lucide-react";
import { useState } from "react";

const LOGO = "/clash-iq-logo.webp";
const SCREENSHOTS = "/clash-iq-screenshots.webp";

export default function Website() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <header className="border-b border-white/10 bg-[#05070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3"><img src={LOGO} alt="Clash IQ" className="h-12 w-12 rounded-xl object-cover"/><div><b>Clash IQ</b><div className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Clash of Clans Intelligence</div></div></div>
          <a href="#download" className="inline-flex items-center gap-2 rounded-full bg-yellow-300 px-5 py-2.5 text-sm font-black text-black hover:bg-yellow-200"><Download className="h-4 w-4"/> Download Beta</a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_15%,rgba(250,190,40,.18),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(37,99,235,.14),transparent_32%)]"/>
          <div className="mx-auto max-w-7xl px-5 py-16 sm:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-8 h-44 w-44 rounded-[2.5rem] border border-yellow-300/20 bg-black/30 p-3 shadow-[0_0_90px_rgba(250,190,40,.16)]"><img src={LOGO} alt="Clash IQ logo" className="h-full w-full rounded-[2rem] object-cover"/></div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-yellow-200"><Sparkles className="h-4 w-4"/> Built for serious Clash players</div>
              <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">Clash IQ<span className="block text-yellow-300">Play smarter. War smarter.</span></h1>
              <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-white/60">Clash IQ brings your Clash of Clans data together in one powerful command center — with war intelligence, player statistics, AI analysis and planning tools for clans that want more from their data.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[.02]">
          <div className="mx-auto max-w-7xl px-5 py-20">
            <p className="text-xs font-black uppercase tracking-[.22em] text-yellow-300">What is Clash IQ?</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Your clan data, turned into useful intelligence.</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/55">Clash IQ is an analytics and intelligence platform for Clash of Clans players and clans. It brings important game information into one clear interface so you can understand performance, follow wars, study players and make better-informed decisions.</p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Feature icon={<Swords/>} title="War Center" text="Follow live war information, attacks, stars, destruction and the state of the battle."/>
              <Feature icon={<BrainCircuit/>} title="AI Coach" text="Use AI analysis to turn supplied clan and opponent data into practical tactical information."/>
              <Feature icon={<Target/>} title="War Planner" text="Build attack plans, assign targets, lock decisions and track execution."/>
              <Feature icon={<BarChart3/>} title="Player Intelligence" text="Explore player trends, recent form, statistics and long-term performance."/>
              <Feature icon={<Shield/>} title="Clan Overview" text="See your roster, Town Hall levels, roles, trophies and important clan information."/>
              <Feature icon={<Trophy/>} title="War History" text="Review completed wars and performance over time."/>
              <Feature icon={<Users/>} title="Member Activity" text="Understand participation and useful patterns across your clan."/>
              <Feature icon={<Bot/>} title="AI Insights" text="Generate recommendations and tactical summaries from available game data."/>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="text-xs font-black uppercase tracking-[.22em] text-blue-300">Inside the app</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">See Clash IQ in action.</h2><p className="mt-4 max-w-2xl leading-7 text-white/50">Real Clash IQ screens. Tap the gallery to open them larger.</p></div>
            <button onClick={()=>setOpen(true)} className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-bold"><Maximize2 className="h-4 w-4"/> View screenshots</button>
          </div>
          <button onClick={()=>setOpen(true)} className="group mt-10 block w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d14] shadow-2xl"><img src={SCREENSHOTS} alt="Clash IQ app screenshots" className="w-full transition duration-500 group-hover:scale-[1.01]"/></button>
        </section>

        <section className="border-y border-yellow-400/20 bg-gradient-to-r from-yellow-400/[.08] via-[#0b1018] to-blue-400/[.08]">
          <div className="mx-auto max-w-5xl px-5 py-20">
            <div className="rounded-[2rem] border border-yellow-400/20 bg-[#080c12]/90 p-8 text-center shadow-2xl sm:p-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-yellow-200"><Sparkles className="h-4 w-4"/> Beta program</div>
              <h2 className="mt-6 text-4xl font-black sm:text-5xl">Become a Clash IQ Test Pilot</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/60">Want to help test Clash IQ before the public release? Test Pilots help us find bugs, give feedback and suggest improvements while the app is being developed.</p>
              <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
                <Step n="01" t="Contact us" d="Email Clashiq.app@gmail.com and tell us you want to join."/>
                <Step n="02" t="Test & give feedback" d="Try the beta, report bugs and suggest improvements."/>
                <Step n="03" t="Lifetime Premium" d="Approved Test Pilots receive Lifetime Premium as a thank-you."/>
              </div>
              <a href="mailto:Clashiq.app@gmail.com?subject=Clash%20IQ%20Test%20Pilot" className="mt-9 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-8 py-4 font-black text-black hover:bg-yellow-200">Become a Test Pilot <Sparkles className="h-5 w-5"/></a>
              <p className="mt-4 text-xs text-white/35">Clashiq.app@gmail.com</p>
            </div>
          </div>
        </section>

        <section id="download" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20">
          <div className="rounded-[2rem] border border-blue-400/20 bg-gradient-to-br from-blue-400/10 via-[#0a0e15] to-yellow-400/10 p-8 text-center sm:p-14">
            <p className="text-xs font-black uppercase tracking-[.22em] text-blue-200/70">Android beta</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">Download Clash IQ</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/50">Download the latest Android beta and join the testing program. The beta is updated regularly.</p>
            <a href="https://github.com/patrikkjellberg2-crypto/Clash-IQ2-testing/releases/latest" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-8 py-4 font-black text-black hover:bg-yellow-200"><Download className="h-5 w-5"/> Download Beta Test</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 text-sm text-white/35 sm:flex-row sm:justify-between"><span>© 2026 Clash IQ</span><span>Clash of Clans analytics &amp; war intelligence</span></div></footer>

      {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md" onClick={()=>setOpen(false)}>
        <button aria-label="Close screenshots" onClick={()=>setOpen(false)} className="absolute right-5 top-5 z-10 grid size-12 place-items-center rounded-full border border-white/15 bg-black/70 text-white"><X className="h-6 w-6"/></button>
        <img src={SCREENSHOTS} alt="Clash IQ screenshots enlarged" className="max-h-[92vh] max-w-[96vw] rounded-2xl object-contain shadow-2xl" onClick={e=>e.stopPropagation()}/>
      </div>}
    </div>
  );
}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="rounded-2xl border border-white/10 bg-[#0a0e15] p-5 hover:border-yellow-300/20"><div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-3 text-yellow-300">{icon}</div><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{text}</p></div>}
function Step({n,t,d}:{n:string;t:string;d:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="text-xs font-black tracking-[.2em] text-yellow-300">{n}</div><h3 className="mt-2 font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-white/45">{d}</p></div>}
