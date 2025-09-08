import { useRef, useState } from "react";
import { MicIcon, StopIcon, PauseIcon, PlayIcon } from "../icons";
import { Clip } from "../models/clip";
import { useStorage } from "../context/services";
import { useClips } from "../context/clips";
import { fmt } from "../utils/fmt";
import { WavRecorder } from "../services/wav-recorder";

export function RecorderControls() {
  const storage = useStorage();
  const { addClip } = useClips();
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [recorder, setRecorder] = useState<MediaRecorder | WavRecorder | null>(null);
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
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    let mimeType = "audio/wav";
    let mr: MediaRecorder | WavRecorder;
    if (typeof MediaRecorder !== "undefined") {
      const supported = candidates.find((c) => MediaRecorder.isTypeSupported(c));
      if (supported) {
        mimeType = supported;
        mr = new MediaRecorder(stream, { mimeType });
      } else {
        mr = new WavRecorder(stream);
      }
    } else {
      mr = new WavRecorder(stream);
    }
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
        addClip(saved);
        setRecordingClip(null);
        setRecordMs(0);
        try {
          await storage.save(saved);
        } catch (err) {
          console.error(err);
        }
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
    recorder.stop();
    setRecorder(null);
    recordStartRef.current = null;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setRecordMs(0);
  }
  async function cancelRecording() {
    if (!recorder) return;
    if ("cancel" in recorder) (recorder as any).cancel();
    else recorder.stop();
    setRecorder(null);
    setRecordingClip(null);
    recordStartRef.current = null;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setRecordMs(0);
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
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex-1 w-full sm:min-w-0">
        <div className="rounded-xl border border-subtle bg-base overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-12 sm:h-16 bg-base" width={800} height={64} />
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        {!isRecording && (
          <button
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-base p-3 text-sm shadow hover:opacity-95"
          >
            <MicIcon />
          </button>
        )}
        {isRecording && recorder?.state === "recording" && (
          <>
            <button
              onClick={pauseRecording}
              className="rounded-full border border-subtle p-2 text-sm flex items-center gap-2"
            >
              <PauseIcon />
            </button>
            <button
              onClick={stopRecording}
              className="rounded-full bg-secondary text-base p-3 text-sm flex items-center gap-2"
            >
              <StopIcon />
            </button>
            <button
              onClick={cancelRecording}
              className="rounded-full border border-subtle p-2 text-sm"
            >
              Cancel
            </button>
          </>
        )}
        {isRecording && recorder?.state === "paused" && (
          <>
            <button
              onClick={resumeRecording}
              className="rounded-full bg-primary text-base p-2 text-sm flex items-center gap-2"
            >
              <PlayIcon />
            </button>
            <button
              onClick={stopRecording}
              className="rounded-full bg-secondary text-base p-3 text-sm flex items-center gap-2"
            >
              <StopIcon />
            </button>
            <button
              onClick={cancelRecording}
              className="rounded-full border border-subtle p-2 text-sm"
            >
              Cancel
            </button>
          </>
        )}
      </div>
      <div className="text-center">
        <div className="text-lg font-mono tabular-nums">{fmt.ms(recordMs)}</div>
        {permission === "denied" && (
          <div className="mt-1 text-xs text-accent">
            Mic permission denied.
          </div>
        )}
      </div>
    </div>
  );
}
