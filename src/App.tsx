import { useEffect, useState } from "react";
import { MicIcon, SettingsIcon } from "./icons";
import type { ApiConfig } from "./services/types";
import { useStorage, useUploader } from "./context/services";
import { RecorderControls } from "./components/RecorderControls";
import { ClipList } from "./components/ClipList";
import { SettingsModal } from "./components/SettingsModal";
import { ClipsProvider } from "./context/clips";
import { useClipManager } from "./services/clip-manager";

export default function App() {
  const storage = useStorage();
  const uploader = useUploader();
  const [api, setApi] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem("voiceNotes.api");
    return saved
      ? JSON.parse(saved)
      : { baseUrl: "https://api.example.com", uploadPath: "/notes", authToken: "" };
  });
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    localStorage.setItem("voiceNotes.api", JSON.stringify(api));
  }, [api]);

  const clipManager = useClipManager(api, storage, uploader);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow">
            <MicIcon size={18} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold leading-tight">Velvet Notes</h1>
            <p className="text-xs text-slate-500">Premium voice notes — record, tag, and sync</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:shadow-sm"
          >
            <SettingsIcon /> Settings
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <ClipsProvider value={clipManager}>
          <RecorderControls />
          <ClipList />
          <audio ref={clipManager.audioRef} className="hidden" />
        </ClipsProvider>
      </main>

      {showSettings && (
        <SettingsModal api={api} onApiChange={setApi} onClose={() => setShowSettings(false)} />
      )}

      <footer className="py-10 text-center text-xs text-slate-400">
        Built with ❤️ — works in modern browsers. For iOS Safari, ensure you serve over HTTPS and
        tap to start recording.
      </footer>
    </div>
  );
}

