import { promises as fs } from 'fs';
import path from 'path';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';

import type { Language } from '@/types/Language';
import type { KaomojiItem, CategoryData, IndexData, Tag } from '@/types/Kaomoji';
import { t } from '@/lib/i18n';
import KaomojiList from '@/components/molecules/KaomojiList';
import * as adminService from '@/services/adminService';

const dataDirectory = path.join(process.cwd(), 'public/data');

interface Props {
  params: Promise<{
    tag: string;
  }>;
}

async function getTagById(tagId: string): Promise<Tag | undefined> {
  const allTags = await adminService.getTags();
  return allTags.find((t: { id: string }) => t.id === tagId);
}

async function getKaomojisByTag(tagId: string): Promise<KaomojiItem[]> {
  const indexFile = await fs.readFile(path.join(dataDirectory, 'index.json'), 'utf8');
  const indexData: IndexData = JSON.parse(indexFile);

  const allKaomojis: KaomojiItem[] = [];

  for (const category of indexData.categories) {
    const categoryFile = await fs.readFile(
      path.join(dataDirectory, 'categories', `${category.id}.json`),
      'utf8'
    );
    const categoryData: CategoryData = JSON.parse(categoryFile);
    if (categoryData.items) allKaomojis.push(...categoryData.items);
  }

  return allKaomojis.filter((k) => k.tags.includes(tagId));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;
  const { tag: tagId } = await params;

  const tag = await getTagById(tagId);
  const tagName = tag ? tag.name[lang] : tagId;

  const kaomojis = await getKaomojisByTag(tagId);
  const description = t('meta_tag_page_description', lang, {
    tag: tagName,
    count: kaomojis.length,
  });
  const keywords = t('meta_tag_page_keywords', lang, { tag: tagName }).split(',');

  return {
    title: t('tag_page_title', lang, { tag: tagName }),
    description,
    keywords,
    openGraph: {
      title: t('tag_page_title', lang, { tag: tagName }),
      description,
      type: 'website',
      url: `/tag/${tagId}`,
    },
  };
}

const TagPage = async ({ params }: Props) => {
  const cookieStore = cookies();
  const lang = ((await cookieStore).get('app-language')?.value || 'zh-tw') as Language;
  const { tag: tagId } = await params;

  const tag = await getTagById(tagId);
  const tagName = tag ? tag.name[lang] : tagId;

  const kaomojis = await getKaomojisByTag(tagId);

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
