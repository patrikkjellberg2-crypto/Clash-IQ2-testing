import { useEffect, useMemo, useState } from "react";
import { ExternalLink, ListMusic, Music2, Play, Plus, Trash2, Youtube } from "lucide-react";
import { Link } from "wouter";
import { ClashIQPageShell } from "@/components/clashiq-page-shell";

type Track = {
  id: string;
  url: string;
  title: string;
};

const STORAGE_KEY = "clashiq.youtube.playlist.v1";

function extractVideoId(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").replace(/^music\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com") {
      const id = url.searchParams.get("v");
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;

      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts[0];
      if ((marker === "shorts" || marker === "embed" || marker === "live") && parts[1]) {
        return /^[A-Za-z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function loadPlaylist(): Track[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Track =>
            Boolean(
              item &&
                typeof item.id === "string" &&
                typeof item.url === "string" &&
                typeof item.title === "string",
            ),
        )
      : [];
  } catch {
    return [];
  }
}

export default function MusicPage() {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = loadPlaylist();
    setPlaylist(saved);
    setSelectedId(saved[0]?.id ?? null);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist));
    if (playlist.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!playlist.some((track) => track.id === selectedId)) {
      setSelectedId(playlist[0].id);
    }
  }, [playlist, selectedId]);

  const selected = useMemo(
    () => playlist.find((track) => track.id === selectedId) ?? null,
    [playlist, selectedId],
  );

  const addTrack = () => {
    const id = extractVideoId(input);
    if (!id) {
      setMessage("Klistra in en giltig YouTube- eller YouTube Music-länk.");
      return;
    }

    if (playlist.some((track) => track.id === id)) {
      setSelectedId(id);
      setMessage("Den låten finns redan i spellistan.");
      setInput("");
      return;
    }

    const next: Track = {
      id,
      url: input.trim(),
      title: `YouTube video · ${id}`,
    };
    setPlaylist((current) => [...current, next]);
    setSelectedId(id);
    setInput("");
    setMessage("Tillagd i Clash IQ-spellistan.");
  };

  const removeTrack = (id: string) => {
    setPlaylist((current) => current.filter((track) => track.id !== id));
  };

  const openMusic = () => {
    window.open("https://music.youtube.com/", "_blank", "noopener,noreferrer");
  };

  const embedUrl = selected
    ? `https://www.youtube.com/embed/${selected.id}?rel=0&modestbranding=1`
    : "";

  return (
    <ClashIQPageShell
      eyebrow="Entertainment"
      title="YouTube Music"
      description="Spela Clash-musik direkt i Clash IQ och behåll en egen lokal spellista på enheten."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117]/95 shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-400">
                <Youtube className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Player</p>
                <h2 className="font-black text-white">{selected?.title ?? "Ingen video vald"}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={openMusic}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ExternalLink className="size-3.5" />
              Öppna YouTube Music
            </button>
          </div>

          <div className="aspect-video bg-black">
            {selected ? (
              <iframe
                src={embedUrl}
                title={selected.title}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                <div>
                  <Music2 className="mx-auto size-10 text-slate-700" />
                  <p className="mt-3 text-sm font-bold text-slate-400">Lägg till en YouTube-länk för att starta.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#11151c]/95 p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
              <ListMusic className="size-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Playlist</p>
              <h2 className="font-black text-white">Clash IQ Music</h2>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addTrack();
              }}
              placeholder="YouTube / YouTube Music-länk"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-amber-300/40"
            />
            <button
              type="button"
              onClick={addTrack}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300 text-slate-950 transition hover:bg-amber-200"
              aria-label="Lägg till låt"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {message && <p className="mt-2 text-[11px] text-slate-500">{message}</p>}

          <div className="mt-4 space-y-2">
            {playlist.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center text-xs text-slate-600">
                Spellistan är tom.
              </div>
            ) : (
              playlist.map((track, index) => (
                <div
                  key={track.id}
                  className={[
                    "flex items-center gap-2 rounded-xl border p-2",
                    selectedId === track.id
                      ? "border-amber-300/20 bg-amber-300/[0.06]"
                      : "border-white/5 bg-white/[0.02]",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(track.id)}
                    className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-slate-400 hover:text-white"
                    aria-label={`Spela ${index + 1}`}
                  >
                    <Play className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedId(track.id)}
                    className="min-w-0 flex-1 truncate text-left text-xs font-bold text-slate-300 hover:text-white"
                  >
                    {index + 1}. {track.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTrack(track.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-red-400/10 hover:text-red-300"
                    aria-label="Ta bort"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-slate-600">
            YouTube-inloggningen stannar hos YouTube. Clash IQ lagrar inte dina Google-uppgifter.
            Spellistan i den här första versionen sparas lokalt i webbläsaren.
          </p>
        </section>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d1117]/90 p-4">
        <p className="text-xs text-slate-500">
          Nästa steg kan vara en delad klanplaylist som alla i klanen ser, utan att vi behöver lagra Google-inloggningar.
        </p>
        <Link href="/" className="shrink-0 text-xs font-bold text-amber-300 hover:text-amber-200">
          Till Overview
        </Link>
      </div>
    </ClashIQPageShell>
  );
}
