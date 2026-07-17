import { useMemo } from 'react';

import type { KaomojiItem, CategoryData, Tag } from '@/types/Kaomoji';
import { useAllTags } from '@/hooks/useAllTags';

const isDev = process.env.NODE_ENV === 'development';
const EMPTY_CHECKED_KAOMOJI_IDS = new Set<string>();

interface UseFilteredKaomojiParams {
  sourceKaomojis: KaomojiItem[];
  allCategories?: CategoryData[];
  searchTerm?: string;
  selectedCategory?: string;
  filterTag?: string | string[];
  filterMode?: 'or' | 'and';
  filterCheckedStatus?: 'all' | 'checked' | 'unchecked';
  checkedKaomojiIds?: Set<string>;
  allTags?: Tag[];
}

const normalize = (value: string) =>
  value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

// 建立 tag id → 各種名稱寫法 的對照表，讓搜尋時不管輸入「happy」「Happy」「holding-hands」「holding hands」都能找到對應的標籤。
const buildTagIdToNamesMap = (allTags: Tag[]) => {
  const tagIdToNamesMap = new Map<string, string[]>();

  allTags.forEach((tag) => {
    if (!tag.id || !tag.name) return;
    const names: string[] = [];

    const addName = (name: string) => {
      const n = normalize(name);
      names.push(name, n);
      // 空格和連字號互換，讓「holding-hands」也能搜到「holding hands」
      if (name.includes(' ')) names.push(name.replace(/ /g, '-').toLowerCase());
      else if (name.includes('-')) names.push(name.replace(/-/g, ' ').toLowerCase());
    };

    if (tag.name.en) addName(tag.name.en);
    if (tag.name['zh-tw']) addName(tag.name['zh-tw']);

    tagIdToNamesMap.set(tag.id, names);
  });

  return tagIdToNamesMap;
};

// 檢查顏文字的標籤名稱是否包含搜尋詞
const matchesTagName = (tagIds: string[], query: string, map: Map<string, string[]>) =>
  tagIds.some((id) => (map.get(id) || []).some((name) => name.includes(query)));

// 解析搜尋詞，支援多個詞 = AND，+term = 計數，-term = 排除。
const matchesAndTerms = (text: string, segment: string): boolean => {
  const terms = segment.split(/\s+/).filter(Boolean);
  const termCounts: Record<string, number> = {};
  const excludeTerms: string[] = [];

  terms.forEach((term) => {
    if (term.startsWith('-')) {
      excludeTerms.push(term.slice(1).toLowerCase());
    } else {
      const keyword = (term.startsWith('+') ? term.slice(1) : term).toLowerCase();
      termCounts[keyword] = (termCounts[keyword] ?? 0) + 1;
    }
  });

  // 每個關鍵詞在顏文字中出現次數要夠
  const passesInclude = Object.entries(termCounts).every(([term, count]) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = text.match(new RegExp(escaped, 'g'));
    return matches ? matches.length >= count : false;
  });
  if (!passesInclude) return false;

  // 不能包含被排除的詞
  return !excludeTerms.some((t) => text.includes(t));
};

// 檢查顏文字是否符合搜尋詞的條件
const matchesSegment = (
  text: string,
  tags: string[],
  id: string,
  segment: string,
  map: Map<string, string[]>
): boolean => {
  const q = segment.toLowerCase();

  // 先檢查最簡單的：標籤名稱或顏文字內容直接包含搜尋詞
  if (matchesTagName(tags, q, map)) return true;
  if (text.includes(q) || id.includes(q)) return true;

  // 若搜尋詞包含空格/連字號，把兩種寫法都試試。
  const qVariants = [q];
  if (q.includes(' ')) qVariants.push(q.replace(/ /g, '-'));
  else if (q.includes('-')) qVariants.push(q.replace(/-/g, ' '));

  for (const v of qVariants) {
    if (matchesTagName(tags, v, map)) return true;
    if (text.includes(v) || id.includes(v)) return true;
  }

  // 進階搜尋：多個詞 = AND，+term = 計數，-term = 排除。
  if (segment.includes(' ') || segment.startsWith('+') || segment.startsWith('-'))
    return matchesAndTerms(text, segment);

  return false;
};

// 對顏文字列表套用分類、標籤、檢查狀態與進階搜尋篩選
export const useFilteredKaomoji = ({
  sourceKaomojis,
  allCategories,
  searchTerm = '',
  selectedCategory = '',
  filterTag = '',
  filterMode = 'and',
  filterCheckedStatus = 'all',
  checkedKaomojiIds = EMPTY_CHECKED_KAOMOJI_IDS,
  allTags: providedAllTags,
}: UseFilteredKaomojiParams) => {
  const { tags: fetchedAllTags } = useAllTags(providedAllTags === undefined);
  const allTags = providedAllTags ?? fetchedAllTags;

  const tagIdToNamesMap = useMemo(() => buildTagIdToNamesMap(allTags), [allTags]);

  const { processedSearchTerm, excludeTags, excludeCategories } = useMemo(() => {
    let currentSearchTerm = searchTerm;
    const newExcludeTags: string[] = [];
    const newExcludeCategories: string[] = [];

    if (isDev) {
      // 開發模式：用「-tag:xxx」或「-cat:xxx」排除特定標籤/分類
      currentSearchTerm = searchTerm.replace(/-(?:tag|cat):(\S+)/gi, (match, value) => {
        if (match.toLowerCase().startsWith('-tag:')) newExcludeTags.push(value.toLowerCase());
        else if (match.toLowerCase().startsWith('-cat:'))
          newExcludeCategories.push(value.toLowerCase());
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
    const tagMatches = (tags: string[], targetTag: string): boolean =>
      tags.some((tag) => normalize(tag) === targetTag.trim().toLowerCase());

    // 1. 選取分類
    let items: KaomojiItem[] =
      selectedCategory && allCategories
        ? (allCategories.find((c) => c.id === selectedCategory)?.items ?? [])
        : sourceKaomojis;

    // 2. 篩選標籤（AND / OR）
    if (filterTag) {
      const fTags = Array.isArray(filterTag) ? filterTag : [filterTag];
      if (fTags.length > 0) {
        const matchFn = filterMode === 'and' ? 'every' : 'some';
        items = items.filter((item) => fTags[matchFn]((tag) => tagMatches(item.tags, tag)));
      }
    }

    // 3. 開發模式專用排除
    if (isDev) {
      if (excludeTags.length > 0)
        items = items.filter((item) => !excludeTags.some((t) => tagMatches(item.tags, t)));

      if (excludeCategories.length > 0 && allCategories) {
        items = items.filter((item) => {
          const catNames = allCategories
            .filter((c) => c.items.some((i) => i.id === item.id))
            .flatMap((c) => Object.values(c.name).map((n) => n.toLowerCase()));
          return !excludeCategories.some((ec) => catNames.includes(ec));
        });
      }
    }

    // 4. 文字搜尋（支援 | OR、空格 AND、-排除、+計數）
    const trimmedSearchTerm = processedSearchTerm.trim().toLowerCase();
    if (trimmedSearchTerm) {
      // 用 | 分隔多個 OR 條件
      const orSegments = trimmedSearchTerm
        .split(/(?<![\\|])\|(?![|\\])/)
        .map((s) => s.trim())
        .filter(Boolean);

      items = items.filter((item) =>
        orSegments.some((seg) =>
          matchesSegment(
            item.text.toLowerCase(),
            item.tags,
            item.id.toLowerCase(),
            seg,
            tagIdToNamesMap
          )
        )
      );
    }

    // 5. 篩選已標記 / 未標記
    if (filterCheckedStatus !== 'all') {
      items = items.filter((item) =>
        filterCheckedStatus === 'checked'
          ? checkedKaomojiIds.has(item.id)
          : !checkedKaomojiIds.has(item.id)
      );
    }

    return items;
  }, [
    sourceKaomojis,
    allCategories,
    selectedCategory,
    filterTag,
    filterMode,
    filterCheckedStatus,
    checkedKaomojiIds,
    processedSearchTerm,
    excludeTags,
    excludeCategories,
    tagIdToNamesMap,
  ]);
};
