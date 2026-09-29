import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { useGetClashDashboard } from "@workspace/api-client-react";
import { Plus, Trash2, ExternalLink, Headphones, Youtube, Play, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [message, setMessage] = useState("");
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [youtubeConfigured, setYoutubeConfigured] = useState(false);
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState<string | null>(null);
  const [youtubeSaving, setYoutubeSaving] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState("");

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

  useEffect(() => {
    fetch("/api/clash/music/youtube/status")
      .then(r => r.ok ? r.json() : null)
      .then(body => {
        if (!body) return;
        setYoutubeConfigured(Boolean(body.configured));
        setYoutubeConnected(Boolean(body.connected));
        setYoutubePlaylistUrl(typeof body.playlistUrl === "string" ? body.playlistUrl : null);
      })
      .catch(() => undefined);

    const params = new URLSearchParams(window.location.search);
    const youtubeState = params.get("youtube");
    if (youtubeState === "connected") {
      setYoutubeConnected(true);
      setYoutubeMessage("YouTube-kontot är anslutet.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (youtubeState === "denied") {
      setYoutubeMessage("YouTube-anslutningen avbröts.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (youtubeState === "error") {
      setYoutubeMessage("YouTube-anslutningen misslyckades. Försök igen.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const canAdd = useMemo(() => Boolean(clanTag && url.trim()), [clanTag, url]);

  function youtubeVideoId(value: string) {
    try {
      const u = new URL(value);
      const host = u.hostname.toLowerCase();
      if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] ?? "";
      const id = u.searchParams.get("v");
      if (id) return id;
      const match = u.pathname.match(/^\\/(?:shorts|embed|live)\\/([^/?]+)/);
      return match?.[1] ?? "";
    } catch {}
    return "";
  }

  function youtubeEmbedUrl(value: string) {
    const id = youtubeVideoId(value);
    if (!id) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      autoplay: "1",
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
    });
    if (origin) params.set("origin", origin);
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
  }

  function openTrack(index: number) {
    setSelectedIndex(index);
    setPlayerOpen(true);
  }

  async function addTrack() {
    if (!canAdd || saving) return;
    setSaving(true);
    setMessage("");
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
      setMessage("Song added to the clan playlist.");
      await queryClient.invalidateQueries({ queryKey: ["clan-music", clanTag] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add song.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTrack(id: number) {
    const r = await fetch(`/api/clash/music/${id}?clanTag=${encodeURIComponent(clanTag)}`, { method: "DELETE" });
    if (r.ok) await queryClient.invalidateQueries({ queryKey: ["clan-music", clanTag] });
  }

  function connectYoutube() {
    window.location.href = "/api/clash/music/youtube/auth";
  }

  async function saveToYoutube() {
    if (!clanTag || !tracks.length || youtubeSaving) return;
    setYoutubeSaving(true);
    setYoutubeMessage("");
    try {
      const r = await fetch("/api/clash/music/youtube/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clanTag,
          playlistTitle: `${clanName} — Clan Playlist`,
        }),
      });
      const body = await r.json().catch(() => ({}));
      if (r.status === 401 && body.needsAuth) {
        connectYoutube();
        return;
      }
      if (!r.ok) {
        const detail = typeof body?.error === "string" ? body.error : "Kunde inte spara spellistan till YouTube.";
        throw new Error(detail);
      }
      setYoutubeConnected(true);
      setYoutubePlaylistUrl(typeof body.playlistUrl === "string" ? body.playlistUrl : null);
      setYoutubeMessage(`Synkat — ${body.added ?? 0} tillagda, ${body.removed ?? 0} borttagna och ${body.reordered ?? 0} flyttade.`);
    } catch (error) {
      setYoutubeMessage(error instanceof Error ? error.message : "Kunde inte spara spellistan till YouTube.");
    } finally {
      setYoutubeSaving(false);
    }
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
                <button type="button" disabled={!canAdd || saving} onClick={addTrack} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-black transition-all ${canAdd && !saving ? "bg-amber-300 hover:bg-amber-200 active:scale-[.98] shadow-[0_0_18px_rgba(252,211,77,.14)]" : "bg-amber-300/20 text-white/25 cursor-not-allowed"}`}>
                  <Plus className="size-4" /> {saving ? "Reading…" : "Add song"}
                </button>
              </div>
              <p className="mt-3 text-[11px] text-white/30">YouTube supplies the title automatically. Playback in Clash IQ does not require a Google/YouTube login.</p>
              {message && <p className="mt-2 text-[11px] font-bold text-amber-300">{message}</p>}
            </section>

            <section id="clan-playlist" className="rounded-2xl border border-white/[.07] bg-[#06111b]/90 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Headphones className="size-5 text-amber-300" />
                <div>
                  <h2 className="font-black">Clan playlist</h2>
                  <p className="text-xs text-white/30">{tracks.length} songs · shared with the clan</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <button type="button" disabled={!tracks.length} onClick={() => { setSelectedIndex(0); setPlayerOpen(true); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/60 hover:text-white disabled:opacity-30">Open playlist</button>
                  {youtubePlaylistUrl && (
                    <>
                      <a href={youtubePlaylistUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/60 hover:text-white">
                        <ExternalLink className="size-4" /> Öppna YouTube
                      </a>
                      <a href={youtubePlaylistUrl.replace("https://www.youtube.com/", "https://music.youtube.com/")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/60 hover:text-white">
                        <Headphones className="size-4" /> YouTube Music
                      </a>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={!tracks.length || youtubeSaving || !youtubeConfigured}
                    onClick={youtubeConnected ? saveToYoutube : connectYoutube}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Youtube className="size-4" />
                    {!youtubeConfigured ? "YouTube ej konfigurerat" : youtubeSaving ? "Sparar…" : youtubeConnected ? "Spara till YouTube" : "Anslut YouTube"}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <div key={track.id} role="button" tabIndex={0} onClick={() => openTrack(index)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") openTrack(index); }} className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3 transition hover:border-amber-300/20 hover:bg-white/[.04]">
                    <span className="w-6 text-center text-xs font-mono text-white/20">{index + 1}</span>
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-300"><Play className="size-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{track.title}</p>
                      <p className="truncate text-[10px] text-white/30">Added by {track.addedBy}</p>
                    </div>
                    <a href={track.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="grid size-9 place-items-center rounded-lg bg-white/[.03] text-white/40 hover:text-white" aria-label="Open on YouTube">
                      <ExternalLink className="size-4" />
                    </a>
                    <button type="button" onClick={e => { e.stopPropagation(); removeTrack(track.id); }} className="grid size-9 place-items-center rounded-lg bg-white/[.03] text-white/30 hover:text-red-300" aria-label={`Remove ${track.title}`}>
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

            {playerOpen && tracks.length > 0 && (
              <section className="rounded-2xl border border-amber-300/15 bg-[#050b12] p-5 shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <Play className="size-5 text-amber-300" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-300/70">Clan player</p>
                    <h2 className="truncate font-black">{tracks[selectedIndex]?.title}</h2>
                  </div>
                  <button type="button" onClick={() => setPlayerOpen(false)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/50 hover:text-white"><X className="size-4" /></button>
                </div>
                {youtubeEmbedUrl(tracks[selectedIndex]?.url ?? "") ? (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black aspect-video">
                    <iframe title={tracks[selectedIndex]?.title ?? "Clan player"} src={youtubeEmbedUrl(tracks[selectedIndex]?.url ?? "")} className="h-full w-full" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowFullScreen />
                  </div>
                ) : (
                  <a href={tracks[selectedIndex]?.url} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-xl border border-white/10 p-8 text-sm font-bold text-amber-300">Open this song on YouTube</a>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <a href={tracks[selectedIndex]?.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/60 hover:text-white">
                    <ExternalLink className="size-4" /> Open in YouTube
                  </a>
                  <button type="button" disabled={selectedIndex === 0} onClick={() => setSelectedIndex(i => Math.max(0, i - 1))} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/60 disabled:opacity-20"><ChevronLeft className="size-4" /> Previous</button>
                  <span className="text-[10px] text-white/25">{selectedIndex + 1} / {tracks.length}</span>
                  <button type="button" disabled={selectedIndex === tracks.length - 1} onClick={() => setSelectedIndex(i => Math.min(tracks.length - 1, i + 1))} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/60 disabled:opacity-20">Next <ChevronRight className="size-4" /></button>
                </div>
              </section>
            )}

            <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4 text-center">
              <p className="text-[11px] leading-5 text-white/35">
                Clash IQ är huvudspellistan. Uppspelning här kräver inte att du är inloggad på Google eller YouTube. Om YouTube blockerar en viss video i den inbäddade spelaren kan du öppna samma låt direkt i YouTube. Spara till YouTube är en valfri separat funktion som kräver ett Google/YouTube-konto.
              </p>
              {youtubeMessage && <p className="mt-2 text-[11px] font-bold text-amber-300">{youtubeMessage}</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
