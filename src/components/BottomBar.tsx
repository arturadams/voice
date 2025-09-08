import { RecorderControls } from "./RecorderControls";
import { WavRecorder } from "../services/wav-recorder";

type BottomBarProps = {
  isRecording: boolean;
  startRecording: () => void;
  permission: "unknown" | "granted" | "denied";
};

export function BottomBar(props: BottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/70 backdrop-blur border-t border-subtle z-10">
      <div className="mx-auto max-w-5xl p-8 flex justify-center">
        <div style={{ marginTop: '-2.75rem' }}>
          <RecorderControls {...props} />
        </div>
      </div>
    </div>
  );
}
