import { Footer } from "./components/Footer";
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import type { ApiConfig } from "./services/types";
import { useStorage, useUploader } from "./context/services";
import { ClipList } from "./components/ClipList";
import { SettingsModal } from "./components/SettingsModal";
import { ClipsProvider, useClips } from "./context/clips";
import { useClipManager } from "./services/clip-manager";
import { BottomBar } from "./components/BottomBar";
import { ResetPassword } from "./components/ResetPassword";

function OfflineBanner() {
  const { online } = useClips();
  if (online) return null;
  return (
    <div className="bg-warning/10 text-warning border-b border-warning text-center py-2">
      Working offline
    </div>
  );
}

export default function App() {
  const storage = useStorage();
  const uploader = useUploader();
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
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

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    if (params.get("type") === "recovery") {
      const access = params.get("access_token");
      if (access) {
        setRecoveryToken(access);
      }
    }
  }, []);

  const clipManager = useClipManager(api, storage, uploader);

  if (recoveryToken) {
    return <ResetPassword accessToken={recoveryToken} onComplete={() => setRecoveryToken(null)} />;
  }

  return (
    <ClipsProvider value={clipManager}>
      <div className="min-h-screen bg-gradient-to-b from-base via-base to-base text-content">
        <Header onSettingsClick={() => setShowSettings(true)} />
        <OfflineBanner />
        <main className="mx-auto max-w-5xl px-4 py-6 pb-32">
          <ClipList />
          <audio ref={clipManager.audioRef} className="hidden" />
        </main>

        {showSettings && (
          <SettingsModal api={api} onApiChange={setApi} onClose={() => setShowSettings(false)} />
        )}

        <BottomBar />
        <Footer />
      </div>
    </ClipsProvider>
  );
}

