import { RecorderControls } from "./RecorderControls";

export function BottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/70 backdrop-blur border-t border-subtle z-10">
      <div className="mx-auto max-w-5xl p-4">
        <RecorderControls />
      </div>
    </div>
  );
}
