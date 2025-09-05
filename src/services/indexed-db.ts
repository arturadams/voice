import { Clip } from "../models/clip";
import { assertNonEmpty } from "./assert";
import { StorageService } from "./types";

const DB_NAME = "voice-notes-db";
const STORE = "clips";

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class IndexedDbStorage implements StorageService {
  /**
   * @inheritdoc
   */
  async save(clip: Clip): Promise<void> {
    assertNonEmpty(clip.id, "clip.id");
    const db = await openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const st = tx.objectStore(STORE);
      const { objectUrl, ...persistable } = clip;
      const rq = st.put(persistable);
      rq.onsuccess = () => resolve();
      rq.onerror = () => reject(rq.error);
    });
  }

  /**
   * @inheritdoc
   */
  async getAll(): Promise<Clip[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const st = tx.objectStore(STORE);
      const rq = st.getAll();
      rq.onsuccess = () => resolve(rq.result as Clip[]);
      rq.onerror = () => reject(rq.error);
    });
  }

  /**
   * @inheritdoc
   */
  async remove(id: string): Promise<void> {
    assertNonEmpty(id, "id");
    const db = await openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const st = tx.objectStore(STORE);
      const rq = st.delete(id);
      rq.onsuccess = () => resolve();
      rq.onerror = () => reject(rq.error);
    });
  }
}
