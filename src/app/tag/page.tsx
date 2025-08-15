'use client';

import { useState, useEffect } from 'react';

import type { KaomojiItem, CategoryData, IndexData } from '@/types/Kaomoji';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { cn } from '@/utils/cn';
import Loading from '@/components/atoms/Loading';
import KaomojiBtn from '@/components/atoms/KaomojiBtn';

interface TagInfo {
  name: string;
  count: number;
  categories: string[];
}

const TagPage: React.FC = () => {
  const { copiedId, copyToClipboard } = useCopyToClipboard();

  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [allKaomojis, setAllKaomojis] = useState<KaomojiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const KaomojisByTag = useFilteredKaomoji({ sourceKaomojis: allKaomojis, filterTag: selectedTag });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/data/index.json');
        const data: IndexData = await res.json();

        const categoryDataPromises = data.categories.map(async (category) => {
          const res = await fetch(`/data/categories/${category.id}.json`);
          const categoryData: CategoryData = await res.json();
          return { category: category.id, items: categoryData.items ?? [] };
        });

        const results = await Promise.all(categoryDataPromises);

        const mergedItems = results.flatMap((r) => r.items);
        setAllKaomojis(mergedItems);

        const tagMap = new Map<string, TagInfo>();
        for (const { category, items } of results) {
          for (const item of items) {
            for (const tag of item.tags) {
              const key = tag.toLowerCase();
              if (!tagMap.has(key)) tagMap.set(key, { name: tag, count: 0, categories: [] });
              const info = tagMap.get(key)!;
              info.count += 1;
              if (!info.categories.includes(category)) info.categories.push(category);
            }
          }
        }
        const sortedTags = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
        setAllTags(sortedTags);
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
    <div className="flex-1 flex flex-col">
      <section className="space-y-3 sm:space-y-4 text-center">
        <h1>標籤</h1>
        <p className="text-sm text-gray-500">透過標籤探索 {allTags.length} 種不同風格的顏文字</p>
      </section>
      {!selectedTag ? (
        <section className="flex-center flex-1 max-w-screen-lg mx-auto pt-6 pb-8">
          <ul className="flex-center flex-wrap gap-x-2 gap-y-3">
            {allTags.map((tag) => (
              <li key={tag.name}>
                <button
                  type="button"
                  onClick={() => setSelectedTag(tag.name)}
                  disabled={tag.count === 0}
                  className={cn(
                    'px-3.5 py-1 rounded-full text-sm tracking-wide font-medium transition-transform hover:scale-105',
                    getTagColor(tag.count)
                  )}
                  aria-label={`標籤：${tag.name}（共 ${tag.count} 個）`}
                >
                  {tag.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="pt-6 pb-8">
          <section className="flex-between mb-4 md:mb-6">
            <h2 className="flex-center gap-x-1 text-gray-800 text-2xl">
              {selectedTag}
              <span className="text-xl">({KaomojisByTag.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className="back-btn"
              aria-label="返回所有標籤"
            >
              返回所有標籤
            </button>
          </section>
          {KaomojisByTag.length > 0 ? (
            <ul className="flex flex-wrap gap-2 md:gap-3">
              {KaomojisByTag.map((kaomoji) => (
                <li key={kaomoji.id}>
                  <KaomojiBtn
                    text={kaomoji.text}
                    onCopy={() => copyToClipboard(kaomoji.text, kaomoji.id)}
                    isCopied={copiedId === kaomoji.id}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-lg text-center py-8">沒有找到包含此標籤的顏文字</p>
          )}
        </section>
      )}
    </div>
  );
};

export default TagPage;
