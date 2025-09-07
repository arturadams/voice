import { Clip } from "../models/clip";
import { ClipStore } from "./types";

/**
 * Wraps two {@link ClipStore} implementations and falls back to the secondary
 * store when the primary one fails. This allows graceful degradation on
 * browsers with flaky persistent storage (e.g. iOS Chrome IndexedDB).
 */
export class FallbackStorage implements ClipStore {
  constructor(private primary: ClipStore, private secondary: ClipStore) {}

  async save(clip: Clip): Promise<void> {
    try {
      await this.primary.save(clip);
    } catch {
      await this.secondary.save(clip);
    }
  }

  async getAll(): Promise<Clip[]> {
    try {
      return await this.primary.getAll();
    } catch {
      return await this.secondary.getAll();
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.primary.remove(id);
    } catch {
      await this.secondary.remove(id);
    }
  }
}
