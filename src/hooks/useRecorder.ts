import { useRef, useState } from "react";
import { Clip } from "../models/clip";
import { useStorage } from "../context/services";
import { useClips } from "../context/clips";
import { WavRecorder } from "../services/wav-recorder";

export function useRecorder(onRecordingComplete: () => void) {
  const storage = useStorage();
  const { addClip } = useClips();
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [recorder, setRecorder] = useState<MediaRecorder | WavRecorder | null>(null);
  const [recordingClip, setRecordingClip] = useState<Clip | null>(null);
  const [recordMs, setRecordMs] = useState(0);
  const recordStartRef = useRef<number | null>(null);
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
    setRecorder(mr);
    recordStartRef.current = performance.now();
    tickTimer();
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
  async function stopRecording() {
    if (!recorder) return;
    console.log("Stopping recording...");
    recorder.stop();
    console.log("Recording stopped.");
    const blob = new Blob(chunksRef.current, { type: recordingClip?.mimeType });
    console.log("Blob created:", blob);
    const audioCtx = audioCtxRef.current;
    if (audioCtx) {
      audioCtx.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    const size = blob.size;
    const objectUrl = URL.createObjectURL(blob);
    console.log("Object URL created:", objectUrl);
    const duration = await probeDurationFromBlob(blob);
    console.log("Duration probed:", duration);
    const saved: Clip = { ...recordingClip!, blob, objectUrl, size, duration, status: "saved" };
    addClip(saved);
    setRecordingClip(null);
    setRecordMs(0);
    try {
      await storage.save(saved);
      console.log("Clip saved to storage.");
      onRecordingComplete();
    } catch (err) {
      console.error(err);
    }
    setRecorder(null);
    recordStartRef.current = null;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setRecordMs(0);
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
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

  const isRecording = recorder && ["recording", "paused"].includes(recorder.state);

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
    recorder,
  };
}
