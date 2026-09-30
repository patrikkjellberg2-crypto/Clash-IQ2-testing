import type { ReactNode } from "react";

export type CommandIntelligenceItem = { label: string; value: string; detail: string; };

export function CommandIntelligenceStrip({ eyebrow, title, description, items, children }: { eyebrow: string; title: string; description: string; items: CommandIntelligenceItem[]; children?: ReactNode; }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-amber-400/15 bg-[#0b1119]/85 shadow-[0_14px_45px_rgba(0,0,0,.16)]">
      <div className="flex flex-col gap-2 border-b border-white/[.06] px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.22em] text-amber-300/75">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-white">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        {children}
      </div>
      <div className="grid divide-y divide-white/[.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {items.slice(0, 4).map((item) => (
          <div key={item.label} className="min-w-0 p-4">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-600">{item.label}</p>
            <p className="mt-1 truncate text-xl font-black text-white">{item.value}</p>
            <p className="mt-1 truncate text-[11px] text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
