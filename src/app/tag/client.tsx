'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { CategoryData, IndexData, Tag } from '@/types/Kaomoji';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { cn } from '@/utils/cn';
import Loading from '@/components/atoms/Loading';

interface TagInfo {
  tag: Tag;
  count: number;
}

const TagPage: React.FC = () => {
  const router = useRouter();
  const { lang } = useLanguage();
  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tagsRes, indexRes] = await Promise.all([
          fetch('/api/tags'),
          fetch('/data/index.json'),
        ]);

        const tags: Tag[] = await tagsRes.json();
        const indexData: IndexData = await indexRes.json();

        const categoryDataPromises = indexData.categories.map(async (category) => {
          const res = await fetch(`/data/categories/${category.id}.json`);
          const categoryData: CategoryData = await res.json();
          return categoryData.items ?? [];
        });

        const allKaomojis = (await Promise.all(categoryDataPromises)).flat();

        const tagCountMap = new Map<string, number>();
        for (const item of allKaomojis) {
          for (const tagId of item.tags) {
            tagCountMap.set(tagId, (tagCountMap.get(tagId) || 0) + 1);
          }
        }

        const tagInfo: TagInfo[] = tags
          .map((tag) => ({
            tag,
            count: tagCountMap.get(tag.id) || 0,
          }))
          .sort((a, b) => b.count - a.count);

        setAllTags(tagInfo);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const getTagColor = (count: number) => {
    if (count > 1000) return 'bg-rose-50 text-rose-900 border border-rose-300';
    if (count > 500) return 'bg-orange-50 text-orange-900 border border-orange-300';
    if (count > 250) return 'bg-yellow-50 text-yellow-900 border border-yellow-300';
    if (count > 100) return 'bg-green-50 text-green-900 border border-green-300';
    if (count > 50) return 'bg-cyan-50 text-cyan-900 border border-cyan-300';
    if (count > 5) return 'bg-violet-50 text-violet-900 border border-violet-300';
    return 'bg-white text-gray-800 border border-gray-300';
  };

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col">
      <section className="space-y-3 sm:space-y-4 text-center">
        <h1>{t('tag_page_h1', lang)}</h1>
        <p className="text-sm text-gray-500">{t('tag_page_p', lang, { count: allTags.length })}</p>
      </section>
      <section className="flex-center flex-1 max-w-screen-lg mx-auto pt-6 pb-8">
        <ul className="flex-center flex-wrap gap-x-2 gap-y-3">
          {allTags.map(({ tag, count }) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => router.push(`/tag/${tag.id}`)}
                disabled={count === 0}
                className={cn(
                  'px-3.5 py-1 rounded-full text-sm tracking-wide font-medium transition-transform hover:scale-105',
                  getTagColor(count)
                )}
                aria-label={t('tag_page_aria_label', lang, { tag: tag.name[lang], count })}
              >
                {tag.name[lang]}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default TagPage;
