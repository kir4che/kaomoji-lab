import { promises as fs } from 'fs';
import path from 'path';

import type { Metadata } from 'next';
import Link from 'next/link';

import type { KaomojiItem, CategoryData, IndexData } from '@/types/Kaomoji';
import KaomojiList from '@/components/molecules/KaomojiList';

interface TagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const kaomojis = await getKaomojisByTag(decodedTag);
  const description = `探索帶有「${decodedTag}」標籤的顏文字！我們為您找到了 ${kaomojis.length} 個相關的顏文字，快來複製您喜歡的吧！`;
  const keywords = [
    decodedTag,
    '顏文字',
    '表情符號',
    '標籤',
    'Kaomoji',
    'Tags',
    'Japanese Emoticons',
  ];

  return {
    title: `${decodedTag}`,
    description,
    keywords,
    openGraph: {
      title: `${decodedTag}`,
      description,
      type: 'website',
      url: `/tag/${tag}`,
    },
  };
}

async function getKaomojisByTag(tag: string): Promise<KaomojiItem[]> {
  const dataDirectory = path.join(process.cwd(), 'public/data');
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

  return allKaomojis.filter((k) => k.tags.includes(tag));
}

const TagPage = async ({ params }: TagPageProps) => {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const kaomojis = await getKaomojisByTag(decodedTag);

  return (
    <div className="flex-1 flex flex-col">
      <section className="space-y-3 sm:space-y-4 text-center">
        <h1>{decodedTag}</h1>
        <p className="text-sm text-gray-500">共找到 {kaomojis.length} 個包含此標籤的顏文字</p>
      </section>
      <section className="pt-6 pb-12">
        {kaomojis.length > 0 ? (
          <KaomojiList kaomojis={kaomojis} />
        ) : (
          <div className="flex-center flex-1">
            <p className="text-gray-500 text-lg">在此標籤中沒有符合條件的顏文字</p>
          </div>
        )}
      </section>
      <section className="mt-auto text-center mb-8">
        <Link href="/tag" className="inline-block back-btn">
          返回所有標籤
        </Link>
      </section>
    </div>
  );
};

export default TagPage;
