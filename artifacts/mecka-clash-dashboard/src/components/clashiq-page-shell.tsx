import { type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";

type ClashIQPageShellProps = {
  clanName?: string;
  clanTag?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onRefresh?: () => void;
};

export function ClashIQPageShell({
  clanName = "BHABE DHEMONS",
  clanTag = "#2Q0Q82C9R",
  title,
  subtitle,
  children,
  onRefresh,
}: ClashIQPageShellProps) {
  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white lg:flex">
      <AppSidebar clanName={clanName} clanTag={clanTag} />
      <main className="min-w-0 flex-1 !ml-0 !pl-0 w-full">
        <header className="border-b border-white/[0.06] bg-[#07090d]/90 px-5 py-4 text-white backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
            <div className="min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300 transition hover:text-amber-200"
              >
                <ArrowLeft className="size-3.5" />
                Overview
              </Link>
              <h1 className="mt-2 truncate font-display text-2xl font-black tracking-[-0.05em]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
              ) : null}
            </div>
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                aria-label="Refresh"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition hover:border-amber-400/20 hover:bg-white/[0.06] hover:text-white"
              >
                <RefreshCw className="size-4" />
              </button>
            ) : null}
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1200px] space-y-5 px-4 py-5 sm:px-5 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
