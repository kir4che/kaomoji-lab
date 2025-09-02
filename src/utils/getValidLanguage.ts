import { Language } from '@/types/Language';

export function getValidLanguage(lang: string | undefined | null): Language {
  if (lang === 'en' || lang === 'zh-tw') return lang;
  return 'zh-tw';
}
