'use client';

import { useCallback, useMemo, useState } from 'react';

import type { KaomojiItem, CategoryData, Tag } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import * as adminService from '@/services/adminService';
import {
  sanitizeTagToken,
  normalizeTag,
  buildTagLookup,
  buildTagSynonymMap,
} from '@/utils/tagUtils';
import { getTodayDateString } from '@/utils/date';
import {
  computeCategoryItemRemoval,
  computeTagRemovalFromSelectedKaomoji,
} from '@/utils/duplicateCleanup';

interface BulkTagUpdateResult {
  updatedItemCount: number;
  skippedForDuplicate: number;
}

// 生成下一個顏文字 ID，格式「分類ID_數字」。
const generateNextKaomojiId = (category: CategoryData) => {
  const maxId = Math.max(
    0,
    ...category.items
      .map((item) => {
        const segments = item.id.split('_');
        return parseInt(segments[segments.length - 1] || '0', 10);
      })
      .filter((n) => !Number.isNaN(n))
  );
  return `${category.id}_${String(maxId + 1).padStart(3, '0')}`;
};

interface UseKaomojiMutationsParams {
  categories: CategoryData[];
  onDataChange: (updatedCategories: CategoryData[]) => void;
  setCategories: React.Dispatch<React.SetStateAction<CategoryData[]>>;
  kaomojiToCategoryMap: Map<string, string>;
  availableTags?: Tag[];
}

export const useKaomojiMutations = ({
  categories,
  onDataChange,
  setCategories,
  kaomojiToCategoryMap,
  availableTags = [],
}: UseKaomojiMutationsParams) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const tagLookup = useMemo(() => buildTagLookup(availableTags), [availableTags]);
  const tagSynonymMap = useMemo(() => buildTagSynonymMap(availableTags), [availableTags]);

  const resolveTagId = useCallback(
    (tagInput: string) => {
      const normalized = normalizeTag(tagInput);
      if (!normalized) return '';
      return tagLookup.get(normalized) ?? tagInput.trim();
    },
    [tagLookup]
  );

  // 更新單一分類的資料
  const updateCategoryData = useCallback(
    async (categoryName: string, updatedData: Partial<CategoryData>, showError = true) => {
      const originalCategories = categories;
      const nextCategories = originalCategories.map((cat) =>
        cat.id === categoryName ? { ...cat, ...updatedData } : cat
      );
      if (!nextCategories.some((cat) => cat.id === categoryName)) {
        if (showError) showToast('找不到分類！', 'error');
        return;
      }
      // 樂觀更新：先讓 UI 看到結果
      setCategories(nextCategories);
      onDataChange(nextCategories);
      try {
        await adminService.updateCategory(categoryName, updatedData);
      } catch (err) {
        // API 失敗 → 還原
        if (showError)
          showToast(err instanceof Error ? err.message : '更新時發生未知錯誤！', 'error');
        setCategories(originalCategories);
        onDataChange(originalCategories);
        throw err;
      }
    },
    [categories, onDataChange, setCategories, showToast]
  );

  // ─── 單筆操作 ───

  const addKaomoji = useCallback(
    async (categoryName: string, kaomoji: Omit<KaomojiItem, 'id'>): Promise<KaomojiItem | null> => {
      const category = categories.find((c) => c.id === categoryName);
      if (!category) {
        showToast('找不到分類！', 'error');
        return null;
      }
      if (category.items.some((item) => item.text === kaomoji.text)) {
        showToast(`顏文字「${kaomoji.text}」已存在於此分類中！`, 'error');
        return null;
      }
      const newId = generateNextKaomojiId(category);
      const newKaomoji: KaomojiItem = { ...kaomoji, id: newId };
      await updateCategoryData(categoryName, {
        items: [...category.items, newKaomoji],
        lastUpdated: getTodayDateString(),
      });
      return newKaomoji;
    },
    [categories, showToast, updateCategoryData]
  );

  const editKaomoji = useCallback(
    async (
      categoryName: string,
      kaomojiId: string,
      updates: Partial<KaomojiItem>
    ): Promise<KaomojiItem | null> => {
      const category = categories.find((c) => c.id === categoryName);
      if (!category) {
        showToast('找不到分類！', 'error');
        return null;
      }

      const updatedItems = category.items.map((item) =>
        item.id === kaomojiId ? { ...item, ...updates } : item
      );
      const optimistic = categories.map((cat) =>
        cat.id === categoryName
          ? { ...cat, items: updatedItems, lastUpdated: getTodayDateString() }
          : cat
      );
      setCategories(optimistic);
      onDataChange(optimistic);

      try {
        await adminService.updateCategory(categoryName, {
          items: updatedItems,
          lastUpdated: getTodayDateString(),
        });
        return updatedItems.find((item) => item.id === kaomojiId) || null;
      } catch (err) {
        setCategories(categories);
        onDataChange(categories);
        showToast(err instanceof Error ? err.message : '更新時發生未知錯誤！', 'error');
        return null;
      }
    },
    [categories, setCategories, onDataChange, showToast]
  );

  const deleteKaomoji = useCallback(
    async (categoryName: string, kaomojiId: string) => {
      if (!window.confirm('確定要刪除這個顏文字嗎？')) return false;
      const category = categories.find((c) => c.id === categoryName);
      if (!category) {
        showToast(`找不到分類「${categoryName}」！`, 'error');
        return false;
      }
      await updateCategoryData(categoryName, {
        items: category.items.filter((item) => item.id !== kaomojiId),
        lastUpdated: getTodayDateString(),
      });
      return true;
    },
    [categories, showToast, updateCategoryData]
  );

  const moveKaomoji = useCallback(
    async (fromCategoryId: string, toCategoryId: string, kaomojiToMove: KaomojiItem) => {
      const fromCategory = categories.find((c) => c.id === fromCategoryId);
      const toCategory = categories.find((c) => c.id === toCategoryId);
      if (!fromCategory || !toCategory) {
        showToast('來源或目標分類不存在！', 'error');
        return { kaomoji: null, idMapping: new Map() };
      }

      const oldId = kaomojiToMove.id;
      const newId = generateNextKaomojiId(toCategory);
      const newKaomoji: KaomojiItem = { ...kaomojiToMove, id: newId };
      const idMapping = new Map<string, string>([[oldId, newId]]);
      const updatedCategories = categories.map((cat) => {
        if (cat.id === fromCategoryId)
          return {
            ...cat,
            items: cat.items.filter((i) => i.id !== oldId),
            lastUpdated: getTodayDateString(),
          };
        if (cat.id === toCategoryId)
          return {
            ...cat,
            items: [...toCategory.items, newKaomoji],
            lastUpdated: getTodayDateString(),
          };
        return cat;
      });
      const original = categories;
      setCategories(updatedCategories);
      onDataChange(updatedCategories);
      try {
        await adminService.updateCategory(fromCategoryId, {
          items: fromCategory.items.filter((i) => i.id !== oldId),
          lastUpdated: getTodayDateString(),
        });
        await adminService.updateCategory(toCategoryId, {
          items: [...toCategory.items, newKaomoji],
          lastUpdated: getTodayDateString(),
        });
        showToast(`顏文字「${kaomojiToMove.text}」已成功移動！`, 'success');
        return { kaomoji: newKaomoji, idMapping };
      } catch {
        showToast('移動時發生錯誤！', 'error');
        setCategories(original);
        onDataChange(original);
        return { kaomoji: null, idMapping: new Map() };
      }
    },
    [categories, showToast, setCategories, onDataChange]
  );

  // ─── 批量操作 ───

  const handleBulkAction = useCallback(
    async <T>(
      selectedIds: Set<string>,
      action: (items: KaomojiItem[]) => Promise<T>
    ): Promise<T | null> => {
      setIsLoading(true);
      try {
        const items = categories.flatMap((c) => c.items).filter((k) => selectedIds.has(k.id));
        if (items.length === 0) {
          showToast('請先選擇顏文字！', 'error');
          return null;
        }
        return await action(items);
      } finally {
        setIsLoading(false);
      }
    },
    [categories, showToast]
  );

  const handleBulkDelete = useCallback(
    (selectedIds: Set<string>) =>
      handleBulkAction(selectedIds, async (items) => {
        if (!window.confirm(`確定要刪除選中的 ${items.length} 個顏文字嗎？`)) return;
        const original = categories;
        const {
          deletedCount,
          updatedCategories: nextCategories,
          updatesByCategory,
        } = computeCategoryItemRemoval(categories, new Set(items.map((item) => item.id)));

        setCategories(nextCategories);
        onDataChange(nextCategories);

        try {
          await Promise.all(
            Array.from(updatesByCategory.entries()).map(([cid, updatedItems]) =>
              adminService.updateCategory(cid, {
                items: updatedItems,
                lastUpdated: getTodayDateString(),
              })
            )
          );
          showToast(`成功刪除 ${deletedCount} 個顏文字！`, 'success');
        } catch {
          showToast('批量刪除時發生錯誤', 'error');
          setCategories(original);
          onDataChange(original);
        }
      }),
    [handleBulkAction, categories, setCategories, onDataChange, showToast]
  );

  const handleBulkMove = useCallback(
    (selectedIds: Set<string>, targetCategoryId: string) =>
      handleBulkAction(selectedIds, async (items) => {
        const targetCategory = categories.find((c) => c.id === targetCategoryId);
        if (
          !targetCategory ||
          !window.confirm(
            `確定要將選中的 ${items.length} 個顏文字移動到「${targetCategory.name['zh-tw']}」嗎？`
          )
        )
          return;

        const original = JSON.parse(JSON.stringify(categories));
        const updates = new Map<string, KaomojiItem[]>();
        const idMapping = new Map<string, string>();

        // 按來源分類分組
        const byFromCat = new Map<string, KaomojiItem[]>();
        items.forEach((item) => {
          const fromId = kaomojiToCategoryMap.get(item.id);
          if (fromId && fromId !== targetCategoryId) {
            if (!byFromCat.has(fromId)) byFromCat.set(fromId, []);
            byFromCat.get(fromId)!.push(item);
          }
        });

        byFromCat.forEach((itemsInCat, fromId) => {
          const ids = new Set(itemsInCat.map((i) => i.id));
          const fromCat = categories.find((c) => c.id === fromId)!;
          updates.set(
            fromId,
            fromCat.items.filter((i) => !ids.has(i.id))
          );
        });

        const newItems = [...targetCategory.items];
        let nextId =
          Math.max(
            0,
            ...newItems.map((i) => parseInt(i.id.split('_')[1] || '0', 10)).filter((n) => !isNaN(n))
          ) + 1;
        for (const item of items) {
          if (kaomojiToCategoryMap.get(item.id) !== targetCategoryId) {
            const newKaomojiId = `${targetCategoryId}_${String(nextId++).padStart(3, '0')}`;
            newItems.push({ ...item, id: newKaomojiId });
            idMapping.set(item.id, newKaomojiId);
          }
        }
        updates.set(targetCategoryId, newItems);

        const updatedCategories = categories.map((cat) =>
          updates.has(cat.id)
            ? { ...cat, items: updates.get(cat.id)!, lastUpdated: getTodayDateString() }
            : cat
        );

        setCategories(updatedCategories);
        onDataChange(updatedCategories);

        try {
          await Promise.all(
            Array.from(updates.keys()).map((cid) =>
              adminService.updateCategory(cid, {
                items: updates.get(cid)!,
                lastUpdated: getTodayDateString(),
              })
            )
          );
          showToast(`成功移動 ${items.length} 個顏文字！`, 'success');
          return { idMapping };
        } catch {
          showToast('批量移動時發生未知錯誤！', 'error');
          setCategories(original);
          onDataChange(original);
          return { idMapping: new Map() };
        }
      }),
    [handleBulkAction, categories, kaomojiToCategoryMap, onDataChange, setCategories, showToast]
  );

  // 批量新增或移除標籤：使用者輸入「happy, cute」或「sad, angry」等文字，系統會自動比對正式 ID、別名、同義詞，然後對選中的顏文字增減標籤。
  const bulkUpdateTags = useCallback(
    async (
      selectedIds: Set<string>,
      items: KaomojiItem[],
      tags: string,
      mode: 'add' | 'remove'
    ): Promise<BulkTagUpdateResult> => {
      // 把使用者輸入的文字切開、去重、篩掉空白
      const rawInputs = Array.from(
        new Set(
          tags
            .split(/[,，、\s]+/)
            .map(sanitizeTagToken)
            .filter(Boolean)
        )
      );
      if (rawInputs.length === 0) {
        showToast(`請輸入要${mode === 'add' ? '新增' : '移除'}的標籤！`, 'error');
        return { updatedItemCount: 0, skippedForDuplicate: 0 };
      }

      // 解析每個輸入：可能是標籤 ID、英文名、中文名，全部轉成正式 ID。
      const tagsToAddMap = new Map<string, string>();
      rawInputs.forEach((input) => {
        const resolved = resolveTagId(input);
        if (resolved) {
          const nr = normalizeTag(resolved);
          if (nr) {
            if (mode === 'add') tagsToAddMap.set(nr, resolved.trim());
          }
        }
      });

      if (mode === 'add' && tagsToAddMap.size === 0) {
        showToast('找不到可新增的標籤 ID，請確認輸入內容。', 'error');
        return { updatedItemCount: 0, skippedForDuplicate: 0 };
      }

      const updatesToApply: Array<[string, KaomojiItem[]]> = [];
      let updatedItemCount = 0;

      // ─── 新增標籤 ───
      if (mode === 'add') {
        const categorizedClones = new Map<string, KaomojiItem[]>();
        items.forEach((item) => {
          const cid = kaomojiToCategoryMap.get(item.id);
          if (cid && !categorizedClones.has(cid)) {
            categorizedClones.set(
              cid,
              structuredClone(categories.find((c) => c.id === cid)?.items || [])
            );
          }
        });

        // 依分類處理：把每個被選中的顏文字加上新標籤
        for (const [catId, currentItems] of categorizedClones.entries()) {
          let categoryChanged = false;
          const updatedItems = currentItems.map((item) => {
            // 只處理被選中的顏文字
            if (!selectedIds.has(item.id)) return item;

            // 把顏文字現有的標籤轉成 Map（key=正規化名稱，value=原始 ID）
            const tagMap = new Map<string, string>();
            item.tags.forEach((tag) => {
              const n = normalizeTag(tag);
              if (n && !tagMap.has(n)) tagMap.set(n, tag);
            });

            // 把要新增的標籤加進去（若還沒有的話）
            let added = 0;
            tagsToAddMap.forEach((tid, nt) => {
              if (!tagMap.has(nt)) {
                tagMap.set(nt, tid);
                added++;
              }
            });
            // 這個顏文字已經有全部要新增的標籤了，跳過
            if (added === 0) return item;

            categoryChanged = true;
            updatedItemCount += 1;
            // 轉回陣列、排序，保持欄位一致性
            return { ...item, tags: Array.from(tagMap.values()).sort() };
          });
          if (categoryChanged) updatesToApply.push([catId, updatedItems]);
        }
      } else {
        const { updatedItemCount: removedItemCount, updatesByCategory } =
          computeTagRemovalFromSelectedKaomoji({
            categories,
            selectedKaomojiIds: selectedIds,
            tagInputs: rawInputs.map(resolveTagId),
            tagSynonymMap,
          });
        updatedItemCount = removedItemCount;
        updatesToApply.push(...updatesByCategory.entries());
      }

      const skipped = items.length - updatedItemCount;

      if (updatedItemCount === 0) {
        showToast(
          mode === 'add'
            ? skipped > 0
              ? '選取的顏文字都已包含這些標籤，無需新增。'
              : '沒有符合條件的顏文字可新增標籤。'
            : '沒有符合的標籤可移除。',
          'info'
        );
        return { updatedItemCount: 0, skippedForDuplicate: skipped };
      }

      try {
        await Promise.all(
          updatesToApply.map(([cid, updatedItems]) =>
            updateCategoryData(
              cid,
              { items: updatedItems, lastUpdated: getTodayDateString() },
              false
            )
          )
        );
        showToast(
          `成功為 ${updatedItemCount} 個顏文字${mode === 'add' ? '新增' : '移除'}標籤！`,
          'success'
        );
        if (mode === 'add' && skipped > 0)
          showToast(`有 ${skipped} 個顏文字已擁有這些標籤，未重複新增。`, 'info');
        return { updatedItemCount, skippedForDuplicate: skipped };
      } catch {
        showToast('批次標籤更新時發生錯誤！', 'error');
        return { updatedItemCount: 0, skippedForDuplicate: 0 };
      }
    },
    [kaomojiToCategoryMap, categories, resolveTagId, showToast, updateCategoryData, tagSynonymMap]
  );

  const handleBulkAddTags = useCallback(
    (selectedIds: Set<string>, tagsToAdd: string) =>
      handleBulkAction(selectedIds, (items) =>
        bulkUpdateTags(selectedIds, items, tagsToAdd, 'add')
      ),
    [handleBulkAction, bulkUpdateTags]
  );

  const handleBulkRemoveTags = useCallback(
    (selectedIds: Set<string>, tagsToRemove: string) =>
      handleBulkAction(selectedIds, (items) =>
        bulkUpdateTags(selectedIds, items, tagsToRemove, 'remove')
      ),
    [handleBulkAction, bulkUpdateTags]
  );

  return {
    isLoading,
    addKaomoji,
    editKaomoji,
    deleteKaomoji,
    moveKaomoji,
    handleBulkDelete,
    handleBulkMove,
    handleBulkAddTags,
    handleBulkRemoveTags,
  };
};
