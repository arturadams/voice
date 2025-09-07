import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'standard' | 'dark' | 'neon';

interface ThemeContextValue {
  theme: Theme;
  setTheme(theme: Theme): void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEMES: Theme[] = ['standard', 'dark', 'neon'];
const THEME_COLORS: Record<Theme, string> = {
  standard: '#ffffff',
  dark: '#0f172a',
  neon: '#000000',
};

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const t of THEMES) root.classList.remove(`theme-${t}`);
  root.classList.add(`theme-${theme}`);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return THEMES.includes(stored as Theme) ? (stored as Theme) : 'standard';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
