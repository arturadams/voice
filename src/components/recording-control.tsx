import type { ClipWriter } from "../services/types";
import type { Clip } from "../models/clip";

export function RecordingControl({ storage }: { storage: ClipWriter }) {
  async function saveDummy() {
    const clip: Clip = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      mimeType: "text/plain",
      status: "saved",
      title: "Dummy clip",
      blob: new Blob(["dummy"], { type: "text/plain" }),
    };
    await storage.save(clip);
  }

  return (
    <button onClick={saveDummy} className="rounded-full border px-3 py-2 text-sm">
      Save dummy clip
    </button>
  );
}
