import { RecordIcon } from "../icons";

type RecorderControlsProps = {
  isRecording: boolean;
  startRecording: () => void;
  permission: "unknown" | "granted" | "denied";
};

export function RecorderControls({
  isRecording,
  startRecording,
  permission,
}: RecorderControlsProps) {

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-base p-8 text-2xl shadow-lg hover:opacity-95 disabled:opacity-50"
        >
          <RecordIcon />
        </button>
      </div>
      {permission === "denied" && !isRecording && (
        <div className="text-center">
          <div className="mt-1 text-xs text-accent">Mic permission denied.</div>
        </div>
      )}
    </div>
  );
}

