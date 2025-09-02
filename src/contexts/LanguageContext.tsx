'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import Cookies from 'js-cookie';

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
  const [lang, setLang] = useState<Language>(() => {
    const cookieLang = Cookies.get('app-language') as Language | undefined;
    return cookieLang && ['en', 'zh-tw'].includes(cookieLang) ? cookieLang : 'zh-tw';
  });

  useEffect(() => {
    const cookieLang = Cookies.get('app-language') as Language | undefined;
    if (cookieLang && ['en', 'zh-tw'].includes(cookieLang)) {
      setLang(cookieLang);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    Cookies.set('app-language', newLang, { expires: 365 });
    setLang(newLang);
    window.location.reload();
  };

  const contextValue = useMemo(
    () => ({
      lang,
      setLang: handleSetLang,
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
