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

export function MainApp({
  api,
  onApiChange,
}: {
  api: ApiConfig;
  onApiChange: (api: ApiConfig) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showPostRecordingModal, setShowPostRecordingModal] = useState(false);
  const [tab, setTab] = useState<"pending" | "processed">("processed");
  const [showRecorder, setShowRecorder] = useState(false);
  const clipManager = useClips();

  const {
    isRecording,
    recordMs,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    permission,
    analyser,
    recorder,
  } = useRecorder(() => setShowPostRecordingModal(true));

  const isPaused = recorder?.state === "paused";

  function handleStartRecording() {
    startRecording();
    setShowRecorder(true);
  }

  function handleResumeRecording() {
    resumeRecording();
    setShowRecorder(true);
  }

  function handleCloseRecorder() {
    setShowRecorder(false);
  }

  function handleStopRecording() {
    stopRecording();
    setShowRecorder(false);
  }

  function handlePostRecordingSelect(option: "memo" | "task" | "appointment") {
    console.log("Selected option:", option);
    setShowPostRecordingModal(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base via-base to-base text-content">
      <Header onSettingsClick={() => setShowSettings(true)} tab={tab} onTabChange={setTab} />

      <main className="mx-auto max-w-5xl px-4 py-6 pb-48">
        {tab === "pending" && <ClipList statuses={["recording", "saved", "uploading", "error"]} />}
        {tab === "processed" && <ClipList statuses={["uploaded"]} />}
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

      {isRecording && showRecorder && (
        <RecordingScreen
          recordMs={recordMs}
          analyser={analyser}
          isPaused={isPaused}
          stopRecording={handleStopRecording}
          pauseRecording={pauseRecording}
          resumeRecording={resumeRecording}
          onClose={handleCloseRecorder}
        />
      )}

      <BottomBar
        isRecording={isRecording}
        isPaused={isPaused}
        showRecorder={showRecorder}
        startRecording={handleStartRecording}
        resumeRecording={handleResumeRecording}
        permission={permission}
      />
      <Footer />
    </div>
  );
}
