import { Clip } from "../models/clip";
import { ClipStore } from "./types";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(url: string): Promise<Blob> {
  return fetch(url).then((r) => r.blob());
}

/**
 * Persists clips to localStorage using base64 encoding for blob data.
 */
export class LocalStorageStorage implements ClipStore {
  private readonly prefix = "voiceNotes.clip.";

  async save(clip: Clip): Promise<void> {
    const { objectUrl, blob, ...rest } = clip as any;
    const data: any = { ...rest };
    if (blob) {
      data.blob = await blobToDataUrl(blob);
    }
    localStorage.setItem(this.prefix + clip.id, JSON.stringify(data));
  }

  async getAll(): Promise<Clip[]> {
    const clips: Clip[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(this.prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const { blob: dataUrl, ...rest } = parsed;
        let blob: Blob | undefined;
        if (dataUrl) {
          blob = await dataUrlToBlob(dataUrl);
        }
        clips.push({ ...rest, blob });
      } catch {
        // ignore malformed entries
      }
    }
    return clips;
  }

  async remove(id: string): Promise<void> {
    localStorage.removeItem(this.prefix + id);
  }
}
