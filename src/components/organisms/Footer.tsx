'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

const Footer = () => {
  const { lang } = useLanguage();
  return (
    <footer className="p-3 md:px-4">
      <p className="text-gray-400 text-xs text-center">{t('footerText', lang)}</p>
    </footer>
  );
};

export default Footer;
