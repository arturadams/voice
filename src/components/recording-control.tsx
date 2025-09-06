import { useRef, useState } from "react";
import type { ClipWriter } from "../services/types";
import type { Clip } from "../models/clip";

export function RecordingControl({ storage }: { storage: ClipWriter }) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType });
      const clip: Clip = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        mimeType: blob.type,
        status: "saved",
        blob,
      };
      await storage.save(clip);
      stream.getTracks().forEach((t) => t.stop());
    };
    rec.start();
    setRecorder(rec);
  }

  function stop() {
    recorder?.stop();
    setRecorder(null);
  }

  const isRecording = recorder?.state === "recording";

  return (
    <button
      onClick={isRecording ? stop : start}
      className="rounded-full border px-3 py-2 text-sm"
    >
      {isRecording ? "Stop" : "Record"}
    </button>
  );
}
