import React from 'react';
import { useLanguage, type Language } from '../state/LanguageContext';

export const LanguageSelect: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <span className="whitespace-nowrap text-slate-600 dark:text-slate-400">Language</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label="Select language"
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-800 shadow-sm outline-none transition focus:ring-2 focus:ring-primary/50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="es">Español</option>
      </select>
    </label>
  );
};

