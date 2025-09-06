/// <reference path="../node-test.d.ts" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IndexedDbStorage } from './indexed-db';
import { HttpUploader } from './http-uploader';
import { Clip } from '../models/clip';
import { ApiConfig, ClipReader, ClipWriter, UploadResult, UploadService } from './types';

function setupIndexedDb() {
  const store = new Map<string, any>();
  (globalThis as any).indexedDB = {
    open: () => {
      const request: any = {};
      setTimeout(() => {
        const db = {
          objectStoreNames: { contains: () => false },
          createObjectStore: () => ({ createIndex: () => {} }),
          transaction: () => ({
            objectStore: () => ({
              put: (value: any) => {
                store.set(value.id, value);
                const r: any = {};
                setTimeout(() => r.onsuccess && r.onsuccess(), 0);
                return r;
              },
              getAll: () => {
                const r: any = {};
                setTimeout(() => { r.result = Array.from(store.values()); r.onsuccess && r.onsuccess(); }, 0);
                return r;
              },
              delete: (id: string) => {
                store.delete(id);
                const r: any = {};
                setTimeout(() => r.onsuccess && r.onsuccess(), 0);
                return r;
              }
            })
          })
        };
        request.result = db;
        request.onupgradeneeded && request.onupgradeneeded();
        request.onsuccess && request.onsuccess();
      }, 0);
      return request;
    }
  };
}
setupIndexedDb();

class MockStorage implements ClipReader, ClipWriter {
  private store = new Map<string, Clip>();
  async save(clip: Clip): Promise<void> { this.store.set(clip.id, clip); }
  async getAll(): Promise<Clip[]> { return Array.from(this.store.values()); }
  async remove(id: string): Promise<void> { this.store.delete(id); }
}

class MockUploader implements UploadService {
  async upload(clip: Clip, _api: ApiConfig): Promise<UploadResult> {
    return { serverId: `mock-${clip.id}` };
  }
}

const clip: Clip = {
  id: '123',
  createdAt: Date.now(),
  mimeType: 'audio/webm',
  status: 'idle',
  blob: new Blob(['test'], { type: 'text/plain' })
};

async function exerciseStorage(reader: ClipReader, writer: ClipWriter) {
  await writer.save(clip);
  const all = await reader.getAll();
  assert.equal(all.length, 1);
  assert.equal(all[0].id, clip.id);
  await writer.remove(clip.id);
  const after = await reader.getAll();
  assert.equal(after.length, 0);
}

test('Clip storage allows swapping implementations', async () => {
  const real = new IndexedDbStorage();
  await exerciseStorage(real, real);
  const mock = new MockStorage();
  await exerciseStorage(mock, mock);
});

async function exerciseUploader(service: UploadService) {
  const api: ApiConfig = { baseUrl: 'https://example.com', uploadPath: '/notes' };
  const result = await service.upload(clip, api);
  assert.ok(result.serverId);
}

test('UploadService allows swapping implementations', async () => {
  const real = new HttpUploader();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ id: 'abc' }), { status: 200 }) as any;
  await exerciseUploader(real);
  globalThis.fetch = originalFetch;

  await exerciseUploader(new MockUploader());
});
