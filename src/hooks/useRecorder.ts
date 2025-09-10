import { useRef, useState } from "react";
import { Clip } from "../models/clip";
import { useStorage } from "../context/services";
import { useClips } from "../context/clips";
import { WavRecorder } from "../services/wav-recorder";

export function useRecorder(onRecordingComplete: () => void) {
  const storage = useStorage();
  const { addClip } = useClips();
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const recorderRef = useRef<MediaRecorder | WavRecorder | null>(null);
  const [recorderState, setRecorderState] = useState<"inactive" | "recording" | "paused">(
    "inactive"
  );
  const [recordingClip, setRecordingClip] = useState<Clip | null>(null);
  const [recordMs, setRecordMs] = useState(0);
  const recordStartRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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
    streamRef.current = stream;
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
    chunksRef.current = [];
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;
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
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    mr.start(200);
    recorderRef.current = mr;
    setRecorderState("recording");
    recordStartRef.current = performance.now();
    elapsedRef.current = 0;
    tickTimer();
  }

  function tickTimer() {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    const step = () => {
      if (recordStartRef.current === null) return;
      setRecordMs(elapsedRef.current + (performance.now() - recordStartRef.current));
      timerRef.current = requestAnimationFrame(step);
    };
    timerRef.current = requestAnimationFrame(step);
  }

  async function pauseRecording() {
    const r = recorderRef.current;
    if (!r || recorderState !== "recording") return;
    recorderRef.current = null;
    const stream = streamRef.current;
    streamRef.current = null;
    await new Promise<void>((resolve) => {
      if ("onstop" in r) (r as any).onstop = () => resolve();
      r.stop();
      if (!("onstop" in r)) resolve();
    });
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx) {
      audioCtx.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    if (recordStartRef.current !== null) {
      elapsedRef.current += performance.now() - recordStartRef.current;
      recordStartRef.current = null;
    }
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setRecordMs(elapsedRef.current);
    setRecorderState("paused");
  }
  async function resumeRecording() {
    if (recorderState !== "paused") return;
    const ok = await ensureMicPermission();
    if (!ok) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    let mimeType = recordingClip?.mimeType || "audio/wav";
    let mr: MediaRecorder | WavRecorder;
    if (mimeType === "audio/wav" || typeof MediaRecorder === "undefined") {
      mr = new WavRecorder(stream);
      mimeType = "audio/wav";
    } else {
      mr = new MediaRecorder(stream, { mimeType });
    }
    mr.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    mr.start(200);
    recorderRef.current = mr;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;
    recordStartRef.current = performance.now();
    tickTimer();
    setRecorderState("recording");
  }
  async function stopRecording() {
    const r = recorderRef.current;
    recorderRef.current = null;
    const stream = streamRef.current;
    streamRef.current = null;
    if (r && (r as any).state !== "inactive") {
      await new Promise<void>((resolve) => {
        if ("onstop" in r) (r as any).onstop = () => resolve();
        r.stop();
        if (!("onstop" in r)) resolve();
      });
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx) {
      audioCtx.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    const blob = new Blob(chunksRef.current, { type: recordingClip?.mimeType });
    const size = blob.size;
    const objectUrl = URL.createObjectURL(blob);
    const duration = await probeDurationFromBlob(blob);
    const saved: Clip = { ...recordingClip!, blob, objectUrl, size, duration, status: "saved" };
    addClip(saved);
    setRecordingClip(null);
    setRecordMs(0);
    try {
      await storage.save(saved);
      onRecordingComplete();
    } catch (err) {
      console.error(err);
    }
    setRecorderState("inactive");
    recordStartRef.current = null;
    elapsedRef.current = 0;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setRecordMs(0);
  }
  async function cancelRecording() {
    const r = recorderRef.current;
    if (!r) return;
    if ("cancel" in r) (r as any).cancel();
    else r.stop();
    recorderRef.current = null;
    setRecorderState("inactive");
    setRecordingClip(null);
    recordStartRef.current = null;
    elapsedRef.current = 0;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setRecordMs(0);
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
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

  const isRecording = recorderState === "recording" || recorderState === "paused";
  const isPaused = recorderState === "paused";

  return {
    isRecording,
    recordMs,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    permission,
    analyser: analyserRef.current,
    isPaused,
  };
}
