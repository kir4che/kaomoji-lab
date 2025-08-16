import { useMemo } from 'react';

import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';

interface UseFilteredKaomojiParams {
  sourceKaomojis: KaomojiItem[];
  allCategories?: CategoryData[];
  searchTerm?: string;
  selectedCategory?: string;
  filterTag?: string;
}

export function useFilteredKaomoji({
  sourceKaomojis,
  allCategories,
  searchTerm = '',
  selectedCategory = '',
  filterTag = '',
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

        return orSegments.some((orSegment) => {
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
          return passesInclude && passesExclude;
        });
      });
    }

    if (filterTag) items = items.filter((item) => item.tags.includes(filterTag));

    return items;
  }, [sourceKaomojis, allCategories, searchTerm, selectedCategory, filterTag]);
}
