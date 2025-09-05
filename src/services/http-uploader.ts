import type { ApiConfig, Clip, UploadService, UploadStatus } from "./types";

function joinUrl(base: string, path: string) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function notesUrl(base: string, uploadPath: string, qs?: Record<string, string>) {
  const p = ('/' + (uploadPath || '/notes').replace(/^\/+/, '')).replace(/\/+$/, '');
  const full = joinUrl(base, p);
  const u = new URL(full);
  Object.entries(qs || {}).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}

export class HttpUploader implements UploadService {
  async upload(clip: Clip, api: ApiConfig): Promise<string> {
    const blob = clip.blob;
    if (!blob) throw new Error("Audio blob not found");

    const fd = new FormData();
    const filename = `note-${clip.id}.${clip.mimeType.includes("mp4") ? "m4a" : "webm"}`;
    fd.append("file", blob, filename);
    fd.append("createdAt", String(clip.createdAt));
    if (clip.title) fd.append("title", clip.title);
    if (clip.tags?.length) fd.append("tags", JSON.stringify(clip.tags));

    const res = await fetch(notesUrl(api.baseUrl, api.uploadPath), { method: "POST", body: fd });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Upload failed: ${res.status} ${txt}`);
    }

    let data: any = {};
    try { data = await res.json(); } catch { }

    let serverId: string | undefined = data?.id;
    if (!serverId) {
      const loc = res.headers.get('Location') || res.headers.get('Content-Location');
      if (loc) {
        const u = new URL(loc, api.baseUrl || window.location.origin);
        serverId = u.searchParams.get('id') || u.searchParams.get('job') || undefined;
      }
    }
    if (!serverId) throw new Error('Server did not return an id');
    return serverId;
  }

  async status(serverId: string, api: ApiConfig): Promise<UploadStatus | null> {
    const res = await fetch(
      notesUrl(api.baseUrl, api.uploadPath + "/status", { job: serverId }),
      { method: 'POST' }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  }
}

export default HttpUploader;
