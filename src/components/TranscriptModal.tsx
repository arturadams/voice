import type { Clip } from "../models/clip";

interface TranscriptModalProps {
  clip: Clip;
  onClose(): void;
}

export function TranscriptModal({ clip, onClose }: TranscriptModalProps) {
  const text = clip.transcriptText || "";
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200 max-h-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold">Transcript</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            ✕
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <pre className="whitespace-pre-wrap text-sm">{text}</pre>
        </div>
        <div className="p-4 border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(text)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            Copy
          </button>
          <button
            onClick={() => {
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${clip.title || "transcript"}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
