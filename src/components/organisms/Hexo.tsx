'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

const Hexo = () => {
  const { lang } = useLanguage();
  return (
    <section className="text-center">
      <h1 className="gradient-text mb-3 leading-normal">
        {t('siteTitle', lang)}
        <span className="hidden sm:inline"> *｡٩(ˊᗜˋ*)و✦*｡</span>
        <span className="text-xl sm:hidden"> ♥</span>
      </h1>
      <p className="text-sm text-gray-400 sm:text-base">
        {t('siteDescription', lang, { count: process.env.NEXT_PUBLIC_TOTAL_KAOMOJIS || 5000 })}
      </p>
    </section>
  );
};

export default Hexo;
