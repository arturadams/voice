import React, { useEffect, useMemo, useRef, useState } from "react";

// Inline Icon Pack (no deps)
const Icon = ({
  path,
  size = 20,
  className = "",
}: {
  path: string;
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);
const MicIcon = (p: any) => <Icon {...p} path="M12 1v11a3 3 0 0 1-6 0V5a3 3 0 0 1 6 0" />;
const StopIcon = (p: any) => <Icon {...p} path="M5 5h14v14H5z" />;
const PauseIcon = (p: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={p.size || 20}
    height={p.size || 20}
    className={p.className || ""}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="6" y1="4" x2="6" y2="20" />
    <line x1="18" y1="4" x2="18" y2="20" />
  </svg>
);
const PlayIcon = (p: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={p.size || 20}
    height={p.size || 20}
    className={p.className || ""}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const UploadIcon = (p: any) => <Icon {...p} path="M12 16V3m0 0l-4 4m4-4l4 4M5 21h14" />;
const TrashIcon = (p: any) => <Icon {...p} path="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />;
const SettingsIcon = (p: any) => (
  <Icon {...p} path="M12 1l2 3 3 1 1 3 3 2-3 2-1 3-3 1-2 3-2-3-3-1-1-3-3-2 3-2 1-3 3-1z" />
);
const SaveIcon = (p: any) => (
  <Icon {...p} path="M19 21H5a2 2 0 0 1-2-2V5h13l3 3v11a2 2 0 0 1-2 2z" />
);
const TagIcon = (p: any) => <Icon {...p} path="M20 12l-8 8-9-9 4-4 9 9z" />;

type ClipStatus = "idle" | "recording" | "saved" | "queued" | "processing" | "uploaded" | "error";

function toClipStatus(serverStatus: unknown): ClipStatus {
  return serverStatus === "done" ? "uploaded" : "processing";
}

type Clip = {
  id: string;
  createdAt: number;
  mimeType: string;
  size?: number;
  duration?: number;
  title?: string;
  tags?: string[];
  details?: string;
  serverId?: string;
  transcriptUrl?: string;
  status: ClipStatus;
  blob?: Blob;
  objectUrl?: string;
};

type ApiConfig = { baseUrl: string; uploadPath: string; authToken?: string };

const fmt = {
  pad(n: number) {
    return String(n).padStart(2, "0");
  },
  ms(ms: number) {
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return hh > 0 ? `${hh}:${fmt.pad(mm)}:${fmt.pad(ss)}` : `${mm}:${fmt.pad(ss)}`;
  },
  date(ts: number) {
    return new Date(ts).toLocaleString();
  },
};

const DB_NAME = "voice-notes-db";
const STORE = "clips";
async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(clip: Clip) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    const { objectUrl, ...persistable } = clip;
    const rq = st.put(persistable);
    rq.onsuccess = () => resolve();
    rq.onerror = () => reject(rq.error);
  });
}
async function idbGetAll(): Promise<Clip[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const st = tx.objectStore(STORE);
    const rq = st.getAll();
    rq.onsuccess = () => resolve(rq.result as Clip[]);
    rq.onerror = () => reject(rq.error);
  });
}
async function idbDelete(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    const rq = st.delete(id);
    rq.onsuccess = () => resolve();
    rq.onerror = () => reject(rq.error);
  });
}

export default function App() {
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

  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingClip, setRecordingClip] = useState<Clip | null>(null);
  const [recordMs, setRecordMs] = useState(0);
  const recordStartRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [clips, setClips] = useState<Clip[]>([]);
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const all = await idbGetAll();
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
  async function ensureMicPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission("granted");
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (e) {
      setPermission("denied");
      console.error(e);
      return false;
    }
  }

  async function startRecording() {
    const ok = await ensureMicPermission();
    if (!ok) return;
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    const mimeType = candidates.find((c) => MediaRecorder.isTypeSupported(c)) || "audio/webm";
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;
    drawWave();
    const newClip: Clip = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      mimeType,
      status: "recording",
      title: "Untitled note",
      tags: [],
    };
    setRecordingClip(newClip);
    mr.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };
    mr.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: mimeType });
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        ctx.close();
        audioCtxRef.current = null;
        analyserRef.current = null;
        const size = blob.size;
        const objectUrl = URL.createObjectURL(blob);
        const duration = await probeDurationFromBlob(blob);
        const saved: Clip = { ...newClip, blob, objectUrl, size, duration, status: "saved" };
        await idbPut(saved);
        setClips((prev) => [saved, ...prev]);
        setRecordingClip(null);
        setRecordMs(0);
      } catch (e) {
        console.error(e);
        setRecordingClip((c) => (c ? { ...c, status: "error" } : c));
      } finally {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
    mr.start(200);
    setRecorder(mr);
    recordStartRef.current = performance.now();
    tickTimer();
  }

  function drawWave() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#111827";
      ctx.beginPath();
      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };
    render();
  }

  function tickTimer() {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    const step = () => {
      if (!recordStartRef.current) return;
      setRecordMs(performance.now() - recordStartRef.current);
      timerRef.current = requestAnimationFrame(step);
    };
    timerRef.current = requestAnimationFrame(step);
  }
  function pauseRecording() {
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    }
  }
  function resumeRecording() {
    if (!recorder) return;
    if (recorder.state === "paused") {
      recorder.resume();
      tickTimer();
    }
  }
  function stopRecording() {
    if (!recorder) return;
    recorder.stream.getTracks().forEach((t) => t.stop());
    recorder.stop();
    setRecorder(null);
    recordStartRef.current = null;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  }
  async function cancelRecording() {
    if (!recorder) return;
    recorder.stream.getTracks().forEach((t) => t.stop());
    recorder.stop();
    setRecorder(null);
    setRecordingClip(null);
    recordStartRef.current = null;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  }

  function probeDurationFromBlob(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const a = new Audio();
      const tempUrl = URL.createObjectURL(blob);
      const onLoaded = () => {
        resolve(a.duration);
        a.removeEventListener("loadedmetadata", onLoaded);
        URL.revokeObjectURL(tempUrl);
      };
      a.addEventListener("loadedmetadata", onLoaded);
      a.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        reject(new Error("Failed to load audio for duration"));
      };
      a.src = tempUrl;
    });
  }

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  async function playClip(c: Clip) {
    let url = c.objectUrl;
    if (!url && !c.blob) {
      const all = await idbGetAll();
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
        const all = await idbGetAll();
        const found = all.find((x) => x.id === c.id);
        if (found && (found as any).blob) blob = (found as any).blob as Blob;
      }
      if (!blob) throw new Error("Audio blob not found");
      updateClip(c.id, { status: "processing" });
      const fd = new FormData();
      const filename = `note-${c.id}.${c.mimeType.includes("mp4") ? "m4a" : "webm"}`;
      fd.append("file", blob, filename);
      fd.append("createdAt", String(c.createdAt));
      if (c.title) fd.append("title", c.title);
      if (c.tags?.length) fd.append("tags", JSON.stringify(c.tags));
      const res = await fetch(
        notesUrl(api.baseUrl, api.uploadPath /*, api.authToken ? { token: api.authToken } : undefined */),
        { method: "POST", body: fd }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Upload failed: ${res.status} ${txt}`);
      }
      // Prefer JSON id; fallback to Location header if needed
      let data: any = {};
      try { data = await res.json(); } catch { }

      let serverId: string | undefined = data?.id;
      if (!serverId) {
        const loc = res.headers.get('Location') || res.headers.get('Content-Location');
        if (loc) {
          const u = new URL(loc, api.baseUrl || window.location.origin);
          serverId = u.searchParams.get('id') || u.searchParams.get('job') || undefined;
        }
      }
      if (!serverId) throw new Error('Server did not return an id');

      // 👉 Always consider the note "in flight" after POST.
      // Do NOT trust any 'done' the POST might return.
      updateClip(c.id, {
        status: "processing",
        serverId,
        title: data?.title ?? c.title,
        tags: Array.isArray(data?.tags) ? data.tags : c.tags,
        details: data?.details ?? c.details,
        transcriptUrl: data?.transcriptUrl ?? c.transcriptUrl,
      });

      // Start polling immediately
      const updated: Clip = { ...c, serverId, status: "processing" };
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
      if (updated) idbPut(updated);
      return next;
    });
  }
  async function removeClip(id: string) {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip?.objectUrl) {
        try {
          URL.revokeObjectURL(clip.objectUrl);
        } catch { }
      }
      return prev.filter((c) => c.id !== id);
    });
    await idbDelete(id);
  }
  async function syncQueued() {
    // try to upload any queued clips
    for (const q of clips.filter(x => x.status === "queued")) {
      // eslint-disable-next-line no-await-in-loop
      await uploadClip(q);
    }
  }

  // Optional: refresh metadata for already-uploaded clips
  async function refreshMetadata() {
    try {
      if (!navigator.onLine) return;
      // Example strategy: re-fetch details for uploaded clips from your API.
      // Adjust endpoints to match your backend.
      for (const c of clips.filter(x => x.serverId)) {
        const res = await fetch(
          notesUrl(api.baseUrl, api.uploadPath, { job: c.serverId! /* , ...(api.authToken ? { token: api.authToken } : {}) */ })
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
  function joinUrl(base: string, path: string) {
    const b = (base || "").replace(/\/+$/, "");
    const p = (path || "").replace(/^\/+/, "");
    return `${b}/${p}`;
  }

  // Build /notes and add query params
  function notesUrl(base: string, uploadPath: string, qs?: Record<string, string>) {
    const p = ('/' + (uploadPath || '/notes').replace(/^\/+/, '')).replace(/\/+$/, '');
    const full = joinUrl(base, p);
    const u = new URL(full);
    // // Bypass ngrok interstitial without custom headers
    // if (!u.searchParams.has('ngrok-skip-browser-warning')) {
    //   u.searchParams.set('ngrok-skip-browser-warning', 'true');
    // }
    Object.entries(qs || {}).forEach(([k, v]) => u.searchParams.set(k, String(v)));
    return u.toString();
  }

  const pollingRef = useRef(new Map<string, { delay: number; handle: number | null }>());
  function stopWatcher(id: string) {
    const ent = pollingRef.current.get(id);
    if (ent?.handle) clearTimeout(ent.handle);
    pollingRef.current.delete(id);
  }

  async function fetchServerStatus(c: Clip) {
    if (!c.serverId) return false;
    try {
      const res = await fetch(
        notesUrl(api.baseUrl, api.uploadPath + "/status", { job: c.serverId! /* , ...(api.authToken ? { token: api.authToken } : {}) */ }), { method: 'POST' }
      );
      if (res.status === 404) return false;
      if (!res.ok) return false;

      const data = await res.json();
      if (data.status === "done") {
        updateClip(c.id, {
          status: "uploaded",
          title: data.title ?? c.title,
          tags: Array.isArray(data.tags) ? data.tags : c.tags,
          details: data.details ?? c.details,
          transcriptUrl: data.transcriptUrl ?? c.transcriptUrl
        });
        stopWatcher(c.id);
        return true;
      }
    } catch { }
    return false;
  }

  function startWatcher(c: Clip) {
    if (!c.serverId) return;
    stopWatcher(c.id);

    let delay = 0; // first tick now
    const tick = async () => {
      if (!navigator.onLine || document.hidden) {
        schedule(Math.max(delay, 3000));
        return;
      }
      const done = await fetchServerStatus(c);
      if (!done) {
        delay = delay ? Math.min(Math.floor(delay * 1.6), 60000) : 3000;
        schedule(delay);
      }
    };
    function schedule(d: number) {
      const handle = window.setTimeout(tick, d);
      pollingRef.current.set(c.id, { delay: d, handle });
    }
    schedule(delay);
  }

  useEffect(() => {
    clips.filter(x => x.status === "processing" && x.serverId).forEach(startWatcher);
  }, [clips]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clips;
    return clips.filter((c) =>
      [c.title, c.details, ...(c.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search, clips]);
  const isRecording = recorder && ["recording", "paused"].includes(recorder.state);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow">
            <MicIcon size={18} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold leading-tight">Velvet Notes</h1>
            <p className="text-xs text-slate-500">Premium voice notes — record, tag, and sync</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:shadow-sm"
          >
            <SettingsIcon /> Settings
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold">New recording</h2>
                <p className="text-sm text-slate-500">
                  Tap to start. Works best over HTTPS and with a user gesture.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isRecording && (
                  <button
                    onClick={startRecording}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-5 py-3 text-sm shadow hover:opacity-95"
                  >
                    <MicIcon /> Start
                  </button>
                )}
                {isRecording && recorder?.state === "recording" && (
                  <>
                    <button
                      onClick={pauseRecording}
                      className="rounded-full border px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <PauseIcon /> Pause
                    </button>
                    <button
                      onClick={stopRecording}
                      className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <StopIcon /> Stop & Save
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="rounded-full border px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {isRecording && recorder?.state === "paused" && (
                  <>
                    <button
                      onClick={resumeRecording}
                      className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <PlayIcon /> Resume
                    </button>
                    <button
                      onClick={stopRecording}
                      className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <StopIcon /> Stop & Save
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="rounded-full border px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <canvas ref={canvasRef} className="w-full h-24" width={800} height={96} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono tabular-nums">{fmt.ms(recordMs)}</div>
                <div className="text-xs text-slate-500">current session</div>
                {permission === "denied" && (
                  <div className="mt-2 text-xs text-red-600">
                    Microphone permission denied. Enable it in your browser settings.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Library Toolbar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 pr-10 text-sm"
                placeholder="Search title, tags, details…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">/</span>
            </div>
          </div>

          {/* Online/Offline chip */}
          <span className={`rounded-xl px-3 py-2 text-xs border ${online ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
            {online ? "Online" : "Offline"}
          </span>

          {/* Sync queued */}
          <button
            onClick={syncQueued}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:shadow-sm"
            title="Upload any notes queued while offline"
          >
            Sync queued
          </button>

          {/* Refresh metadata */}
          <button
            onClick={refreshMetadata}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:shadow-sm"
            title="Pull latest tags/titles from server"
          >
            Refresh
          </button>

          {/* Batch upload (still manual) */}
          <button
            onClick={async () => {
              for (const c of filtered.filter((x) => x.status !== "uploaded")) {
                // eslint-disable-next-line no-await-in-loop
                await uploadClip(c);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:shadow-sm"
          >
            Upload all
          </button>
        </div>


        <section className="mt-4 grid grid-cols-1 gap-4">
          {filtered.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-8">No recordings yet.</div>
          )}
          {filtered.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8 flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
                      value={c.title || "Untitled note"}
                      onChange={(e) => updateClip(c.id, { title: e.target.value })}
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {fmt.date(c.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs text-slate-500">
                      {c.mimeType.replace("audio/", "").toUpperCase()} •{" "}
                      {c.duration ? `${c.duration.toFixed(1)}s` : "--"} •{" "}
                      {c.size ? `${(c.size / 1024).toFixed(0)} KB` : "--"}
                    </div>
                    {c.status === "uploaded" && (
                      <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                        Synced
                      </span>
                    )}
                    {c.status === "processing" && (
                      <span className="text-xs rounded-full bg-amber-50 text-amber-700 px-2 py-0.5">
                        Uploading…
                      </span>
                    )}
                    {c.status === "error" && (
                      <span className="text-xs rounded-full bg-rose-50 text-rose-700 px-2 py-0.5">
                        Error
                      </span>
                    )}
                  </div>
                  <div>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      placeholder="Details (will be enhanced by server on upload)…"
                      rows={c.details ? 3 : 2}
                      value={c.details || ""}
                      onChange={(e) => updateClip(c.id, { details: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <TagIcon /> Tags:
                    </div>
                    {(c.tags || []).map((t, idx) => (
                      <span
                        key={t + idx}
                        className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                      placeholder="Add tag and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) updateClip(c.id, { tags: [...(c.tags || []), val] });
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="sm:col-span-4 flex flex-col items-stretch justify-between gap-3">
                  <div className="flex items-center justify-end gap-2">
                    {playingId === c.id ? (
                      <button
                        onClick={stopPlayback}
                        className="rounded-full border px-3 py-2 text-sm flex items-center gap-2"
                      >
                        <StopIcon /> Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => playClip(c)}
                        className="rounded-full border px-3 py-2 text-sm flex items-center gap-2"
                      >
                        <PlayIcon /> Play
                      </button>
                    )}
                    <button
                      onClick={() => uploadClip(c)}
                      disabled={c.status === "processing"}
                      className="rounded-full bg-slate-900 text-white px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <UploadIcon /> Upload
                    </button>
                    <button
                      onClick={() => removeClip(c.id)}
                      className="rounded-full border px-3 py-2 text-sm flex items-center gap-2"
                    >
                      <TrashIcon /> Delete
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 overflow-hidden max-h-12">
                    {c.transcriptUrl ? (
                      <a
                        className="text-slate-700 underline"
                        href={c.transcriptUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Transcript
                      </a>
                    ) : (
                      <span className="text-slate-400">No transcript yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <audio ref={audioElRef} onEnded={() => setPlayingId(null)} className="hidden" />
      </main>

      {showSettings && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold">Connection</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-slate-500">Base URL</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="https://api.example.com"
                  value={api.baseUrl}
                  onChange={(e) => setApi((x) => ({ ...x, baseUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Upload Path</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="/notes"
                  value={api.uploadPath}
                  onChange={(e) => setApi((x) => ({ ...x, uploadPath: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Auth Token (optional)</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Bearer token"
                  value={api.authToken || ""}
                  onChange={(e) => setApi((x) => ({ ...x, authToken: e.target.value }))}
                />
              </div>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm"
                >
                  <SaveIcon /> Save
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(notesUrl(api.baseUrl, api.uploadPath /*, api.authToken ? { token: api.authToken } : undefined */));
                      alert(res.ok ? "Endpoint reachable (GET)." : "Failed: " + res.status);
                    } catch (e: any) {
                      alert(e.message || String(e));
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
                >
                  Test endpoint
                </button>
              </div>
              <div className="text-xs text-slate-500 pt-2">
                Your settings are saved locally (localStorage). Recordings are stored on-device
                using IndexedDB until you upload them.
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-center text-xs text-slate-400">
        Built with ❤️ — works in modern browsers. For iOS Safari, ensure you serve over HTTPS and
        tap to start recording.
      </footer>
    </div>
  );
}
