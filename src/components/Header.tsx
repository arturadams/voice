import { MicIcon, SettingsIcon } from "../icons";

type HeaderProps = {
  onSettingsClick: () => void;
};

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-surface/70 border-b border-subtle">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary text-base flex items-center justify-center shadow">
          <MicIcon size={18} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold leading-tight">Velvet Notes</h1>
          <p className="text-xs text-muted">
            Premium voice notes — record, tag, and sync
          </p>
        </div>
        <button
          onClick={onSettingsClick}
          className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface px-3 py-2 text-sm hover:shadow-sm"
        >
          <SettingsIcon /> Settings
        </button>
      </div>
    </header>
  );
}
