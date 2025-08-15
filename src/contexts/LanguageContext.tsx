'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

import type { Language } from '@/types/Language';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'zh-tw',
  setLang: () => {
    throw new Error('Cannot set language outside of a LanguageProvider!');
  },
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLang] = useState<Language>('zh-tw');

  /*
  useEffect(() => {
    const storedLang = localStorage.getItem('app-language') as Language | null;
    if (storedLang && ['en', 'zh-tw'].includes(storedLang)) {
      setLang(storedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app-language', lang);
  }, [lang]);
  */

  const contextValue = useMemo(
    () => ({
      lang,
      setLang,
    }),
    [lang]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider!');
  return context;
}
