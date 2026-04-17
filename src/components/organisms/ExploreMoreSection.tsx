'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

const ExploreMoreSection = () => {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const links = [
    {
      href: '/category',
      bg: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200/65',
      titleKey: 'exploreCategoriesTitle',
      descKey: 'exploreCategoriesDesc',
    },
    {
      href: '/tag',
      bg: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200/65',
      titleKey: 'exploreTagsTitle',
      descKey: 'exploreTagsDesc',
    },
    {
      href: '/generator',
      bg: 'bg-violet-100 text-violet-800 hover:bg-violet-200/65',
      titleKey: 'exploreGeneratorTitle',
      descKey: 'exploreGeneratorDesc',
    },
  ] as const;

  const filteredLinks = links.filter(
    (link) => link.href !== pathname && !pathname.startsWith(link.href + '/')
  );

  if (pathname === '/admin') return null;

  return (
    <section className="container mx-auto px-2 md:px-4 pb-8 text-center">
      <div className="px-8 py-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">{t('exploreMore', lang)}</h3>
        <div className={`flex-between flex-col md:flex-row gap-x-4 gap-y-3`}>
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${link.bg} flex-1 w-full p-4 rounded-lg transition-colors`}
            >
              <h4 className="font-semibold mb-2">{t(link.titleKey, lang)}</h4>
              <p className="text-sm">{t(link.descKey, lang)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreMoreSection;
