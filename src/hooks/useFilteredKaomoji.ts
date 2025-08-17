import { useMemo } from 'react';

import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';

interface UseFilteredKaomojiParams {
  sourceKaomojis: KaomojiItem[];
  allCategories?: CategoryData[];
  searchTerm?: string;
  selectedCategory?: string;
  filterTag?: string;
  filterCheckedStatus?: 'all' | 'checked' | 'unchecked';
  checkedKaomojiIds?: Set<string>;
}

export function useFilteredKaomoji({
  sourceKaomojis,
  allCategories,
  searchTerm = '',
  selectedCategory = '',
  filterTag = '',
  filterCheckedStatus = 'all',
  checkedKaomojiIds = new Set(),
}: UseFilteredKaomojiParams) {
  const countInString = (str: string, target: string) => str.split(target).length - 1;

  return useMemo(() => {
    let items: KaomojiItem[] =
      selectedCategory && allCategories
        ? (allCategories.find((c) => c.id === selectedCategory)?.items ?? [])
        : sourceKaomojis;

    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    if (trimmedSearchTerm) {
      const orSegments = trimmedSearchTerm
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);

      items = items.filter((item) => {
        const itemText = item.text.toLowerCase();
        const itemTags = item.tags.map((t) => t.toLowerCase());
        const itemId = item.id.toLowerCase();

        const check = (term: string) =>
          itemText.includes(term) ||
          itemId.includes(term) ||
          itemTags.some((tag) => tag.includes(term));

        const similaritySearch = orSegments.some((orSegment) => {
          const andTerms = orSegment.split(/\s+/).filter(Boolean);

          const termCounts: Record<string, number> = {};
          const excludeTerms: string[] = [];

          andTerms.forEach((term) => {
            if (term.startsWith('-')) excludeTerms.push(term.substring(1));
            else {
              const keyword = term.startsWith('+') ? term.substring(1) : term;
              termCounts[keyword] = (termCounts[keyword] ?? 0) + 1;
            }
          });

          const passesInclude = Object.entries(termCounts).every(
            ([term, count]) => countInString(itemText, term) >= count
          );
          const passesExclude = !excludeTerms.some((term) => check(term));

          const textMatch = passesInclude && passesExclude;
          const tagMatch = itemTags.some((tag) => tag.includes(orSegment));

          return textMatch || tagMatch;
        });

        return similaritySearch;
      });
    }

    if (filterTag) {
      const normalizedFilterTag = filterTag.trim().toLowerCase();
      items = items.filter((item) =>
        item.tags.some((tag) => tag.trim().toLowerCase() === normalizedFilterTag)
      );
    }

    if (filterCheckedStatus !== 'all') {
      items = items.filter((item) => {
        const isChecked = checkedKaomojiIds.has(item.id);
        return filterCheckedStatus === 'checked' ? isChecked : !isChecked;
      });
    }

    return items;
  }, [
    sourceKaomojis,
    allCategories,
    searchTerm,
    selectedCategory,
    filterTag,
    filterCheckedStatus,
    checkedKaomojiIds,
  ]);
}
