import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'auto' | 'light' | 'dark' | 'neon';

interface ThemeContextValue {
  theme: Theme;
  setTheme(theme: Theme): void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const THEMES: Theme[] = ['auto', 'light', 'dark', 'neon'];
const THEME_COLORS: Record<Theme, string> = {
  light: '#f8fafc',
  dark: '#0f172a',
  neon: '#000000',
  auto: '#f8fafc',
};

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const t of THEMES) root.classList.remove(`theme-${t}`);
  
  let effectiveTheme: Theme = theme;
  if (theme === 'auto') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.classList.add(`theme-${effectiveTheme}`);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[effectiveTheme]);
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return THEMES.includes(stored as Theme) ? (stored as Theme) : 'auto';
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
