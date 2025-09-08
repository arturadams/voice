import { useMemo, useState } from "react";
import { PlayIcon, StopIcon, UploadIcon, TrashIcon, TagIcon } from "../icons";
import { fmt } from "../utils/fmt";
import { useClips } from "../context/clips";

export function ClipList({ statuses }: { statuses: Clip["status"][] }) {
  const {
    clips,
    playingId,
    online,
    playClip,
    stopPlayback,
    uploadClip,
    removeClip,
    updateClip,
    syncQueued,
  } = useClips();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filteredByStatus = clips.filter((c) => statuses.includes(c.status));
    if (!q) return filteredByStatus;
    return filteredByStatus.filter((c) =>
      [c.title, c.details, ...(c.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search, clips, statuses]);

  return (
    <>
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <input
              className="w-full rounded-xl border border-subtle bg-surface px-4 py-2 pr-10 text-sm"
              placeholder="Search title, tags, details…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">/</span>
          </div>
        </div>
        <span
          className={`rounded-xl px-3 py-2 text-xs border ${online ? "bg-success/10 text-success border-success" : "bg-warning/10 text-warning border-warning"}`}
        >
          {online ? "Online" : "Offline"}
        </span>
        <button
          onClick={syncQueued}
          className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface px-3 py-2 text-sm hover:shadow-sm"
          title="Upload any notes queued while offline"
        >
          Sync queued
        </button>
        <button
          onClick={async () => {
            for (const c of filtered.filter((x) => x.status !== "uploaded")) {
              // eslint-disable-next-line no-await-in-loop
              await uploadClip(c);
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface px-3 py-2 text-sm hover:shadow-sm"
        >
          Upload all
        </button>
      </div>

      <section className="mt-4 grid grid-cols-1 gap-4">
        {filtered.length === 0 && (
          <div className="text-center text-muted text-sm py-8">No recordings yet.</div>
        )}
        {filtered.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden"
          >
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8 flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-subtle bg-surface px-3 py-2 text-sm font-medium"
                    value={c.title || "Untitled note"}
                    onChange={(e) => updateClip(c.id, { title: e.target.value })}
                  />
                  <span className="text-xs text-muted whitespace-nowrap">
                    {fmt.date(c.createdAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xs text-muted">
                    {c.mimeType.replace("audio/", "").toUpperCase()} • {c.duration ? `${c.duration.toFixed(1)}s` : "--"} • {c.size ? `${(c.size / 1024).toFixed(0)} KB` : "--"}
                  </div>
                  {c.status === "uploaded" && (
                    <span className="text-xs rounded-full bg-success/10 text-success px-2 py-0.5">
                      Synced
                    </span>
                  )}
                  {c.status === "processing" && (
                    <span className="text-xs rounded-full bg-secondary/10 text-secondary px-2 py-0.5">
                      Uploading…
                    </span>
                  )}
                  {c.status === "error" && (
                    <span className="text-xs rounded-full bg-accent/10 text-accent px-2 py-0.5">
                      Error
                    </span>
                  )}
                </div>
                <div>
                  <textarea
                    className="w-full rounded-lg border border-subtle bg-surface px-3 py-2 text-sm"
                    placeholder="Details (will be enhanced by server on upload)…"
                    rows={c.details ? 3 : 2}
                    value={c.details || ""}
                    onChange={(e) => updateClip(c.id, { details: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <TagIcon /> Tags:
                  </div>
                  {(c.tags || []).map((t, idx) => (
                    <span
                      key={t + idx}
                      className="rounded-full bg-subtle text-content px-2 py-0.5 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                  <input
                    className="rounded-lg border border-subtle bg-surface px-2 py-1 text-xs"
                    placeholder="Add tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) updateClip(c.id, { tags: [...(c.tags || []), val] });
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>

              <div className="sm:col-span-4 flex flex-col items-stretch justify-between gap-3">
                <div className="flex items-center justify-end gap-2">
                  {playingId === c.id ? (
                    <button
                      onClick={stopPlayback}
                      className="rounded-full border px-3 py-2 text-sm flex items-center gap-2"
                    >
                      <StopIcon /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => playClip(c)}
                      className="rounded-full border px-3 py-2 text-sm flex items-center gap-2"
                    >
                      <PlayIcon /> Play
                    </button>
                  )}
                  {c.status !== "uploaded" && (
                    <button
                      onClick={() => uploadClip(c)}
                      disabled={c.status === "processing"}
                      className="rounded-full bg-primary text-base px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <UploadIcon /> Upload
                    </button>
                  )}
                  <button
                    onClick={() => removeClip(c.id)}
                    className="rounded-full border px-3 py-2 text-sm flex items-center gap-2"
                  >
                    <TrashIcon /> Delete
                  </button>
                </div>
                <div className="text-xs text-muted overflow-hidden max-h-12">
                  {c.transcriptUrl ? (
                    <a
                      className="text-content underline"
                      href={c.transcriptUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Transcript
                    </a>
                  ) : (
                    <span className="text-muted">No transcript yet.</span>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
