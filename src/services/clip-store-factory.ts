import { ClipStore } from "./types";
import { IndexedDbStorage } from "./indexed-db";
import { MemoryStorage } from "./memory-storage";
import { FallbackStorage } from "./fallback-storage";
import { LocalStorageStorage } from "./local-storage";

/**
 * Create a {@link ClipStore} that attempts to use IndexedDB and falls back to
 * an in-memory store when IndexedDB is unavailable or throws.
 */
export function createClipStore(): ClipStore {
  const memory = new MemoryStorage();
  let store: ClipStore = memory;

  if (typeof localStorage !== "undefined") {
    const local = new LocalStorageStorage();
    store = new FallbackStorage(local, store);
  }

  if (typeof indexedDB !== "undefined") {
    const idb = new IndexedDbStorage();
    store = new FallbackStorage(idb, store);
  }

  return store;
}
