import { Footer } from "./components/Footer";
import { useState } from "react";
import { Header } from "./components/Header";
import { ClipList } from "./components/ClipList";
import { SettingsModal } from "./components/SettingsModal";
import { BottomBar } from "./components/BottomBar";
import { useRecorder } from "./hooks/useRecorder";
import { RecordingScreen } from "./components/RecordingScreen";
import { PostRecordingModal } from "./components/PostRecordingModal";
import { useClips } from "./context/clips";
import { ApiConfig } from "./services/types";

export function MainApp({ api, onApiChange }: { api: ApiConfig, onApiChange: (api: ApiConfig) => void }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showPostRecordingModal, setShowPostRecordingModal] = useState(false);
  const clipManager = useClips();

  const {
    isRecording,
    recordMs,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    permission,
    analyser,
    recorder,
  } = useRecorder(() => setShowPostRecordingModal(true));

  function handlePostRecordingSelect(option: "memo" | "task" | "appointment") {
    console.log("Selected option:", option);
    setShowPostRecordingModal(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base via-base to-base text-content">
      <Header onSettingsClick={() => setShowSettings(true)} />

      <main className="mx-auto max-w-5xl px-4 py-6 pb-48">
        <ClipList />
        <audio ref={clipManager.audioRef} className="hidden" />
      </main>

      {showSettings && (
        <SettingsModal api={api} onApiChange={onApiChange} onClose={() => setShowSettings(false)} />
      )}

      {showPostRecordingModal && (
        <PostRecordingModal
          onClose={() => setShowPostRecordingModal(false)}
          onSelect={handlePostRecordingSelect}
        />
      )}

      {isRecording && (
        <RecordingScreen
          recordMs={recordMs}
          analyser={analyser}
          isPaused={recorder?.state === "paused"}
          stopRecording={stopRecording}
          pauseRecording={pauseRecording}
          resumeRecording={resumeRecording}
          cancelRecording={cancelRecording}
        />
      )}

      <BottomBar
        isRecording={isRecording}
        startRecording={startRecording}
        permission={permission}
      />
      <Footer />
    </div>
  );
}
