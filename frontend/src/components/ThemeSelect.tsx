import React from 'react';
import { useTheme, type Theme } from '../state/ThemeContext';

/** Dropdown to choose light or dark theme (persisted). */
export const ThemeSelect: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <label className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <span className="whitespace-nowrap text-slate-600 dark:text-slate-400">Theme</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        aria-label="Select color theme"
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-800 shadow-sm outline-none transition focus:ring-2 focus:ring-primary/50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </label>
  );
};
