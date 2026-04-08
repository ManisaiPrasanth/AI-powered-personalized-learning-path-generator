import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'hi' | 'es';

const STORAGE_KEY = 'ai-learning-language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (l: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLanguage(): Language {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'en' || s === 'hi' || s === 'es') return s;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
  }, [language]);

  const setLanguage = (l: Language) => setLanguageState(l);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

