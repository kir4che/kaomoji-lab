import { promises as fs } from 'fs';
import path from 'path';

import { cache } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import type { Language } from '@/types/Language';
import type { KaomojiItem, CategoryData, IndexData, Tag } from '@/types/Kaomoji';
import { t } from '@/lib/i18n';
import KaomojiList from '@/components/molecules/KaomojiList';
import { getAllTags } from '@/services/dataService';

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

  const tag = await getTagBySlugOrId(slug);

  if (!tag) {
    notFound();
  }

  const tagName = tag.name[lang] || tag.name.en;
  const kaomojis = await getKaomojisByTag(tag.id);
  const description = t('meta_tag_page_description', lang, {
    tag: tagName,
    count: kaomojis.length,
  });
  const keywords = t('meta_tag_page_keywords', lang, { tag: tagName }).split(',');
  keywords.push(`${tagName} 顏文字`);
  keywords.push(`${tagName} Kaomoji`);

  return {
    title: t('tag_page_title', lang, { tag: tagName }),
    description,
    keywords,
    openGraph: {
      title: t('tag_page_title', lang, { tag: tagName }),
      description,
      type: 'website',
      url: `/tag/${slug}`,
    },
  };
}

const TagPage = async ({ params }: Props) => {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('app-language')?.value || 'zh-tw') as Language;
  const { tag: slug } = await params;

  const tag = await getTagBySlugOrId(slug);

  if (!tag) {
    notFound();
  }

  const tagName = tag.name[lang] || tag.name.en;
  const kaomojis = await getKaomojisByTag(tag.id);

  return (
    <div className="flex-1 flex flex-col">
      <section className="space-y-3 sm:space-y-4 text-center">
        <h1>{tagName}</h1>
        <p className="text-sm text-gray-500">
          {t('tag_page_description', lang, { count: kaomojis.length })}
        </p>
      </section>
      <section className="pt-6 pb-12">
        {kaomojis.length > 0 ? (
          <KaomojiList kaomojis={kaomojis} />
        ) : (
          <div className="flex-center flex-1">
            <p className="text-gray-500 text-lg">{t('tag_page_no_results', lang)}</p>
          </div>
        )}
      </section>
      <section className="mt-auto text-center mb-8">
        <Link href="/tag" className="inline-block back-btn">
          {t('tag_page_back_to_all_tags', lang)}
        </Link>
      </section>
    </div>
  );
};

export default TagPage;
