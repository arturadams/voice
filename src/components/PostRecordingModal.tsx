type PostRecordingModalProps = {
  onClose: () => void;
  onSelect: (option: "memo" | "task" | "appointment") => void;
};

export function PostRecordingModal({ onClose, onSelect }: PostRecordingModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center">
      <div className="bg-surface rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4">What to do with this note?</h2>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelect("memo")}
            className="p-4 rounded-lg bg-base hover:bg-primary/20 text-left"
          >
            <h3 className="text-lg font-semibold">Memo</h3>
            <p className="text-sm text-muted">Just save the audio and transcription.</p>
          </button>
          <button
            onClick={() => onSelect("task")}
            className="p-4 rounded-lg bg-base hover:bg-primary/20 text-left"
          >
            <h3 className="text-lg font-semibold">Task</h3>
            <p className="text-sm text-muted">Create a task in your to-do list.</p>
          </button>
          <button
            onClick={() => onSelect("appointment")}
            className="p-4 rounded-lg bg-base hover:bg-primary/20 text-left"
          >
            <h3 className="text-lg font-semibold">Appointment</h3>
            <p className="text-sm text-muted">Create a calendar event.</p>
          </button>
        </div>
        <button onClick={onClose} className="mt-6 w-full p-2 rounded-lg border border-subtle">
          Cancel
        </button>
      </div>
    </div>
  );
}
