import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppSidebar } from "@/components/app-sidebar";
import { useGetClashDashboard } from "@workspace/api-client-react";
import { Music2, Plus, Play, Trash2, ExternalLink, Headphones } from "lucide-react";

type Dict = Record<string, unknown>;
const d = (v: unknown): Dict => (v && typeof v === "object" ? v as Dict : {});
const s = (v: unknown, fallback = "") => typeof v === "string" ? v : fallback;

type Track = { id: number; clanTag: string; title: string; url: string; addedBy: string; createdAt: string };

function openMusic(url: string) {
  const started = Date.now();
  window.location.href = /Android/i.test(navigator.userAgent)
    ? `intent://${new URL(url).host}${new URL(url).pathname}${new URL(url).search}#Intent;scheme=https;package=com.google.android.apps.youtube.music;end`
    : url;
  window.setTimeout(() => {
    if (Date.now() - started < 1800) window.location.href = url;
  }, 1200);
}

export default function ClanMusicPage() {
  const { data } = useGetClashDashboard();
  const dashboard = data as unknown as Dict | undefined;
  const clan = d(dashboard?.clan);
  const clanTag = s(dashboard?.clanTag);
  const clanName = s(clan.name, "ClashIQ Clan");
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
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
  const canAdd = useMemo(() => Boolean(clanTag && title.trim() && url.trim()), [clanTag, title, url]);

  async function addTrack() {
    if (!canAdd || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/clash/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clanTag, title, url, addedBy: addedBy.trim() || "Clan member" }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Could not add song");
      }
      setTitle(""); setUrl("");
      await queryClient.invalidateQueries({ queryKey: ["clan-music", clanTag] });
    } finally {
      setSaving(false);
    }
  }

  async function removeTrack(id: number) {
    const r = await fetch(`/api/clash/music/${id}?clanTag=${encodeURIComponent(clanTag)}`, { method: "DELETE" });
    if (r.ok) await queryClient.invalidateQueries({ queryKey: ["clan-music", clanTag] });
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
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                A shared music shelf for {clanName}. Add YouTube or YouTube Music links and every clan member can see the playlist.
              </p>
            </div>
          </header>

          <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-8">
            <section className="rounded-2xl border border-red-400/15 bg-gradient-to-br from-red-500/[.08] to-amber-500/[.03] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-red-400/10 text-red-300"><Music2 className="size-5" /></div>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-red-300/80">BHABE DHEMONS</p>
                  <h2 className="text-xl font-black">War Playlist</h2>
                </div>
                {tracks.length > 0 && (
                  <button type="button" onClick={() => openMusic(tracks[0].url)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-black hover:bg-white/90">
                    <Play className="size-4 fill-current" /> Play
                  </button>
                )}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_.7fr_auto]">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Song title" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none placeholder:text-white/25 focus:border-red-300/40" />
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste YouTube Music link" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none placeholder:text-white/25 focus:border-red-300/40" />
                <input value={addedBy} onChange={e => setAddedBy(e.target.value)} placeholder="Your name" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none placeholder:text-white/25 focus:border-red-300/40" />
                <button type="button" disabled={!canAdd || saving} onClick={addTrack} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-400 px-4 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-30">
                  <Plus className="size-4" /> {saving ? "Adding…" : "Add"}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/[.07] bg-[#06111b]/90 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Headphones className="size-5 text-amber-300" />
                <div>
                  <h2 className="font-black">Playlist</h2>
                  <p className="text-xs text-white/30">{tracks.length} tracks</p>
                </div>
              </div>
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <div key={track.id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3">
                    <span className="w-6 text-center text-xs font-mono text-white/20">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{track.title}</p>
                      <p className="truncate text-[10px] text-white/30">Added by {track.addedBy}</p>
                    </div>
                    <button type="button" onClick={() => openMusic(track.url)} className="grid size-9 place-items-center rounded-lg bg-white/[.05] text-white hover:bg-white/[.1]" aria-label={`Play ${track.title}`}>
                      <Play className="size-4 fill-current" />
                    </button>
                    <a href={track.url} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-lg bg-white/[.03] text-white/40 hover:text-white" aria-label="Open link">
                      <ExternalLink className="size-4" />
                    </a>
                    <button type="button" onClick={() => removeTrack(track.id)} className="grid size-9 place-items-center rounded-lg bg-white/[.03] text-white/30 hover:text-red-300" aria-label={`Remove ${track.title}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                {!tracks.length && !query.isLoading && (
                  <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
                    <Music2 className="mx-auto size-8 text-white/15" />
                    <p className="mt-3 text-sm font-bold text-white/50">No songs yet</p>
                    <p className="mt-1 text-xs text-white/25">Be the first clan member to add one.</p>
                  </div>
                )}
              </div>
            </section>

            <p className="text-center text-[10px] text-white/20">
              Clash IQ stores the playlist links. Playback and Google/YouTube Music login stay with each member's own YouTube Music app.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
