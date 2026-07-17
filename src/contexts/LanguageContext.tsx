'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

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

// 取得瀏覽器語言或預設語言
function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'zh-tw';

  const stored = localStorage.getItem('app-language');
  if (stored === 'en' || stored === 'zh-tw') return stored;

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh-tw';
  return 'zh-tw';
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [lang, setLang] = useState<Language>('zh-tw');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setLang(getInitialLanguage());
    setIsInitialized(true);
  }, []);

  const handleSetLang = (newLang: Language) => {
    localStorage.setItem('app-language', newLang);
    setLang(newLang);
  };

  const contextValue = useMemo(
    () => ({
      lang,
      setLang: handleSetLang,
    }),
    [lang]
  );

  // 語言初始化前先不渲染子組件，避免閃爍。
  if (!isInitialized) return null;

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider!');
  return context;
};
