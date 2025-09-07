import { Clip } from "../models/clip";
import { ClipStore } from "./types";

/**
 * A simple in-memory clip store used as a fallback when persistent
 * storage (e.g. IndexedDB) is unavailable.
 */
export class MemoryStorage implements ClipStore {
  private clips = new Map<string, Clip>();

  async save(clip: Clip): Promise<void> {
    this.clips.set(clip.id, clip);
  }

  async getAll(): Promise<Clip[]> {
    return Array.from(this.clips.values());
  }

  async remove(id: string): Promise<void> {
    this.clips.delete(id);
  }
}
