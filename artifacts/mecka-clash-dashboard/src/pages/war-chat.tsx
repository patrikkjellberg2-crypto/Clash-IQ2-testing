import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { clearWarChatMessages, getWarChatMessages, publishWarChatMessage, removeWarChatMessage, type WarChatMessage } from '@/lib/war-chat';
import { ArrowLeft, Copy, MessageSquareText, Trash2, Users, Swords, BrainCircuit, Trophy, Plus, X } from 'lucide-react';
import { useLocation } from 'wouter';

const sourceMeta: Record<WarChatMessage['source'], { label: string; icon: typeof Swords; className: string }> = {
  'war-planner': { label: 'War Planner', icon: Swords, className: 'text-amber-300' },
  'war-log': { label: 'War Log', icon: Trophy, className: 'text-emerald-300' },
  'ai-coach': { label: 'AI Coach', icon: BrainCircuit, className: 'text-blue-300' },
  manual: { label: 'Manual', icon: Users, className: 'text-white/60' },
};

export default function WarChatPage() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<WarChatMessage[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const refresh = () => setMessages(getWarChatMessages());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('clashiq-war-chat-changed', handler);
    return () => window.removeEventListener('clashiq-war-chat-changed', handler);
  }, []);

  const copy = async (message: WarChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopied(message.id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch { setCopied(null); }
  };

  const publishManualPost = () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) return;
    publishWarChatMessage({ source: 'manual', title: cleanTitle, body: cleanBody });
    setTitle('');
    setBody('');
    setComposerOpen(false);
    refresh();
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#07090d] text-white">
      <AppSidebar />
      <main className="min-w-0 lg:pl-0">

        <button
          type="button"
          aria-label="Go back"
          title="Back"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else setLocation('/');
          }}
          className="fixed left-[4.75rem] top-4 z-40 grid size-11 place-items-center rounded-xl border border-amber-400/40 bg-[#0b0d12]/95 text-amber-300 shadow-[0_0_18px_rgba(245,190,60,.18)] backdrop-blur-xl transition hover:border-amber-300/70 hover:bg-amber-400/10 hover:text-amber-200 active:scale-95 lg:left-[278px]"
        >
          <ArrowLeft className="size-4" />
        </button>

        <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-8 md:px-8">
          <section className="relative overflow-hidden rounded-3xl border border-[#f4c542]/20 bg-[#06111b] p-6 shadow-[0_20px_80px_rgba(0,0,0,.35)] md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(244,197,66,.14),transparent_35%),radial-gradient(circle_at_10%_90%,rgba(45,140,255,.10),transparent_35%)]" />
            <div className="relative">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl border border-amber-400/25 bg-amber-400/10"><MessageSquareText className="size-6 text-amber-300" /></div>
                  <div><p className="text-[9px] font-black uppercase tracking-[.24em] text-amber-300">ClashIQ Operations</p><h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">War Board</h1></div>
                </div>
                <button type="button" onClick={() => setComposerOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-black text-black shadow-[0_8px_28px_rgba(245,158,11,.18)] transition hover:brightness-110"><Plus className="size-4" />New Post</button>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">A clan notice board for War Planner, War Log and AI Coach. Posts are notices and ready-to-share instructions — not a live chat.</p>
            </div>
          </section>

          {composerOpen && (
            <section className="overflow-hidden rounded-3xl border border-amber-400/20 bg-[#06111b]">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300/70">Manual post</p><h2 className="mt-1 text-xl font-black">Publish to War Board</h2></div>
                <button type="button" onClick={() => setComposerOpen(false)} className="grid size-9 place-items-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white" aria-label="Close post composer"><X className="size-4" /></button>
              </div>
              <div className="space-y-4 p-5">
                <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Post title" className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
                <textarea value={body} onChange={event => setBody(event.target.value)} placeholder="Write the notice or war instruction here..." rows={6} className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={() => setComposerOpen(false)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white">Cancel</button>
                  <button type="button" onClick={publishManualPost} disabled={!title.trim() || !body.trim()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-black text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="size-4" />Publish Post</button>
                </div>
              </div>
            </section>
          )}

          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-white/30">Board posts</p><p className="mt-1 text-sm text-white/50">{messages.length} saved on this device</p></div>
            {messages.length > 0 && <button type="button" onClick={() => { clearWarChatMessages(); refresh(); }} className="inline-flex items-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[.04] px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-400/[.08]"><Trash2 className="size-3.5" />Clear board</button>}
          </div>

          {messages.length === 0 ? (
            <section className="grid place-items-center rounded-3xl border border-white/[.07] bg-[#06111b]/80 px-6 py-16 text-center">
              <MessageSquareText className="size-10 text-amber-300/20" />
              <h2 className="mt-4 text-lg font-black">No board posts yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/35">Publish a new notice here, or publish a war plan, result or AI strategy from War Planner, War Log or AI Coach.</p>
            </section>
          ) : (
            <section className="space-y-3">
              {messages.map(message => {
                const meta = sourceMeta[message.source] ?? sourceMeta.manual;
                const Icon = meta.icon;
                return (
                  <article key={message.id} className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#06111b]/90">
                    <header className="flex items-center gap-3 border-b border-white/[.06] px-4 py-3">
                      <Icon className={`size-4 ${meta.className}`} />
                      <div className="min-w-0 flex-1"><p className="text-xs font-black">{message.title}</p><p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/30">{meta.label} · {new Date(message.createdAt).toLocaleString()}</p></div>
                      <button type="button" onClick={() => void copy(message)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/70 hover:bg-white/[.08]"><Copy className="size-3.5" />{copied === message.id ? 'Copied' : 'Copy'}</button>
                      <button type="button" onClick={() => { removeWarChatMessage(message.id); refresh(); }} className="grid size-8 place-items-center rounded-lg text-white/30 hover:bg-red-400/[.08] hover:text-red-300" aria-label="Delete message"><Trash2 className="size-3.5" /></button>
                    </header>
                    <pre className="whitespace-pre-wrap p-4 text-sm leading-6 text-white/75">{message.body}</pre>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
