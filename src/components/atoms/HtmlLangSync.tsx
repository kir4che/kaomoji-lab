'use client';

import { useEffect } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';

export const HtmlLangSync = () => {
  const { lang } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
};
