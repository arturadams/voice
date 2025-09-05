import type { Clip, StorageService } from "./types";

const DB_NAME = "voice-notes-db";
const STORE = "clips";

export class IndexedDbStorage implements StorageService {
  private async openDb(): Promise<IDBDatabase> {
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

  async put(clip: Clip): Promise<void> {
    const db = await this.openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const st = tx.objectStore(STORE);
      const { objectUrl, ...persistable } = clip;
      const rq = st.put(persistable);
      rq.onsuccess = () => resolve();
      rq.onerror = () => reject(rq.error);
    });
  }

  async getAll(): Promise<Clip[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const st = tx.objectStore(STORE);
      const rq = st.getAll();
      rq.onsuccess = () => resolve(rq.result as Clip[]);
      rq.onerror = () => reject(rq.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const st = tx.objectStore(STORE);
      const rq = st.delete(id);
      rq.onsuccess = () => resolve();
      rq.onerror = () => reject(rq.error);
    });
  }
}

export default IndexedDbStorage;
