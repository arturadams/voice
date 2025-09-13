import { RecordIcon, PlayIcon } from "../icons";

type RecorderControlsProps = {
  isRecording: boolean;
  isPaused: boolean;
  showRecorder: boolean;
  startRecording: () => void;
  resumeRecording: () => void;
  permission: "unknown" | "granted" | "denied";
};

export function RecorderControls({
  isRecording,
  isPaused,
  showRecorder,
  startRecording,
  resumeRecording,
  permission,
}: RecorderControlsProps) {
  let button;
  if (!isRecording) {
    button = (
      <button
        onClick={startRecording}
        className="inline-flex items-center gap-2 rounded-full bg-primary text-base p-8 text-2xl shadow-lg hover:opacity-95"
      >
        <RecordIcon />
      </button>
    );
  } else if (isPaused && !showRecorder) {
    button = (
      <button
        onClick={resumeRecording}
        className="inline-flex items-center gap-2 rounded-full bg-primary text-base p-8 text-2xl shadow-lg hover:opacity-95"
      >
        <PlayIcon />
      </button>
    );
  } else {
    button = (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-full bg-primary text-base p-8 text-2xl shadow-lg disabled:opacity-50"
      >
        <RecordIcon />
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center justify-center gap-2">{button}</div>
      {permission === "denied" && !isRecording && (
        <div className="text-center">
          <div className="mt-1 text-xs text-accent">Mic permission denied.</div>
        </div>
      )}
    </div>
  );
}
