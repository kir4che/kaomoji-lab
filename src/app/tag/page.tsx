import path from 'path';
import { promises as fs } from 'fs';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import type { Language } from '@/types/Language';
import { t } from '@/lib/i18n';
import { getAllTags, readIndexFile } from '@/services/dataService';
import type { CategoryData, IndexData, Tag } from '@/types/Kaomoji';

import TagPage from './client';

export const dynamic = 'force-static';

interface TagInfo {
  tag: Tag;
  count: number;
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;

  return {
    title: t('metaTagTitle', lang),
    description: t('metaTagDescription', lang),
    keywords: t('metaTagKeywords', lang).split(','),
    alternates: {
      canonical: '/tag',
    },
    openGraph: {
      title: t('metaTagOgTitle', lang),
      description: t('metaTagOgDescription', lang),
      type: 'website',
      url: '/tag',
    },
  };
}

const TagPageContainer = async () => {
  const allTags = await getAllTags();
  const indexData: IndexData = await readIndexFile();

  const dataDirectory = path.join(process.cwd(), 'public/data');

  // 並行讀取所有分類檔案
  const categoryDataPromises = indexData.categories.map(async (category) => {
    const filePath = path.join(dataDirectory, 'categories', `${category.id}.json`);
    const res = await fs.readFile(filePath, 'utf8');
    const categoryData: CategoryData = JSON.parse(res);
    return categoryData.items ?? [];
  });

  const allKaomojis = (await Promise.all(categoryDataPromises)).flat();

  const tagCountMap = new Map<string, number>();
  for (const item of allKaomojis) {
    for (const tagId of item.tags) {
      tagCountMap.set(tagId, (tagCountMap.get(tagId) || 0) + 1);
    }
  }

  const tagInfo: TagInfo[] = allTags
    .map((tag) => ({
      tag,
      count: tagCountMap.get(tag.id) || 0,
    }))
    .sort((a, b) => b.count - a.count);

  return <TagPage allTags={tagInfo} />;
};

export default TagPageContainer;
