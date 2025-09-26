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
  tagAliasMap?: Map<string, string[]>;
}

export function useFilteredKaomoji({
  sourceKaomojis,
  allCategories,
  searchTerm = '',
  selectedCategory = '',
  filterTag = '',
  filterCheckedStatus = 'all',
  checkedKaomojiIds = new Set(),
  tagAliasMap,
}: UseFilteredKaomojiParams) {
  const countInString = (str: string, target: string) => str.split(target).length - 1;

  const normalize = (value: string) =>
    value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

  return useMemo(() => {
    const extractTagTexts = (tags: unknown[]): string[] =>
      tags.flatMap((tag) => {
        if (typeof tag === 'string') {
          const normalizedTag = normalize(tag);
          const aliasCandidates = tagAliasMap?.get(tag) ?? tagAliasMap?.get(normalizedTag) ?? [];
          const aliasSet = new Set<string>([normalizedTag]);
          aliasCandidates.forEach((alias) => {
            if (alias) aliasSet.add(alias);
          });
          return Array.from(aliasSet);
        }
        if (typeof tag === 'object' && tag !== null) {
          const tagObj = tag as any;
          const texts: string[] = [];
          if (tagObj.en) texts.push(tagObj.en.toLowerCase());
          if (tagObj['zh-tw']) texts.push(tagObj['zh-tw'].toLowerCase());
          return texts;
        }
        return [];
      });

    const tagMatches = (tags: unknown[], targetTag: string): boolean => {
      const normalizedTarget = targetTag.trim().toLowerCase();

      return tags.some((tag) => {
        if (typeof tag === 'string') return tag.trim().toLowerCase() === normalizedTarget;
        if (typeof tag === 'object' && tag !== null) {
          const tagObj = tag as any;
          return (
            (tagObj.en && tagObj.en.trim().toLowerCase() === normalizedTarget) ||
            (tagObj['zh-tw'] && tagObj['zh-tw'].trim().toLowerCase() === normalizedTarget)
          );
        }
        return false;
      });
    };

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
        const itemTags = extractTagTexts(item.tags);
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

    if (filterTag) items = items.filter((item) => tagMatches(item.tags, filterTag));

    if (filterCheckedStatus !== 'all')
      items = items.filter((item) => {
        const isChecked = checkedKaomojiIds.has(item.id);
        return filterCheckedStatus === 'checked' ? isChecked : !isChecked;
      });

    return items;
  }, [
    sourceKaomojis,
    allCategories,
    searchTerm,
    selectedCategory,
    filterTag,
    filterCheckedStatus,
    checkedKaomojiIds,
    tagAliasMap,
  ]);
}
