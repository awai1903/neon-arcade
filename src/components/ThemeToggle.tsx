import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { applyTheme, getStoredTheme } from '../utils/theme';
import type { Theme } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  const handleToggle = () => {
    triggerHaptic('selection');
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  const isDark = theme === 'dark';

  return (
    <button
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-[#0c1226] text-slate-300 transition-all hover:text-cyan-300 hover:border-cyan-400 active:scale-90"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};
