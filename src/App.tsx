import { useEffect, useRef, useState } from "react";
import { MicIcon, SettingsIcon } from "./icons";
import { Clip } from "./models/clip";
import type { ApiConfig } from "./services/types";
import { useStorage, useUploader } from "./context/services";
import { notesUrl } from "./utils/api";
import { RecorderControls } from "./components/RecorderControls";
import { ClipList } from "./components/ClipList";
import { SettingsModal } from "./components/SettingsModal";
import { ClipsProvider } from "./context/clips";

export default function App() {
  const storage = useStorage();
  const uploader = useUploader();
  const [api, setApi] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem("voiceNotes.api");
    return saved
      ? JSON.parse(saved)
      : { baseUrl: "https://api.example.com", uploadPath: "/notes", authToken: "" };
  });
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    localStorage.setItem("voiceNotes.api", JSON.stringify(api));
  }, [api]);

  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [clips, setClips] = useState<Clip[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      const all = await storage.getAll();
      all.sort((a, b) => b.createdAt - a.createdAt);
      setClips(all);
    })();
  }, []);
  useEffect(() => {
    const onO = () => setOnline(true);
    const onF = () => setOnline(false);
    window.addEventListener("online", onO);
    window.addEventListener("offline", onF);
    return () => {
      window.removeEventListener("online", onO);
      window.removeEventListener("offline", onF);
    };
  }, []);

  async function playClip(c: Clip) {
    let url = c.objectUrl;
    if (!url && !c.blob) {
      const all = await storage.getAll();
      const found = all.find((x) => x.id === c.id);
      if (found && (found as any).blob) {
        url = URL.createObjectURL((found as any).blob as Blob);
        c.objectUrl = url;
      }
    }
    if (!url && c.blob) {
      url = URL.createObjectURL(c.blob);
      c.objectUrl = url;
    }
    if (!url) return;
    if (!audioElRef.current) return;
    audioElRef.current.src = url;
    await audioElRef.current.play();
    setPlayingId(c.id);
  }
  function stopPlayback() {
    if (!audioElRef.current) return;
    audioElRef.current.pause();
    audioElRef.current.currentTime = 0;
    setPlayingId(null);
  }

  async function uploadClip(c: Clip) {
    try {
      if (!navigator.onLine) {
        updateClip(c.id, { status: "queued" });
        return;
      }
      let blob = c.blob;
      if (!blob) {
        const all = await storage.getAll();
        const found = all.find((x) => x.id === c.id);
        if (found && (found as any).blob) blob = (found as any).blob as Blob;
      }
      if (!blob) throw new Error("Audio blob not found");
      updateClip(c.id, { status: "processing" });
      const result = await uploader.upload({ ...c, blob }, api);
      updateClip(c.id, {
        status: "processing",
        serverId: result.serverId,
        title: result.title ?? c.title,
        tags: result.tags ?? c.tags,
        details: result.details ?? c.details,
        transcriptUrl: result.transcriptUrl ?? c.transcriptUrl,
      });

      const updated: Clip = { ...c, serverId: result.serverId, status: "processing" };
      startWatcher(updated);
    } catch (e: any) {
      console.error(e);
      updateClip(c.id, { status: "error" });
      alert(e.message || String(e));
    }
  }

  function updateClip(id: string, patch: Partial<Clip>) {
    setClips((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      const updated = next.find((c) => c.id === id);
      if (updated) storage.save(updated);
      return next;
    });
  }
  async function removeClip(id: string) {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip?.objectUrl) {
        try {
          URL.revokeObjectURL(clip.objectUrl);
        } catch {
        }
      }
      return prev.filter((c) => c.id !== id);
    });
    await storage.remove(id);
  }
  async function syncQueued() {
    for (const q of clips.filter(x => x.status === "queued")) {
      // eslint-disable-next-line no-await-in-loop
      await uploadClip(q);
    }
  }

  async function refreshMetadata() {
    try {
      if (!navigator.onLine) return;
      for (const c of clips.filter(x => x.serverId)) {
        const res = await fetch(
          notesUrl(api.baseUrl, api.uploadPath, { job: c.serverId! })
        );
        if (res.ok) {
          const data = await res.json();
          const serverId = data?.id || c.serverId;
          updateClip(c.id, {
            status: "processing",
            serverId,
            title: data?.title ?? c.title,
            tags: Array.isArray(data?.tags) ? data.tags : c.tags,
            details: data?.details ?? c.details,
            transcriptUrl: data?.transcriptUrl ?? c.transcriptUrl,
          });
          startWatcher({ ...c, serverId, status: "processing" });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  function addClip(clip: Clip) {
    setClips((prev) => [clip, ...prev]);
  }

  const clipContextValue = {
    clips,
    playingId,
    online,
    addClip,
    playClip,
    stopPlayback,
    uploadClip,
    removeClip,
    updateClip,
    syncQueued,
    refreshMetadata,
  };
  const pollingRef = useRef(new Map<string, { delay: number; handle: number | null }>());
  function stopWatcher(id: string) {
    const ent = pollingRef.current.get(id);
    if (ent?.handle) clearTimeout(ent.handle);
    pollingRef.current.delete(id);
  }

  async function fetchServerStatus(c: Clip): Promise<{ done: boolean; nextDelayMs: number }> {
    if (!c.serverId) return { done: false, nextDelayMs: 3000 };

    try {
      const res = await fetch(
        notesUrl(api.baseUrl, api.uploadPath + "/status", { job: c.serverId! }),
        { method: "POST" }
      );

      const retryHdr = res.headers.get("Retry-After");
      const retryAfterMs = retryHdr ? Math.max(1000, Number(retryHdr) * 1000) : 0;

      if (res.status === 404) {
        return { done: false, nextDelayMs: Math.max(retryAfterMs, 2000) };
      }

      if (!res.ok) {
        return { done: false, nextDelayMs: Math.max(retryAfterMs, 4000) };
      }

      const data = await res.json();

      updateClip(c.id, {
        title: data.title ?? c.title,
        tags: Array.isArray(data.tags) ? data.tags : c.tags,
        details: data.details ?? c.details,
        transcriptUrl: data.transcriptUrl ?? c.transcriptUrl,
      });

      if (res.status === 200 && data.status === "done") {
        updateClip(c.id, { status: "uploaded" });
        stopWatcher(c.id);
        return { done: true, nextDelayMs: 0 };
      }

      const bodyRetryMs =
        typeof data.retryAfter === "number" ? Math.max(1000, data.retryAfter * 1000) : 0;

      return { done: false, nextDelayMs: Math.max(retryAfterMs, bodyRetryMs, 2500) };
    } catch {
      return { done: false, nextDelayMs: 5000 };
    }
  }

  function startWatcher(c: Clip) {
    if (!c.serverId) return;
    stopWatcher(c.id);

    let delay = 1500;

    const tick = async () => {
      if (!navigator.onLine || document.hidden) {
        schedule(Math.max(delay, 3000));
        return;
      }

      const { done, nextDelayMs } = await fetchServerStatus(c);
      if (!done) {
        delay = nextDelayMs || Math.min(Math.floor(delay * 1.6), 60000);
        const jitter = Math.floor(Math.random() * 400);
        schedule(delay + jitter);
      }
    };

    function schedule(ms: number) {
      const handle = window.setTimeout(tick, ms);
      pollingRef.current.set(c.id, { delay: ms, handle });
    }

    schedule(delay);
  }

  useEffect(() => {
    clips.filter(x => x.status === "processing" && x.serverId).forEach(startWatcher);
  }, [clips]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow">
            <MicIcon size={18} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold leading-tight">Velvet Notes</h1>
            <p className="text-xs text-slate-500">Premium voice notes — record, tag, and sync</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:shadow-sm"
          >
            <SettingsIcon /> <span>Settings</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <ClipsProvider value={clipContextValue}>
          <RecorderControls />
          <ClipList />
          <audio ref={audioElRef} onEnded={() => setPlayingId(null)} className="hidden" />
        </ClipsProvider>
      </main>

      {showSettings && (
        <SettingsModal api={api} onApiChange={setApi} onClose={() => setShowSettings(false)} />
      )}

      <footer className="py-10 text-center text-xs text-slate-400">
        Built with ❤️ — works in modern browsers. For iOS Safari, ensure you serve over HTTPS and
        tap to start recording.
      </footer>
    </div>
  );
}
