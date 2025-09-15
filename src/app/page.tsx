import path from 'path';
import { promises as fs } from 'fs';

import { cookies } from 'next/headers';
import type { Metadata } from 'next';

import { t } from '@/lib/i18n';
import type { Language } from '@/types/Language';
import { readIndexFile } from '@/services/dataService';
import type { CategorySummary, KaomojiItem, IndexData } from '@/types/Kaomoji';

import HomeClient from './client';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;

  return {
    title: t('meta_home_title', lang),
    description: t('meta_home_description', lang),
    keywords: t('meta_home_keywords', lang).split(','),
    openGraph: {
      title: t('meta_home_og_title', lang),
      description: t('meta_home_og_description', lang),
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
