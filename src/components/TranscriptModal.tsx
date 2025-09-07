import { Clip } from "../models/clip";

interface Props {
  clip: Clip;
  onClose(): void;
}

export function TranscriptModal({ clip, onClose }: Props) {
  const text = clip.transcriptText || "";
  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clip.title || "transcript"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold">Transcript</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            ✕
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-slate-800">
          {text}
        </div>
        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(text)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            Copy
          </button>
          <button
            onClick={download}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
