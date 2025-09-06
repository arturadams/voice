import { Clip } from "../models/clip";
import { assertNonEmpty } from "./assert";
import { ApiConfig, UploadResult, UploadService } from "./types";

function joinUrl(base: string, path: string): string {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function notesUrl(base: string, uploadPath: string): string {
  const p = ("/" + (uploadPath || "/notes").replace(/^\/+/, "")).replace(/\/+$/, "");
  const full = joinUrl(base, p);
  const u = new URL(full);
  return u.toString();
}

export class HttpUploader implements UploadService {
  /**
   * @inheritdoc
   */
  async upload(clip: Clip, api: ApiConfig): Promise<UploadResult> {
    assertNonEmpty(clip.id, "clip.id");
    assertNonEmpty(api.baseUrl, "api.baseUrl");
    assertNonEmpty(api.uploadPath, "api.uploadPath");
    const blob = clip.blob;
    if (!blob) throw new Error("Audio blob not found");

    const fd = new FormData();
    const filename = `note-${clip.id}.${clip.mimeType.includes("mp4") ? "m4a" : "webm"}`;
    fd.append("file", blob, filename);
    fd.append("createdAt", String(clip.createdAt));
    if (clip.title) fd.append("title", clip.title);
    if (clip.tags?.length) fd.append("tags", JSON.stringify(clip.tags));

    const res = await fetch(notesUrl(api.baseUrl, api.uploadPath), {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Upload failed: ${res.status} ${txt}`);
    }

    let data: any = {};
    try { data = await res.json(); } catch {}

    let serverId: string | undefined = data?.id;
    if (!serverId) {
      const loc = res.headers.get("Location") || res.headers.get("Content-Location");
      if (loc) {
        const u = new URL(loc, api.baseUrl || window.location.origin);
        serverId = u.searchParams.get("id") || u.searchParams.get("job") || undefined;
      }
    }
    if (!serverId) throw new Error("Server did not return an id");

    return {
      serverId,
      title: data?.title,
      tags: Array.isArray(data?.tags) ? data.tags : undefined,
      details: data?.details,
      transcriptUrl: data?.transcriptUrl,
    };
  }
}
