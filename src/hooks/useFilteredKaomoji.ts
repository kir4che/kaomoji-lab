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
  return useMemo(() => {
    let items: KaomojiItem[] =
      selectedCategory && allCategories
        ? (allCategories.find((c) => c.id === selectedCategory)?.items ?? [])
        : sourceKaomojis;

    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm) {
      const searchTerms = trimmedSearchTerm.toLowerCase().split(/\s+/);
      const includeTerms = searchTerms.filter((t) => !t.startsWith('-'));
      const excludeTerms = searchTerms
        .filter((t) => t.startsWith('-'))
        .map((t) => t.substring(1))
        .filter(Boolean);

      if (includeTerms.length > 0 || excludeTerms.length > 0) {
        items = items.filter((item) => {
          const itemText = item.text.toLowerCase();
          const itemTags = item.tags.map((t) => t.toLowerCase());
          const itemId = item.id.toLowerCase();

          const check = (term: string) =>
            itemText.includes(term) ||
            itemId.includes(term) ||
            itemTags.some((tag) => tag.includes(term));

          const hasAllIncludeTerms = includeTerms.every(check);
          const hasAnyExcludeTerms = excludeTerms.length > 0 && excludeTerms.some(check);

          return hasAllIncludeTerms && !hasAnyExcludeTerms;
        });
      }
    }

    if (filterTag) {
      items = items.filter((item) => item.tags.includes(filterTag));
    }

    return items;
  }, [sourceKaomojis, allCategories, searchTerm, selectedCategory, filterTag]);
}
