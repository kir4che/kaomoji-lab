'use client';

import { useMemo } from 'react';

import type { CategoryData } from '@/types/Kaomoji';
import { cn } from '@/utils/cn';

type StatusFilter = 'all' | 'checked' | 'unchecked';
type ItemStatus = Exclude<StatusFilter, 'all'>;

type TagCount = {
  all: number;
  checked: number;
  unchecked: number;
};

const getCountForFilter = (counts: TagCount | undefined, filter: StatusFilter) => {
  if (!counts) return 0;
  switch (filter) {
    case 'checked':
      return counts.checked;
    case 'unchecked':
      return counts.unchecked;
    default:
      return counts.all;
  }
};

interface CategoryTagCrossViewProps {
  categories: CategoryData[];
  tagNameMap: Map<string, string>;
  checkedKaomojiIds: Set<string>;
  onCategoryClick?: (categoryId: string) => void;
  onTagClick?: (categoryId: string, tagId: string) => void;
}

const TOP_TAG_LIMIT = 6;

const CategoryTagCrossView = ({
  categories,
  tagNameMap,
  checkedKaomojiIds,
  onCategoryClick,
  onTagClick,
}: CategoryTagCrossViewProps) => {
  const selectedTag = '';
  const categoryKeyword = '';
  const statusFilter: StatusFilter = 'unchecked';

  const categoryStats = useMemo(() => {
    const currentCheckedIds = new Set(checkedKaomojiIds);
    return categories.map((category) => {
      let checkedItems = 0;
      const counts = new Map<string, TagCount>();

      category.items.forEach((item) => {
        const statusKey: ItemStatus = currentCheckedIds.has(item.id) ? 'checked' : 'unchecked';
        if (statusKey === 'checked') checkedItems += 1;

        item.tags.forEach((tagId) => {
          const normalizedTag = tagId.trim();
          if (!normalizedTag) return;

          const categoryCount = counts.get(normalizedTag) ?? {
            all: 0,
            checked: 0,
            unchecked: 0,
          };
          categoryCount.all += 1;
          categoryCount[statusKey] += 1;
          counts.set(normalizedTag, categoryCount);
        });
      });

      return {
        categoryId: category.id,
        categoryName: category.name?.['zh-tw'] || category.name?.en || category.id,
        totalItems: category.items.length,
        checkedItems,
        tagCounts: counts,
      };
    });
  }, [categories, checkedKaomojiIds]);

  const enrichedCategoryStats = useMemo(() => {
    const trimmedKeyword = categoryKeyword.trim();

    return categoryStats
      .map((stat) => {
        const tagEntries = Array.from(stat.tagCounts.entries())
          .map(([tagId, counts]) => ({
            id: tagId,
            name: tagNameMap.get(tagId) || tagId,
            count: getCountForFilter(counts, statusFilter),
          }))
          .filter((entry) => entry.count > 0)
          .sort((a, b) => b.count - a.count);

        return {
          ...stat,
          tagEntries,
        };
      })
      .filter((stat) => {
        if (trimmedKeyword && !stat.categoryName.includes(trimmedKeyword)) return false;
        if (selectedTag && getCountForFilter(stat.tagCounts.get(selectedTag), statusFilter) === 0)
          return false;
        if (statusFilter === 'unchecked' && stat.checkedItems === stat.totalItems) return false;
        return true;
      })
      .sort((a, b) => b.totalItems - a.totalItems);
  }, [categoryStats, tagNameMap, categoryKeyword, selectedTag, statusFilter]);

  return (
    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
      {enrichedCategoryStats.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-500">沒有符合條件的分類</div>
      ) : (
        enrichedCategoryStats.map((stat) => {
          const topTags = stat.tagEntries.slice(0, TOP_TAG_LIMIT);
          const selectedTagEntry = selectedTag
            ? stat.tagEntries.find((entry) => entry.id === selectedTag)
            : undefined;

          const displayTags = selectedTagEntry
            ? [selectedTagEntry, ...topTags.filter((entry) => entry.id !== selectedTagEntry.id)]
            : topTags;

          return (
            <div key={stat.categoryId} className="p-3 space-y-2">
              <div className="flex  justify-between items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onCategoryClick?.(stat.categoryId)}
                  className="text-left text-sm font-semibold text-gray-700 hover:text-primary-600"
                >
                  {stat.categoryName}
                  <span className="text-xs text-gray-500 font-normal ml-1">
                    ({stat.totalItems}) 已檢查 {stat.checkedItems}
                  </span>
                </button>
              </div>
              {displayTags.length === 0 ? (
                <p className="text-xs text-gray-400">此分類尚未設定標籤。</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {displayTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onTagClick?.(stat.categoryId, tag.id)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-full border flex items-center gap-1',
                        selectedTag === tag.id
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <span className="font-medium">{tag.name}</span>
                      <span className="text-[11px] text-gray-500">{tag.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default CategoryTagCrossView;
