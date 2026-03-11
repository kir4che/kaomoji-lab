'use client';

import Link from 'next/link';

import CategoryIcon from '@/assets/icons/category.svg';
import HashIcon from '@/assets/icons/hash.svg';
import HomeIcon from '@/assets/icons/home.svg';
import SparkleIcon from '@/assets/icons/sparkle.svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

const navLinks = [
  { href: '/', textKey: 'navHome', Icon: HomeIcon },
  { href: '/category', textKey: 'navCategories', Icon: CategoryIcon },
  { href: '/tag', textKey: 'navTags', Icon: HashIcon },
  { href: '/generator', textKey: 'navGenerator', Icon: SparkleIcon },
] as const;

interface NavItemProps {
  href: string;
  text: string;
  Icon: IconComponent;
}

const NavItem: React.FC<NavItemProps> = ({ href, text, Icon }) => (
  <Link
    href={href}
    className="group inline-flex items-center gap-x-1 text-sm font-medium text-primary-500"
  >
    <Icon className="size-4.5 text-primary-500 group-hover:text-primary-600" />
    <span className="text-primary-400 hidden sm:block">{text}</span>
  </Link>
);

const Header: React.FC = () => {
  const { lang, setLang } = useLanguage();

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'zh-tw' : 'en');
  };

  return (
    <header className="container flex-between mx-auto p-2 md:px-4">
      <nav className="flex-center gap-x-3">
        {navLinks.map(({ href, textKey, Icon }) => (
          <NavItem key={href} href={href} text={t(textKey, lang)} Icon={Icon} />
        ))}
      </nav>
      <div className="flex-center gap-x-3">
        <button
          onClick={toggleLanguage}
          className="text-sm text-primary-400 hover:text-primary-500 hover:underline hover:underline-offset-2"
        >
          {lang === 'en' ? t('traditionalChinese', lang) : t('english', lang)}
        </button>
        <a
          href="https://forms.gle/xFU2z2p6yr8Hww2A7"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-400 hover:text-primary-500 hover:underline hover:underline-offset-2"
        >
          {t('feedback', lang)}
        </a>
        {process.env.NEXT_PUBLIC_NODE_ENV === 'development' && (
          <Link
            href="/admin"
            className="text-sm text-primary-400 hover:text-primary-500 hover:underline hover:underline-offset-2"
          >
            {t('admin', lang)}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
