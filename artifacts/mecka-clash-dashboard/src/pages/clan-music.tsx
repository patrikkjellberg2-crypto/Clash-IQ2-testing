import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { useGetClashDashboard } from "@workspace/api-client-react";
import { Plus, Trash2, ExternalLink, Headphones, Download, Youtube } from "lucide-react";

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => (v && typeof v === "object" ? v as Dict : {});
const s = (v: unknown, fallback = "") => typeof v === "string" ? v : fallback;

type Track = { id: number; clanTag: string; title: string; url: string; addedBy: string; createdAt: string };

export default function ClanMusicPage() {
  const { data } = useGetClashDashboard();
  const dashboard = data as unknown as Dict | undefined;
  const clan = d(dashboard?.clan);
  const clanTag = s(dashboard?.clanTag, s(clan.tag));
  const clanName = s(clan.name, "ClashIQ Clan");
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: ["clan-music", clanTag],
    enabled: Boolean(clanTag),
    queryFn: async (): Promise<Track[]> => {
      const r = await fetch(`/api/clash/music?clanTag=${encodeURIComponent(clanTag)}`);
      if (!r.ok) throw new Error("Could not load playlist");
      const body = await r.json();
      return Array.isArray(body?.tracks) ? body.tracks : [];
    },
  });

  const tracks = query.data ?? [];

  const canAdd = useMemo(() => Boolean(clanTag && url.trim()), [clanTag, url]);

  async function addTrack() {
    if (!canAdd || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/clash/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clanTag, url, addedBy: addedBy.trim() || "Clan member" }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Could not add song");
      }
      setUrl("");
      await queryClient.invalidateQueries({ queryKey: ["clan-music", clanTag] });
    } finally {
      setSaving(false);
    }
  }

  async function removeTrack(id: number) {
    const r = await fetch(`/api/clash/music/${id}?clanTag=${encodeURIComponent(clanTag)}`, { method: "DELETE" });
    if (r.ok) await queryClient.invalidateQueries({ queryKey: ["clan-music", clanTag] });
  }

  async function downloadPlaylist() {
    if (!clanTag) return;
    const r = await fetch(`/api/clash/music/export?clanTag=${encodeURIComponent(clanTag)}`);
    if (!r.ok) return;
    const blob = await r.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "clash-iq-clan-playlist.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="min-h-screen bg-[#02070d] text-white">
      <div className="flex min-h-screen">
        <AppSidebar clanName={clanName} clanTag={clanTag} />
        <main className="min-w-0 flex-1">
          <header className="border-b border-white/[.06] bg-[#030a12] px-4 py-5 md:px-8">
            <div className="mx-auto max-w-[1100px]">
              <p className="text-[9px] font-black uppercase tracking-[.22em] text-red-300">Clan / Music</p>
              <h1 className="mt-1 font-display text-3xl font-black tracking-[-.05em]">Clan Music</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">A shared playlist for the clan. Anyone can add YouTube or YouTube Music songs, and everyone sees the same list.</p>
            </div>
          </header>

          <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-8">
            <section className="rounded-2xl border border-red-400/15 bg-gradient-to-br from-red-500/[.08] to-amber-500/[.03] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-red-400/10 text-red-300"><Youtube className="size-5" /></div>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-red-300/80">{clanName}</p>
                  <h2 className="text-xl font-black">Add music</h2>
                </div>

              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_.55fr_auto]">
                <div className="relative">
                  <Youtube className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-red-300" />
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste YouTube / YouTube Music song link" className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm outline-none placeholder:text-white/25 focus:border-red-300/40" />
                </div>
                <input value={addedBy} onChange={e => setAddedBy(e.target.value)} placeholder="Your name (optional)" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none placeholder:text-white/25 focus:border-red-300/40" />
                <button type="button" disabled={!canAdd || saving} onClick={addTrack} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-400 px-4 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-30">
                  <Plus className="size-4" /> {saving ? "Reading…" : "Add song"}
                </button>
              </div>
              <p className="mt-3 text-[11px] text-white/30">YouTube supplies the title automatically. The song is then added to the clan's shared list.</p>
            </section>

            <section id="clan-playlist" className="rounded-2xl border border-white/[.07] bg-[#06111b]/90 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Headphones className="size-5 text-amber-300" />
                <div>
                  <h2 className="font-black">Clan playlist</h2>
                  <p className="text-xs text-white/30">{tracks.length} songs · shared with the clan</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <a href="#clan-playlist" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/60">Open playlist</a>
                  <button type="button" onClick={downloadPlaylist} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/60 hover:text-white"><Download className="size-4" /> Download</button>
                </div>
              </div>
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <div key={track.id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                    <span className="w-6 text-center text-xs font-mono text-white/20">{index + 1}</span>
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-300"><Youtube className="size-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{track.title}</p>
                      <p className="truncate text-[10px] text-white/30">Added by {track.addedBy}</p>
                    </div>
                    <a href={track.url} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-lg bg-white/[.03] text-white/40 hover:text-white" aria-label="Open on YouTube">
                      <ExternalLink className="size-4" />
                    </a>
                    <button type="button" onClick={() => removeTrack(track.id)} className="grid size-9 place-items-center rounded-lg bg-white/[.03] text-white/30 hover:text-red-300" aria-label={`Remove ${track.title}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                {!tracks.length && !query.isLoading && (
                  <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
                    <Youtube className="mx-auto size-8 text-red-300/30" />
                    <p className="mt-3 text-sm font-bold text-white/50">No songs yet</p>
                    <p className="mt-1 text-xs text-white/25">Paste a YouTube link above to add the first song.</p>
                  </div>
                )}
              </div>
            </section>

            <p className="text-center text-[10px] text-white/20">
              Clash IQ stores the shared song list. Download exports the song titles and YouTube links; playback stays in each member's YouTube app.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
