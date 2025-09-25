import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import type { Language } from '@/types/Language';
import { t } from '@/lib/i18n';

import GeneratorPage from './client';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;

  return {
    title: t('meta_generator_title', lang),
    description: t('meta_generator_description', lang),
    keywords: t('meta_generator_keywords', lang).split(','),
    alternates: {
      canonical: '/generator',
    },
    openGraph: {
      title: t('meta_generator_og_title', lang),
      description: t('meta_generator_og_description', lang),
      type: 'website',
      url: '/generator',
    },
  };
}

const GeneratorPageContainer = () => {
  return <GeneratorPage />;
};

export default GeneratorPageContainer;
