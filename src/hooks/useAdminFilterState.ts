'use client';

import { useMemo, useState } from 'react';

import type { CategoryData, IndexData } from '@/types/Kaomoji';

interface UseAdminFilterStateParams {
  categories: CategoryData[];
  indexData: IndexData;
  checkedKaomojiIds: Set<string>;
}

export const useAdminFilterState = ({
  categories,
  indexData,
  checkedKaomojiIds,
}: UseAdminFilterStateParams) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'or' | 'and'>('and');
  const [checkedStatusFilters, setCheckedStatusFilters] = useState<Set<'checked' | 'unchecked'>>(
    () => new Set(['unchecked']) // 預設只看「未檢查」
  );
  const [tagsToAdd, setTagsToAdd] = useState('');

  const filterCheckedStatus = useMemo<'all' | 'checked' | 'unchecked'>(() => {
    if (checkedStatusFilters.size === 0 || checkedStatusFilters.size === 2) return 'all';
    if (checkedStatusFilters.has('checked')) return 'checked';
    return 'unchecked';
  }, [checkedStatusFilters]);

  const tagNameMap = useMemo(() => {
    const map = new Map<string, string>();
    indexData.tags.forEach((tag) => {
      if (tag?.id) map.set(tag.id, tag.name?.['zh-tw'] || tag.name?.en || tag.id);
    });
    return map;
  }, [indexData.tags]);

  const kaomojiToCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      for (const item of category.items) map.set(item.id, category.id);
    }
    return map;
  }, [categories]);

  // 把所有分類的顏文字合併成一個陣列，方便做全文搜尋。
  const allKaomoji = useMemo(() => categories.flatMap((c) => c.items), [categories]);

  // 計算每個標籤在當前篩選範圍內出現幾次，若有選分類就只看該分類；沒選就看所有顏文字。
  // 結果依顯示名稱排序，讓標籤下拉選單好閱讀。
  const tagsWithCounts = useMemo(() => {
    // 決定要看哪一組顏文字
    const itemsToProcess = selectedCategory
      ? categories.find((c) => c.id === selectedCategory)?.items || []
      : allKaomoji;

    // 用 reduce 統計每個 tag 的出現次數
    const counts = itemsToProcess.reduce((acc, item) => {
      item.tags.forEach((tag) => acc.set(tag, (acc.get(tag) || 0) + 1));
      return acc;
    }, new Map<string, number>());

    // 轉成陣列、加上顯示名稱、排序
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count, label: tagNameMap.get(tag) || tag }))
      .sort((a, b) => a.label.localeCompare(b.label, 'zh-TW'));
  }, [allKaomoji, categories, selectedCategory, tagNameMap]);

  // 已檢查數量（顯示在 UI 上讓使用者知道進度）
  const checkedCount = useMemo(() => {
    const items = selectedCategory
      ? categories.find((c) => c.id === selectedCategory)?.items || []
      : allKaomoji;
    return items.filter((item) => checkedKaomojiIds.has(item.id)).length;
  }, [selectedCategory, categories, checkedKaomojiIds, allKaomoji]);

  // 未檢查數量
  const uncheckedCount = useMemo(() => {
    const items = selectedCategory
      ? categories.find((c) => c.id === selectedCategory)?.items || []
      : allKaomoji;
    return items.filter((item) => !checkedKaomojiIds.has(item.id)).length;
  }, [selectedCategory, categories, checkedKaomojiIds, allKaomoji]);

  // 切換「已檢查 / 未檢查」篩選按鈕的開關
  const toggleStatusFilter = (status: 'checked' | 'unchecked') => {
    setCheckedStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  // 重置所有篩選條件
  const handleResetCrossViewSelection = () => {
    setSelectedCategory('');
    setFilterTags([]);
    setCheckedStatusFilters(new Set(['unchecked']));
  };

  return {
    // state
    selectedCategory,
    setSelectedCategory,
    filterTags,
    setFilterTags,
    filterMode,
    setFilterMode,
    checkedStatusFilters,
    setCheckedStatusFilters,
    toggleStatusFilter,
    tagsToAdd,
    setTagsToAdd,
    // computed
    filterCheckedStatus,
    tagNameMap,
    kaomojiToCategoryMap,
    allKaomoji,
    tagsWithCounts,
    checkedCount,
    uncheckedCount,
    // actions
    handleResetCrossViewSelection,
  };
};
