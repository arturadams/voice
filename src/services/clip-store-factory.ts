import { ClipStore } from "./types";
import { IndexedDbStorage } from "./indexed-db";
import { MemoryStorage } from "./memory-storage";
import { FallbackStorage } from "./fallback-storage";

/**
 * Create a {@link ClipStore} that attempts to use IndexedDB and falls back to
 * an in-memory store when IndexedDB is unavailable or throws.
 */
export function createClipStore(): ClipStore {
  const memory = new MemoryStorage();
  if (typeof indexedDB === "undefined") {
    return memory;
  }
  const idb = new IndexedDbStorage();
  return new FallbackStorage(idb, memory);
}
