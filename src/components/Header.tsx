import { useTheme } from "../context/theme";
import { SettingsIcon } from "../icons";

type HeaderProps = {
  onSettingsClick: () => void;
  tab: "pending" | "processed";
  onTabChange: (tab: "pending" | "processed") => void;
};

export function Header({ onSettingsClick, tab, onTabChange }: HeaderProps) {
  const { theme } = useTheme();

  let effectiveTheme = theme;
  if (theme === 'auto') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const currentLogo = effectiveTheme === 'dark' ? '/dark-logo.png' : '/logo.png';

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-surface/70 border-b border-subtle">
      <div className="mx-auto max-w-5xl px-2 sm:px-4 py-2 flex items-center gap-2 sm:gap-3">
        <img src={currentLogo} alt="VoiceRouter Logo" className="w-8 h-8 sm:w-9 sm:h-9" />
        <div className="flex-1">
          <h1 className="text-content sm:text-lg font-semibold leading-tight">VoiceRouter</h1>
          <p className="text-xs text-muted hidden sm:block">
            Premium voice notes — record, tag, and sync
          </p>
        </div>
        <button
          onClick={onSettingsClick}
          className="inline-flex items-center gap-2 rounded-full sm:rounded-xl border border-subtle bg-surface p-2 sm:px-3 sm:py-2 text-sm hover:shadow-sm"
        >
          <SettingsIcon />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex gap-4 border-b border-subtle">
          <button
            onClick={() => onTabChange("pending")}
            className={`py-2 px-4 text-sm ${tab === "pending" ? "border-b-2 border-primary text-primary" : "text-muted"}`}>
            Pending
          </button>
          <button
            onClick={() => onTabChange("processed")}
            className={`py-2 px-4 text-sm ${tab === "processed" ? "border-b-2 border-primary text-primary" : "text-muted"}`}>
            Processed
          </button>
        </div>
      </div>
    </header>
  );
}