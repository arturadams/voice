import { SaveIcon } from "../icons";
import type { ApiConfig } from "../services/types";
import { notesUrl } from "../utils/api";

interface SettingsModalProps {
  api: ApiConfig;
  onApiChange: React.Dispatch<React.SetStateAction<ApiConfig>>;
  onClose(): void;
}

export function SettingsModal({ api, onApiChange, onClose }: SettingsModalProps) {
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
          <h3 className="font-semibold">Connection</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-slate-500">Base URL</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="https://api.example.com"
              value={api.baseUrl}
              onChange={(e) => onApiChange((x) => ({ ...x, baseUrl: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Upload Path</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="/notes"
              value={api.uploadPath}
              onChange={(e) => onApiChange((x) => ({ ...x, uploadPath: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Auth Token (optional)</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Bearer token"
              value={api.authToken || ""}
              onChange={(e) => onApiChange((x) => ({ ...x, authToken: e.target.value }))}
            />
          </div>
          <div className="pt-2 flex items-center space-x-2">
            <button
              onClick={onClose}
              className="inline-flex items-center space-x-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm"
            >
              <SaveIcon /> <span>Save</span>
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(notesUrl(api.baseUrl, api.uploadPath));
                  alert(res.ok ? "Endpoint reachable (GET)." : "Failed: " + res.status);
                } catch (e: any) {
                  alert(e.message || String(e));
                }
              }}
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <span>Test endpoint</span>
            </button>
          </div>
          <div className="text-xs text-slate-500 pt-2">
            Your settings are saved locally (localStorage). Recordings are stored on-device using IndexedDB until you upload them.
          </div>
        </div>
      </div>
    </div>
  );
}
