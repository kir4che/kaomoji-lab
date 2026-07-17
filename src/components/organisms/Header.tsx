'use client';

import Link from 'next/link';

import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

const navLinks = [
  { href: '/', textKey: 'navHome', iconName: 'home' as const },
  { href: '/category', textKey: 'navCategories', iconName: 'category' as const },
  { href: '/tag', textKey: 'navTags', iconName: 'hash' as const },
  { href: '/generator', textKey: 'navGenerator', iconName: 'sparkle' as const },
] as const;

interface NavItemProps {
  href: string;
  text: string;
  iconName: string;
}

const NavItem = ({ href, text, iconName }: NavItemProps) => (
  <Link
    href={href}
    className="group inline-flex items-center gap-x-1 text-sm font-medium text-primary-500"
  >
    <Icon name={iconName} className="size-4.5 text-primary-500 group-hover:text-primary-600" />
    <span className="text-primary-400 hidden sm:block">{text}</span>
  </Link>
);

const Header = () => {
  const { lang, setLang } = useLanguage();

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'zh-tw' : 'en');
  };

  return (
    <header className="px-4 w-full flex-between mx-auto py-2">
      <nav className="flex-center gap-x-3">
        {navLinks.map(({ href, textKey, iconName }) => (
          <NavItem key={href} href={href} text={t(textKey, lang)} iconName={iconName} />
        ))}
      </nav>
      <div className="flex-center gap-x-3">
        <button
          onClick={toggleLanguage}
          aria-label={t('a11yToggleLanguage', lang)}
          className="text-sm text-primary-400 hover:text-primary-500 hover:underline hover:underline-offset-2"
        >
          {lang === 'en' ? t('traditionalChinese', lang) : t('english', lang)}
        </button>
        <a
          href="https://forms.gle/xFU2z2p6yr8Hww2A7"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t('feedback', lang)}${t('a11yOpenInNewTab', lang)}`}
          className="text-sm text-primary-400 hover:text-primary-500 hover:underline hover:underline-offset-2"
        >
          {t('feedback', lang)}
        </a>
      </div>
    </header>
  );
};

export default Header;
