import type { Metadata } from 'next';

import { t } from '@/lib/i18n';
import type { Language } from '@/types/Language';

import GeneratorPage from './client';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const lang: Language = 'zh-tw';

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
  return <GeneratorPage />;
};

export default GeneratorPageContainer;
