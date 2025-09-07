import { SaveIcon } from "../icons";
import type { ApiConfig } from "../services/types";
import { notesUrl } from "../utils/api";
import { useTheme, type Theme } from "../context/theme";

interface SettingsModalProps {
  api: ApiConfig;
  onApiChange: React.Dispatch<React.SetStateAction<ApiConfig>>;
  onClose(): void;
}

export function SettingsModal({ api, onApiChange, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-base/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-base shadow-xl border border-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-muted flex items-center justify-between">
          <h3 className="font-semibold">Settings</h3>
          <button onClick={onClose} className="text-muted hover:text-content">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted">Theme</label>
            <select
              className="w-full rounded-xl border border-muted bg-base px-3 py-2 text-sm"
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
            >
              <option value="standard">Standard</option>
              <option value="dark">Dark</option>
              <option value="neon">Neon</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted">Base URL</label>
            <input
              className="w-full rounded-xl border border-muted bg-base px-3 py-2 text-sm"
              placeholder="https://api.example.com"
              value={api.baseUrl}
              onChange={(e) => onApiChange((x) => ({ ...x, baseUrl: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted">Upload Path</label>
            <input
              className="w-full rounded-xl border border-muted bg-base px-3 py-2 text-sm"
              placeholder="/notes"
              value={api.uploadPath}
              onChange={(e) => onApiChange((x) => ({ ...x, uploadPath: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted">Auth Token (optional)</label>
            <input
              className="w-full rounded-xl border border-muted bg-base px-3 py-2 text-sm"
              placeholder="Bearer token"
              value={api.authToken || ""}
              onChange={(e) => onApiChange((x) => ({ ...x, authToken: e.target.value }))}
            />
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-base px-4 py-2 text-sm"
            >
              <SaveIcon /> Save
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
              className="inline-flex items-center gap-2 rounded-xl border border-muted bg-base px-4 py-2 text-sm"
            >
              Test endpoint
            </button>
          </div>
          <div className="text-xs text-muted pt-2">
            Your settings are saved locally (localStorage). Recordings are stored on-device using IndexedDB until you upload them.
          </div>
        </div>
      </div>
    </div>
  );
}
