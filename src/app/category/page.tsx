import type { Metadata } from 'next';

import { t } from '@/lib/i18n';
import { readIndexFile } from '@/services/dataService';
import type { CategorySummary } from '@/types/Kaomoji';
import type { Language } from '@/types/Language';

import CategoryListPage from './client';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const lang: Language = 'zh-tw';

  return {
    title: t('metaCategoryTitle', lang),
    description: t('metaCategoryDescription', lang),
    keywords: t('metaCategoryKeywords', lang).split(','),
    alternates: {
      canonical: '/category',
    },
    openGraph: {
      title: t('metaCategoryOgTitle', lang),
      description: t('metaCategoryOgDescription', lang),
      type: 'website',
      url: '/category',
    },
  };
}

const CategoryPageContainer = async () => {
  const indexData = await readIndexFile();
  const categories: CategorySummary[] = (indexData?.categories || []).map((c) => ({
    ...c,
    filePath: `categories/${c.id}.json`,
  }));
  const totalKaomojis = categories.reduce((total, category) => total + category.itemCount, 0);

  return <CategoryListPage categories={categories} totalKaomojis={totalKaomojis} />;
};

export default CategoryPageContainer;
