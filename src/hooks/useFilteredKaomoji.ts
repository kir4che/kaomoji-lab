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
      const orSegments = trimmedSearchTerm
        .toLowerCase()
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

          const explicitAndTerms = andTerms
            .filter((t) => t.startsWith('+'))
            .map((t) => t.substring(1));
          const excludeTerms = andTerms.filter((t) => t.startsWith('-')).map((t) => t.substring(1));
          const implicitAndTerms = andTerms.filter((t) => !t.startsWith('+') && !t.startsWith('-'));

          const passesExplicitAnd = explicitAndTerms.every(check);
          const passesImplicitAnd = implicitAndTerms.every(check);
          const passesExclude = !excludeTerms.some(check);

          const passesAndConditions =
            explicitAndTerms.length > 0
              ? passesExplicitAnd && passesImplicitAnd
              : passesImplicitAnd;

          return passesAndConditions && passesExclude;
        });
      });
    }

    if (filterTag) items = items.filter((item) => item.tags.includes(filterTag));

    return items;
  }, [sourceKaomojis, allCategories, searchTerm, selectedCategory, filterTag]);
}
