import { useTheme } from "../context/theme";
import logo from "../assets/logo.png";
import darkLogo from "../assets/dark-logo.png";
import { SettingsIcon } from "../icons";

type HeaderProps = {
  onSettingsClick: () => void;
};

export function Header({ onSettingsClick }: HeaderProps) {
  const { theme } = useTheme();

  let effectiveTheme = theme;
  if (theme === 'default') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'standard';
  }

  const currentLogo = effectiveTheme === 'dark' ? darkLogo : logo;

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-surface/70 border-b border-subtle">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
        <img src={currentLogo} alt="Velvet Notes Logo" className="w-9 h-9" />
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