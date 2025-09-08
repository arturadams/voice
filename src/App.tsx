import { Footer } from "./components/Footer";
import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Clip } from "./models/clip";
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
    <div className="min-h-screen bg-gradient-to-b from-base via-base to-base text-content">
      <Header onSettingsClick={() => setShowSettings(true)} />

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

      <Footer />
    </div>
  );
}

