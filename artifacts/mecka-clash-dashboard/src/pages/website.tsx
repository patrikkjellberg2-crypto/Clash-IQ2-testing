import { Bot, Shield, Swords, BarChart3, Sparkles, Download, Users, X, Maximize2, Target, Trophy, BrainCircuit, Smartphone } from "lucide-react";
import { useState } from "react";

const LOGO = "/clash-iq-logo.webp";
const SCREENSHOTS = [
  "https://raw.githubusercontent.com/patrikkjellberg2-crypto/Clash-IQ2-testing/dev-v3.1/screenshots/clash-iq-stars.jpg",
  "https://raw.githubusercontent.com/patrikkjellberg2-crypto/Clash-IQ2-testing/dev-v3.1/screenshots/clash-iq-members.jpg",
  "https://raw.githubusercontent.com/patrikkjellberg2-crypto/Clash-IQ2-testing/dev-v3.1/screenshots/clash-iq-account-center.jpg",
];

export default function Website() {
  const [open, setOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_15%,rgba(250,190,40,.18),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(37,99,235,.14),transparent_32%)]"/>
          <div className="mx-auto max-w-7xl px-5 py-16 sm:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-8 h-44 w-44 rounded-[2.5rem] border border-yellow-300/20 bg-black/30 p-3 shadow-[0_0_90px_rgba(250,190,40,.16)]"><img src={LOGO} alt="Clash IQ logo" className="h-full w-full rounded-[2rem] object-cover"/></div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-blue-100"><Smartphone className="h-4 w-4"/> Android app</div><div className="mt-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-yellow-200"><Sparkles className="h-4 w-4"/> Built for serious Clash players</div>
              <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">Clash IQ<span className="block text-yellow-300">Play smarter. War smarter.</span></h1>
              <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-white/60">Clash IQ is an Android app for Clash of Clans players and clans — bringing your game data together in one powerful command center — with war intelligence, player statistics, AI analysis and planning tools for clans that want more from their data.</p><div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/55"><Smartphone className="h-4 w-4 text-blue-300"/> Available for Android phones and tablets</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-8 pt-0"><div className="flex justify-center"><button onClick={()=>setFeaturesOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-6 py-3 font-black text-yellow-100 hover:bg-yellow-300/15"><Sparkles className="h-4 w-4"/> Explore all features</button></div></section>

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
          <div className="mt-10 grid gap-5 md:grid-cols-3">{SCREENSHOTS.map((src,i)=><button key={src} onClick={()=>setOpen(true)} className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#090d14] shadow-2xl"><img src={src} alt={`Clash IQ Android app screenshot ${i+1}`} className="w-full transition duration-500 group-hover:scale-[1.02]"/></button>)}</div>
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
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-blue-100"><Smartphone className="h-4 w-4"/> Android app</div>
            <h2 className="mt-4 text-3xl font-black sm:text-5xl">Download Clash IQ for Android</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/50">Download the latest Android beta and join the testing program. The beta is updated regularly.</p>
            <a href="https://github.com/patrikkjellberg2-crypto/Clash-IQ2-testing/releases/latest" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-8 py-4 font-black text-black hover:bg-yellow-200"><Download className="h-5 w-5"/> Download Android Beta</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 text-sm text-white/35 sm:flex-row sm:justify-between"><span>© 2026 Clash IQ</span><span>Clash of Clans analytics &amp; war intelligence</span></div></footer>

      {featuresOpen && <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/90 p-4 backdrop-blur-md" onClick={()=>setFeaturesOpen(false)}><div className="mx-auto flex min-h-full max-w-5xl items-center py-6"><div className="relative w-full rounded-[2rem] border border-white/10 bg-[#080c12] p-6 shadow-2xl sm:p-10" onClick={e=>e.stopPropagation()}><button onClick={()=>setFeaturesOpen(false)} aria-label="Close" className="absolute right-5 top-5 grid size-11 place-items-center rounded-full border border-white/10 bg-white/5"><X className="h-5 w-5"/></button><p className="text-xs font-black uppercase tracking-[.22em] text-yellow-300">Clash IQ features</p><h2 className="mt-3 pr-12 text-3xl font-black sm:text-5xl">Everything in one command center.</h2><p className="mt-4 max-w-3xl leading-7 text-white/50">Explore the tools built into Clash IQ for wars, player analysis, clan management and AI-powered intelligence.</p><div className="mt-10 grid gap-8 sm:grid-cols-2"><FeatureGroup title="War" items={["War Center — Live war information, attacks, stars and destruction.","War Planner — Assign targets, lock decisions and track execution.","War History — Review completed wars and performance over time.","Live War Data — Stay connected to current war information."]}/><FeatureGroup title="Intelligence" items={["AI Coach — Turn verified Clash data into practical tactical insights.","AI War Analysis — Analyze your clan and opponent before attacks.","Smart Targeting — Identify high-value targets and attack opportunities.","Player Intelligence — Study recent form, trends and performance."]}/><FeatureGroup title="Clan" items={["Clan Overview — Roster, Town Hall levels, roles and trophies.","Members — Explore your full clan roster and profiles.","Member Activity — Understand participation and activity patterns.","Player Profiles — Open detailed player information and progress."]}/><FeatureGroup title="Analytics" items={["Statistics — Track clan and player performance across wars.","Player Trends — Visualize stars, destruction and performance over time.","Performance History — Compare recent and historical results.","Capital Raids — Review Capital Raid seasons and clan performance."]}/></div><button onClick={()=>setFeaturesOpen(false)} className="mt-10 w-full rounded-2xl border border-white/10 bg-white/[.04] py-3 font-bold text-white/70">Close</button></div></div></div>}

      {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md" onClick={()=>setOpen(false)}>
        <button aria-label="Close screenshots" onClick={()=>setOpen(false)} className="absolute right-5 top-5 z-10 grid size-12 place-items-center rounded-full border border-white/15 bg-black/70 text-white"><X className="h-6 w-6"/></button>
        <div className="grid max-h-[92vh] max-w-[96vw] gap-4 overflow-auto sm:grid-cols-2" onClick={e=>e.stopPropagation()}>{SCREENSHOTS.map(src=><img key={src} src={src} alt="Clash IQ Android app screenshot enlarged" className="w-full rounded-2xl object-contain shadow-2xl"/>)}</div>
      </div>}
    </div>
  );
}
function FeatureGroup({title,items}:{title:string;items:string[]}){return <div><h3 className="mb-4 text-lg font-black text-yellow-200">{title}</h3><div className="space-y-3">{items.map(item=><div key={item} className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-6 text-white/60">{item}</div>)}</div></div>}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="rounded-2xl border border-white/10 bg-[#0a0e15] p-5 hover:border-yellow-300/20"><div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-3 text-yellow-300">{icon}</div><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{text}</p></div>}
function Step({n,t,d}:{n:string;t:string;d:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="text-xs font-black tracking-[.2em] text-yellow-300">{n}</div><h3 className="mt-2 font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-white/45">{d}</p></div>}
