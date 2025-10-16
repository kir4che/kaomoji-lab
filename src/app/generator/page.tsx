import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import type { Language } from '@/types/Language';
import { t } from '@/lib/i18n';

import GeneratorPage from './client';

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

const GeneratorPageContainer = () => {
  return <GeneratorPage />;
};

export default GeneratorPageContainer;
