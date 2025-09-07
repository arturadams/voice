import { useRef, useState } from "react";
import { MicIcon, StopIcon, PauseIcon, PlayIcon } from "../icons";
import { Clip } from "../models/clip";
import { useStorage } from "../context/services";
import { useClips } from "../context/clips";
import { fmt } from "../utils/fmt";

export function RecorderControls() {
  const storage = useStorage();
  const { addClip } = useClips();
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingClip, setRecordingClip] = useState<Clip | null>(null);
  const [recordMs, setRecordMs] = useState(0);
  const recordStartRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

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
        await storage.save(saved);
        addClip(saved);
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
      const styles = getComputedStyle(document.documentElement);
      const baseColor = styles.getPropertyValue("--color-base").trim();
      const primaryColor = styles.getPropertyValue("--color-primary").trim();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = primaryColor;
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

  const isRecording = recorder && ["recording", "paused"].includes(recorder.state);

  return (
    <section className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-content">New recording</h2>
            <p className="text-sm text-muted">
              Tap to start. Works best over HTTPS and with a user gesture.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isRecording && (
              <button
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-base px-5 py-3 text-sm shadow hover:opacity-95"
              >
                <MicIcon /> Start
              </button>
            )}
            {isRecording && recorder?.state === "recording" && (
              <>
                <button
                  onClick={pauseRecording}
                  className="rounded-full border border-subtle px-4 py-2 text-sm flex items-center gap-2"
                >
                  <PauseIcon /> Pause
                </button>
                <button
                  onClick={stopRecording}
                  className="rounded-full bg-secondary text-base px-4 py-2 text-sm flex items-center gap-2"
                >
                  <StopIcon /> Stop & Save
                </button>
                <button
                  onClick={cancelRecording}
                  className="rounded-full border border-subtle px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </>
            )}
            {isRecording && recorder?.state === "paused" && (
              <>
                <button
                  onClick={resumeRecording}
                  className="rounded-full bg-primary text-base px-4 py-2 text-sm flex items-center gap-2"
                >
                  <PlayIcon /> Resume
                </button>
                <button
                  onClick={stopRecording}
                  className="rounded-full bg-secondary text-base px-4 py-2 text-sm flex items-center gap-2"
                >
                  <StopIcon /> Stop & Save
                </button>
                <button
                  onClick={cancelRecording}
                  className="rounded-full border border-subtle px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <div className="rounded-xl border border-subtle bg-base overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-24 bg-base" width={800} height={96} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono tabular-nums">{fmt.ms(recordMs)}</div>
            <div className="text-xs text-muted">current session</div>
            {permission === "denied" && (
              <div className="mt-2 text-xs text-accent">
                Microphone permission denied. Enable it in your browser settings.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
