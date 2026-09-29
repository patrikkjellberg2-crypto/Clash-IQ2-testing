import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { ClashIQInlineBanner } from '@/components/clashiq-inline-banner';

const BANNER_SRC = '/clash-iq-war-banner.webp';

export function ClashIQPageBanner({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();

  // Overview owns its hero. Every other page gets the same banner.
  // Members and Capital Raids render the banner directly inside their main area.
  // Keep the wrapper neutral there so it cannot create a spacer or repaint the banner.
  if (location === '/' || location === '/members' || location === '/capital-raids' || location === '/village' || location === '/war-archive' || location === '/war-center') {
    return <>{children}</>;
  }

  if (location === '/war-center') {
    return (
      <div className="min-h-[100dvh] overflow-x-hidden bg-[#07090d] text-white">
        <ClashIQInlineBanner />
        {children}
      </div>
    );
  }

  return (
    <div className="clashiq-global-banner-page min-h-[100dvh] overflow-x-hidden bg-[#07090d] text-white">
      <button
        type="button"
        aria-label="Go back"
        title="Back"
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            setLocation('/');
          }
        }}
        className="fixed left-16 top-4 z-40 grid size-10 place-items-center rounded-xl border border-white/10 bg-[#07090d]/90 text-slate-300 shadow-xl backdrop-blur-xl transition hover:border-amber-400/30 hover:bg-white/[.08] hover:text-white active:scale-95 lg:left-[278px]"
      >
        <ArrowLeft className="size-4" />
      </button>
      <style>{`
        /* Members is the visual reference: compact banner, rounded frame, tight dark command-center flow. */
        .clashiq-global-banner-page main {
          margin-top: 0 !important;
          background-color: #07090d !important;
          background-image:
            linear-gradient(to bottom, rgba(7,9,13,0) 0, rgba(7,9,13,0) 270px, #07090d 270px),
            url(${BANNER_SRC});
          background-repeat: no-repeat;
          background-position: center 28px;
          background-size: min(1155px, calc(100% - 32px)) auto;
          color: #fff !important;
        }

        /* Keep the banner compact like Members instead of using a full-width hero. */
        .clashiq-global-banner-page main {
          padding-top: 294px !important;
        }

        .clashiq-global-banner-page main.lg\\:pl-\\[260px\\] {
          background-size: min(1155px, calc(100% - 32px)) auto;
        }

        .clashiq-global-banner-page > div {
          background: #07090d !important;
          background-image: none !important;
          color: #fff !important;
        }

        /* Match Members: dark header, thin divider, compact spacing below the banner. */
        .clashiq-global-banner-page main > header {
          border-color: rgba(255,255,255,.05) !important;
          background: rgba(7,9,13,.85) !important;
          backdrop-filter: blur(18px);
        }

        @media (max-width: 1023px) {
          .clashiq-global-banner-page main {
            padding-top: 242px !important;
            background-position: center 16px;
            background-size: calc(100% - 32px) auto;
          }
        }

        .clashiq-global-banner-page {
          --background: 222 35% 5%;
          --foreground: 0 0% 100%;
          --card: 216 30% 8%;
          --card-foreground: 0 0% 100%;
          --popover: 216 30% 8%;
          --popover-foreground: 0 0% 100%;
          --primary: 43 96% 56%;
          --primary-foreground: 222 35% 5%;
          --secondary: 215 25% 13%;
          --secondary-foreground: 0 0% 92%;
          --muted: 215 22% 14%;
          --muted-foreground: 215 14% 58%;
          --accent: 43 96% 56%;
          --accent-foreground: 222 35% 5%;
          --border: 215 20% 18%;
          --input: 215 20% 18%;
          --ring: 43 96% 56%;
          --sidebar-background: 216 31% 7%;
          --sidebar-foreground: 0 0% 95%;
          --sidebar-primary: 43 96% 56%;
          --sidebar-primary-foreground: 222 35% 5%;
          --sidebar-accent: 43 55% 15%;
          --sidebar-accent-foreground: 43 96% 72%;
          --sidebar-border: 215 20% 17%;
          --sidebar-ring: 43 96% 56%;
        }


        .clashiq-global-banner-page main [class~="bg-white"],
        .clashiq-global-banner-page main [class~="bg-slate-50"],
        .clashiq-global-banner-page main [class~="bg-gray-50"],
        .clashiq-global-banner-page main [class~="bg-zinc-50"] {
          background-color: #0b1119 !important;
        }

        .clashiq-global-banner-page main [class~="text-slate-900"],
        .clashiq-global-banner-page main [class~="text-gray-900"],
        .clashiq-global-banner-page main [class~="text-zinc-900"] {
          color: #fff !important;
        }

        .clashiq-global-banner-page main [class~="text-blue-400"],
        .clashiq-global-banner-page main [class~="text-blue-500"],
        .clashiq-global-banner-page main [class~="text-blue-600"],
        .clashiq-global-banner-page main [class~="text-indigo-400"],
        .clashiq-global-banner-page main [class~="text-indigo-500"] {
          color: #fbbf24 !important;
        }

        .clashiq-global-banner-page main [class~="border-blue-400"],
        .clashiq-global-banner-page main [class~="border-blue-500"],
        .clashiq-global-banner-page main [class~="border-indigo-400"],
        .clashiq-global-banner-page main [class~="border-indigo-500"] {
          border-color: rgba(251, 191, 36, .2) !important;
        }

        .clashiq-global-banner-page main [class~="text-red-300"],
        .clashiq-global-banner-page main [class~="text-red-400"],
        .clashiq-global-banner-page main [class~="text-red-500"],
        .clashiq-global-banner-page main [class~="text-emerald-300"],
        .clashiq-global-banner-page main [class~="text-emerald-400"],
        .clashiq-global-banner-page main [class~="text-purple-300"],
        .clashiq-global-banner-page main [class~="text-purple-400"],
        .clashiq-global-banner-page main [class~="text-blue-200"],
        .clashiq-global-banner-page main [class~="text-blue-300"] {
          color: #fbbf24 !important;
        }

        .clashiq-global-banner-page main [class~="border-red-400"],
        .clashiq-global-banner-page main [class~="border-red-300"],
        .clashiq-global-banner-page main [class~="border-emerald-400"],
        .clashiq-global-banner-page main [class~="border-purple-400"],
        .clashiq-global-banner-page main [class~="border-blue-400"] {
          border-color: rgba(251, 191, 36, .2) !important;
        }

        .clashiq-global-banner-page main [class~="bg-red-400"],
        .clashiq-global-banner-page main [class~="bg-emerald-400"],
        .clashiq-global-banner-page main [class~="bg-purple-400"],
        .clashiq-global-banner-page main [class~="bg-blue-400"] {
          background-color: rgba(245, 158, 11, .10) !important;
        }
      `}</style>

      {children}
    </div>
  );
}
