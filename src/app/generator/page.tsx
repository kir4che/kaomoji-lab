import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { t } from '@/lib/i18n';
import type { Language } from '@/types/Language';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;

  return {
    title: t('metaGeneratorTitle', lang),
    description: t('metaGeneratorDescription', lang),
    keywords: t('metaGeneratorKeywords', lang).split(','),
    alternates: {
      canonical: '/generator',
    },
    openGraph: {
      title: t('metaGeneratorOgTitle', lang),
      description: t('metaGeneratorOgDescription', lang),
      type: 'website',
      url: '/generator',
    },
  };
}

const GeneratorPageContainer = async () => {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-3xl font-bold text-gray-800">{t('comingSoonTitle', lang)}</h1>
        <p className="text-lg text-gray-600">{t('comingSoonDescription', lang)}</p>
      </div>
    </div>
  );
};

export default GeneratorPageContainer;
