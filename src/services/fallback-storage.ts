import { Clip } from "../models/clip";
import { ClipStore } from "./types";

/**
 * Wraps two {@link ClipStore} implementations. Writes are attempted against
 * both stores to keep them in sync, while reads prefer the primary store and
 * fall back to the secondary store if the primary fails or contains no data.
 * This allows graceful degradation on browsers with flaky persistent storage
 * (e.g. iOS Chrome IndexedDB).
 */
export class FallbackStorage implements ClipStore {
  constructor(private primary: ClipStore, private secondary: ClipStore) {}

  async save(clip: Clip): Promise<void> {
    let err: unknown;
    try {
      await this.primary.save(clip);
    } catch (e) {
      err = e;
    }
    try {
      await this.secondary.save(clip);
    } catch (e) {
      if (!err) err = e;
    }
    if (err && typeof err !== 'undefined') {
      throw err;
    }
  }

  async getAll(): Promise<Clip[]> {
    try {
      const primary = await this.primary.getAll();
      if (primary.length) return primary;
    } catch {
      // fall through to secondary
    }
    return await this.secondary.getAll();
  }

  async remove(id: string): Promise<void> {
    let err: unknown;
    try {
      await this.primary.remove(id);
    } catch (e) {
      err = e;
    }
    try {
      await this.secondary.remove(id);
    } catch (e) {
      if (!err) err = e;
    }
    if (err && typeof err !== 'undefined') {
      throw err;
    }
  }
}
