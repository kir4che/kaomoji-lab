import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import type { Language } from '@/types/Language';
import { t } from '@/lib/i18n';

import TagPage from './client';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;

  return {
    title: t('meta_tag_title', lang),
    description: t('meta_tag_description', lang),
    keywords: t('meta_tag_keywords', lang).split(','),
    openGraph: {
      title: t('meta_tag_og_title', lang),
      description: t('meta_tag_og_description', lang),
      type: 'website',
      url: '/tag',
    },
  };
}

const TagPageContainer = () => {
  return <TagPage />;
};

export default TagPageContainer;
