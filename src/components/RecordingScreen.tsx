import { useEffect, useRef } from "react";
import { fmt } from "../utils/fmt";
import { StopIcon, PauseIcon, PlayIcon, CloseIcon } from "../icons";

type RecordingScreenProps = {
  recordMs: number;
  analyser: AnalyserNode | null;
  isPaused: boolean;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
};

export function RecordingScreen({ recordMs, analyser, isPaused, stopRecording, pauseRecording, resumeRecording, cancelRecording }: RecordingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);
      const { width, height } = canvas;
      const styles = getComputedStyle(document.documentElement);
      const baseColor = styles.getPropertyValue("--color-base").trim();
      const primaryColor = styles.getPropertyValue("--color-primary").trim();

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = primaryColor;
      ctx.beginPath();

      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    render();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [analyser]);

  return (
    <div className="fixed inset-0 bg-base z-20 flex flex-col items-center justify-center">
      <button onClick={cancelRecording} className="absolute top-4 right-4">
        <CloseIcon />
      </button>
      <canvas ref={canvasRef} className="w-full h-64" width={800} height={256} />
      <div className="text-2xl font-mono tabular-nums mt-4">{fmt.ms(recordMs)}</div>
      <div className="flex items-center gap-4 mt-4">
        {isPaused ? (
          <button onClick={resumeRecording} className="p-4 rounded-full bg-primary text-white">
            <PlayIcon />
          </button>
        ) : (
          <button onClick={pauseRecording} className="p-4 rounded-full bg-primary text-white">
            <PauseIcon />
          </button>
        )}
        <button onClick={stopRecording} className="p-4 rounded-full bg-secondary text-white">
          <StopIcon />
        </button>
      </div>
    </div>
  );
}
