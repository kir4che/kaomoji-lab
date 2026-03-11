import { promises as fs } from 'fs';
import path from 'path';

import type { Metadata } from 'next';

import { t } from '@/lib/i18n';
import { readIndexFile } from '@/services/dataService';
import type { CategorySummary, IndexData, KaomojiItem } from '@/types/Kaomoji';
import type { Language } from '@/types/Language';

import HomeClient from './client';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const lang: Language = 'zh-tw';

  return {
    title: t('metaHomeTitle', lang),
    description: t('metaHomeDescription', lang),
    keywords: t('metaHomeKeywords', lang).split(','),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: t('metaHomeOgTitle', lang),
      description: t('metaHomeOgDescription', lang),
      type: 'website',
      url: '/',
    },
  };
}

const HomePage = async () => {
  const indexData: IndexData = await readIndexFile();
  const categories: CategorySummary[] = (indexData?.categories || []).map((c) => ({
    ...c,
    filePath: `categories/${c.id}.json`,
  }));

  const dataDirectory = path.join(process.cwd(), 'public/data');

  // 並行讀取所有分類檔案，提升效能
  const categoryDataPromises = categories.map(async (category) => {
    const filePath = path.join(dataDirectory, 'categories', `${category.id}.json`);
    try {
      const res = await fs.readFile(filePath, 'utf8');
      const categoryData: { items?: KaomojiItem[] } = JSON.parse(res);
      return categoryData.items ?? [];
    } catch {
      return [];
    }
  });

  const allKaomojis = (await Promise.all(categoryDataPromises)).flat();

  return <HomeClient categories={categories} allKaomojis={allKaomojis} />;
};

export default HomePage;
