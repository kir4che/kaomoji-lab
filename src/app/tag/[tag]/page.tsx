import { promises as fs } from 'fs';
import path from 'path';

import { cache } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import type { Language } from '@/types/Language';
import type { KaomojiItem, CategoryData, IndexData, Tag } from '@/types/Kaomoji';
import { t } from '@/lib/i18n';
import { getAllTags } from '@/services/dataService';

import TagPageClient from './client';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  try {
    const allTags = await getAllTags();
    return allTags.map((tag) => ({
      tag: tag.id,
    }));
  } catch {
    return [];
  }
}

const dataDirectory = path.join(process.cwd(), 'public/data');

interface Props {
  params: Promise<{
    tag: string;
  }>;
}

const getTagBySlugOrId = cache(async (slugOrId: string): Promise<Tag | undefined> => {
  try {
    const allTags = await getAllTags();
    const slug = slugOrId.toLowerCase();
    return allTags.find(
      (t) =>
        t.id === slugOrId ||
        t.name.en.toLowerCase() === slug ||
        t.name['zh-tw'].toLowerCase() === slug
    );
  } catch {
    return undefined;
  }
});

const getKaomojisByTag = cache(async (tagId: string): Promise<KaomojiItem[]> => {
  try {
    const indexFile = await fs.readFile(path.join(dataDirectory, 'index.json'), 'utf8');
    const indexData: IndexData = JSON.parse(indexFile);

    // 並行讀取所有分類檔案
    const categoryFilePromises = indexData.categories.map((category) => {
      const filePath = path.join(dataDirectory, 'categories', `${category.id}.json`);
      return fs.readFile(filePath, 'utf8');
    });

    const categoryFiles = await Promise.all(categoryFilePromises);

    const allKaomojis = categoryFiles.flatMap((fileContent) => {
      const categoryData: CategoryData = JSON.parse(fileContent);
      return categoryData.items || [];
    });

    return allKaomojis.filter((k) => k.tags.includes(tagId));
  } catch {
    notFound();
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('app-language')?.value || 'zh-tw') as Language;
  const { tag: slug } = await params;
  const canonicalPath = `/tag/${encodeURIComponent(slug)}`;

  const tag = await getTagBySlugOrId(slug);

  if (!tag) notFound();

  const tagName = tag.name[lang] || tag.name.en;
  const kaomojis = await getKaomojisByTag(tag.id);
  const description = t('metaTagPageDescription', lang, {
    tag: tagName,
    count: kaomojis.length,
  });
  const keywords = t('metaTagPageKeywords', lang, { tag: tagName }).split(',');
  keywords.push(`${tagName} 顏文字`);
  keywords.push(`${tagName} Kaomoji`);

  return {
    title: t('tagPageTitle', lang, { tag: tagName }),
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: t('tagPageTitle', lang, { tag: tagName }),
      description,
      type: 'website',
      url: canonicalPath,
    },
  };
}

const TagPage = async ({ params }: Props) => {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('app-language')?.value || 'zh-tw') as Language;
  const { tag: slug } = await params;

  const tag = await getTagBySlugOrId(slug);

  if (!tag) notFound();

  const tagName = tag.name[lang] || tag.name.en;
  const kaomojis = await getKaomojisByTag(tag.id);

  return <TagPageClient kaomojis={kaomojis} tagName={tagName} />;
};

export default TagPage;
