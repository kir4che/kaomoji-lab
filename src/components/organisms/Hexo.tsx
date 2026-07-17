'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

interface HexoProps {
  totalKaomojis: number;
}

const Hexo = ({ totalKaomojis }: HexoProps) => {
  const { lang } = useLanguage();
  return (
    <section className="text-center">
      <h1 className="gradient-text mb-3 leading-normal">
        {t('siteTitle', lang)}
        <span className="hidden sm:inline" aria-hidden="true">
          {' '}
          *｡٩(ˊᗜˋ*)و✦*｡
        </span>
        <span className="text-xl sm:hidden" aria-hidden="true">
          {' '}
          ♥
        </span>
      </h1>
      <p className="text-sm text-gray-400 sm:text-base">
        {t('siteDescription', lang, { count: totalKaomojis.toLocaleString() })}
      </p>
    </section>
  );
};

export default Hexo;
