import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import type { Language } from '@/types/Language';
import { t } from '@/lib/i18n';

import CategoryListPage from './client';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;

  return {
    title: t('meta_category_title', lang),
    description: t('meta_category_description', lang),
    keywords: t('meta_category_keywords', lang).split(','),
    openGraph: {
      title: t('meta_category_og_title', lang),
      description: t('meta_category_og_description', lang),
      type: 'website',
      url: '/category',
    },
  };
}

const CategoryPageContainer = () => {
  return <CategoryListPage />;
};

export default CategoryPageContainer;
