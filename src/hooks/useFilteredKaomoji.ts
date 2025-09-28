import { useMemo } from 'react';

import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';
import { useAllTags } from '@/hooks/useAllTags';

const isDev = process.env.NEXT_PUBLIC_NODE_ENV === 'development';

interface UseFilteredKaomojiParams {
  sourceKaomojis: KaomojiItem[];
  allCategories?: CategoryData[];
  searchTerm?: string;
  selectedCategory?: string;
  filterTag?: string | string[];
  filterCheckedStatus?: 'all' | 'checked' | 'unchecked';
  checkedKaomojiIds?: Set<string>;
}

const normalize = (value: string) =>
  value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

export function useFilteredKaomoji({
  sourceKaomojis,
  allCategories,
  searchTerm = '',
  selectedCategory = '',
  filterTag = '',
  filterCheckedStatus = 'all',
  checkedKaomojiIds = new Set(),
}: UseFilteredKaomojiParams) {
  const { tags: allTags } = useAllTags();

  const { tagIdToNamesMap } = useMemo(() => {
    const newTagNameToIdMap = new Map<string, string>();
    const newTagIdToNamesMap = new Map<string, string[]>();

    allTags.forEach((tag) => {
      if (tag.id && tag.name) {
        const tagNames: string[] = [];
        const processTagName = (name: string, id: string) => {
          const normalizedName = normalize(name);
          newTagNameToIdMap.set(normalizedName, id);
          newTagNameToIdMap.set(name.toLowerCase(), id);
          tagNames.push(name, normalizedName);

          if (name.includes(' ')) {
            const hyphenated = name.replace(/ /g, '-').toLowerCase();
            newTagNameToIdMap.set(hyphenated, id);
            tagNames.push(hyphenated);
          } else if (name.includes('-')) {
            const spaced = name.replace(/-/g, ' ').toLowerCase();
            newTagNameToIdMap.set(spaced, id);
            tagNames.push(spaced);
          }
        };

        if (tag.name.en) processTagName(tag.name.en, tag.id);
        if (tag.name['zh-tw']) processTagName(tag.name['zh-tw'], tag.id);

        newTagIdToNamesMap.set(tag.id, tagNames);
      }
    });

    return { tagNameToIdMap: newTagNameToIdMap, tagIdToNamesMap: newTagIdToNamesMap };
  }, [allTags]);

  const { processedSearchTerm, excludeTags, excludeCategories } = useMemo(() => {
    let currentSearchTerm = searchTerm;
    const newExcludeTags: string[] = [];
    const newExcludeCategories: string[] = [];

    if (isDev) {
      currentSearchTerm = searchTerm.replace(/-(?:tag|cat):(\S+)/gi, (match, value) => {
        if (match.toLowerCase().startsWith('-tag:')) {
          newExcludeTags.push(value.toLowerCase());
        } else if (match.toLowerCase().startsWith('-cat:')) {
          newExcludeCategories.push(value.toLowerCase());
        }
        return '';
      });
    }
    return {
      processedSearchTerm: currentSearchTerm,
      excludeTags: newExcludeTags,
      excludeCategories: newExcludeCategories,
    };
  }, [searchTerm]);

  return useMemo(() => {
    const tagMatches = (tags: string[], targetTag: string): boolean => {
      const normalizedTarget = targetTag.trim().toLowerCase();
      return tags.some((tag) => normalize(tag) === normalizedTarget);
    };

    let items: KaomojiItem[] =
      selectedCategory && allCategories
        ? (allCategories.find((c) => c.id === selectedCategory)?.items ?? [])
        : sourceKaomojis;

    if (filterTag) {
      const filterTags = Array.isArray(filterTag) ? filterTag : [filterTag];
      if (filterTags.length > 0) {
        items = items.filter((item) => filterTags.every((tag) => tagMatches(item.tags, tag)));
      }
    }

    if (isDev) {
      if (excludeTags.length > 0) {
        items = items.filter(
          (item) => !excludeTags.some((excludeTag) => tagMatches(item.tags, excludeTag))
        );
      }
      if (excludeCategories.length > 0 && allCategories) {
        items = items.filter((item) => {
          const belongingCategories = allCategories.filter((category) =>
            category.items.some((catItem) => catItem.id === item.id)
          );
          return !belongingCategories.some((category) => {
            const catNames = Object.values(category.name).map((name) => name.toLowerCase());
            return excludeCategories.some((excludeCat) => catNames.includes(excludeCat));
          });
        });
      }
    }

    const trimmedSearchTerm = processedSearchTerm.trim().toLowerCase();
    if (trimmedSearchTerm) {
      const orSegments = trimmedSearchTerm
        .split(/(?<![\\|])\|(?![|\\])/)
        .map((s) => s.trim())
        .filter(Boolean);

      items = items.filter((item) => {
        const itemText = item.text.toLowerCase();
        const itemId = item.id.toLowerCase();

        return orSegments.some((segment) => {
          const normalizedSegment = segment.toLowerCase();

          const segmentVariations = [normalizedSegment];
          if (normalizedSegment.includes(' '))
            segmentVariations.push(normalizedSegment.replace(/ /g, '-'));
          else if (normalizedSegment.includes('-'))
            segmentVariations.push(normalizedSegment.replace(/ /g, ' '));

          const tagMatch = item.tags.some((tagId) => {
            const allNamesForTag = tagIdToNamesMap.get(tagId) || [];
            return allNamesForTag.some((tagName) =>
              segmentVariations.some((variation) => tagName.includes(variation))
            );
          });

          if (tagMatch) return true;

          if (itemText.includes(normalizedSegment) || itemId.includes(normalizedSegment))
            return true;

          const andTerms = segment.split(/\s+/).filter(Boolean);
          if (andTerms.length > 1 || andTerms.some((t) => t.startsWith('+') || t.startsWith('-'))) {
            const termCounts: Record<string, number> = {};
            const excludeTerms: string[] = [];

            andTerms.forEach((term) => {
              if (term.startsWith('-')) excludeTerms.push(term.substring(1).toLowerCase());
              else {
                const keyword = (term.startsWith('+') ? term.substring(1) : term).toLowerCase();
                termCounts[keyword] = (termCounts[keyword] ?? 0) + 1;
              }
            });

            const passesInclude = Object.entries(termCounts).every(([term, count]) => {
              const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(escapedTerm, 'g');
              const matches = itemText.match(regex);
              return matches ? matches.length >= count : false;
            });

            const passesExclude = !excludeTerms.some((term) => itemText.includes(term));

            if (passesInclude && passesExclude) return true;
          }

          return false;
        });
      });
    }

    // 篩選已標記 / 未標記項目
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
    selectedCategory,
    filterTag,
    filterCheckedStatus,
    checkedKaomojiIds,
    processedSearchTerm,
    excludeTags,
    excludeCategories,
    tagIdToNamesMap,
  ]);
}
