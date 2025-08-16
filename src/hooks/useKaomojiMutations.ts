'use client';

import { useCallback, useState } from 'react';

import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import * as adminService from '@/services/adminService';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const generateNextKaomojiId = (category: CategoryData) => {
  const maxId = Math.max(
    0,
    ...category.items
      .map((item) => parseInt(item.id.split('_')[1] || '0', 10))
      .filter((n) => !isNaN(n))
  );
  return `${category.id}_${String(maxId + 1).padStart(3, '0')}`;
};

interface UseKaomojiMutationsParams {
  categories: CategoryData[];
  onDataChange: (updatedCategories: CategoryData[]) => void;
  setCategories: React.Dispatch<React.SetStateAction<CategoryData[]>>;
  kaomojiToCategoryMap: Map<string, string>;
}

export function useKaomojiMutations({
  categories,
  onDataChange,
  setCategories,
  kaomojiToCategoryMap,
}: UseKaomojiMutationsParams) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const updateCategoryData = useCallback(
    async (categoryName: string, updatedData: Partial<CategoryData>, showError = true) => {
      const originalCategories = categories;
      const updatedCategories = categories.map((cat) =>
        cat.id === categoryName ? { ...cat, ...updatedData } : cat
      );
      setCategories(updatedCategories);
      onDataChange(updatedCategories);

      try {
        await adminService.updateCategoryItems(categoryName, updatedData);
      } catch (err) {
        if (showError) {
          const errMsg = err instanceof Error ? err.message : '更新時發生未知錯誤！';
          showToast(errMsg, 'error');
        }
        setCategories(originalCategories);
        onDataChange(originalCategories);
        throw err;
      }
    },
    [categories, onDataChange, setCategories, showToast]
  );

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
      if (category.items.some((item) => item.id === newId)) {
        showToast(`ID 衝突！${newId} 已存在。`, 'error');
        return null;
      }
      const newKaomoji: KaomojiItem = { ...kaomoji, id: newId };
      const updatedItems = [...category.items, newKaomoji];
      await updateCategoryData(categoryName, {
        items: updatedItems,
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

      const optimisticCategories = categories.map((cat) =>
        cat.id === categoryName
          ? { ...cat, items: updatedItems, lastUpdated: getTodayDateString() }
          : cat
      );
      setCategories(optimisticCategories);
      onDataChange(optimisticCategories);

      try {
        await adminService.updateCategoryItems(categoryName, {
          items: updatedItems,
          lastUpdated: getTodayDateString(),
        });

        const updatedKaomoji = updatedItems.find((item) => item.id === kaomojiId);
        return updatedKaomoji || null;
      } catch (err) {
        setCategories(categories);
        onDataChange(categories);
        const errMsg = err instanceof Error ? err.message : '更新時發生未知錯誤！';
        showToast(errMsg, 'error');
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
      const updatedItems = category.items.filter((item) => item.id !== kaomojiId);
      await updateCategoryData(categoryName, {
        items: updatedItems,
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
        return null;
      }

      const updatedFromItems = fromCategory.items.filter((item) => item.id !== kaomojiToMove.id);
      const newId = generateNextKaomojiId(toCategory);
      const newKaomoji: KaomojiItem = { ...kaomojiToMove, id: newId };
      const updatedToItems = [...toCategory.items, newKaomoji];

      const updatedCategories = categories.map((cat) => {
        if (cat.id === fromCategoryId) {
          return { ...cat, items: updatedFromItems, lastUpdated: getTodayDateString() };
        }
        if (cat.id === toCategoryId) {
          return { ...cat, items: updatedToItems, lastUpdated: getTodayDateString() };
        }
        return cat;
      });

      const originalCategories = categories;

      try {
        setCategories(updatedCategories);
        onDataChange(updatedCategories);

        await adminService.updateCategoryItems(fromCategoryId, {
          items: updatedFromItems,
          lastUpdated: getTodayDateString(),
        });
        await adminService.updateCategoryItems(toCategoryId, {
          items: updatedToItems,
          lastUpdated: getTodayDateString(),
        });

        showToast(`顏文字「${kaomojiToMove.text}」已成功移動！`, 'success');
        return newKaomoji;
      } catch {
        showToast('移動時發生錯誤！', 'error');
        setCategories(originalCategories);
        onDataChange(originalCategories);
        return null;
      }
    },
    [categories, showToast, setCategories, onDataChange]
  );

  const handleBulkAction = useCallback(
    async (selectedKaomojiIds: Set<string>, action: (items: KaomojiItem[]) => Promise<void>) => {
      setIsLoading(true);
      try {
        const allKaomoji = categories.flatMap((c) => c.items);
        const items = allKaomoji.filter((k) => selectedKaomojiIds.has(k.id));
        if (items.length === 0) {
          showToast('請先選擇顏文字！', 'error');
          return;
        }
        await action(items);
      } finally {
        setIsLoading(false);
      }
    },
    [categories, showToast]
  );

  const getCategorizedUpdatesForTagging = useCallback(
    (items: KaomojiItem[]) => {
      const updates = new Map<string, KaomojiItem[]>();
      items.forEach((item) => {
        const catId = kaomojiToCategoryMap.get(item.id)!;
        if (!updates.has(catId)) {
          const originalItems = categories.find((c) => c.id === catId)?.items || [];
          updates.set(catId, JSON.parse(JSON.stringify(originalItems)));
        }
      });
      return updates;
    },
    [categories, kaomojiToCategoryMap]
  );

  const handleBulkDelete = useCallback(
    (selectedKaomojiIds: Set<string>) =>
      handleBulkAction(selectedKaomojiIds, async (items) => {
        if (!window.confirm(`確定要刪除選中的 ${items.length} 個顏文字嗎？`)) return;

        const updatesByCat = new Map<string, KaomojiItem[]>();
        const idsToDeleteByCat = new Map<string, Set<string>>();

        items.forEach((item) => {
          const catId = kaomojiToCategoryMap.get(item.id);
          if (catId) {
            if (!idsToDeleteByCat.has(catId)) idsToDeleteByCat.set(catId, new Set());
            idsToDeleteByCat.get(catId)!.add(item.id);
          }
        });

        idsToDeleteByCat.forEach((idsToDelete, catId) => {
          const originalItems = categories.find((c) => c.id === catId)!.items;
          updatesByCat.set(
            catId,
            originalItems.filter((item) => !idsToDelete.has(item.id))
          );
        });

        const updatePromises = Array.from(updatesByCat.entries()).map(([catId, updatedItems]) =>
          updateCategoryData(
            catId,
            { items: updatedItems, lastUpdated: getTodayDateString() },
            false
          )
        );

        try {
          await Promise.all(updatePromises);
          showToast(`成功刪除 ${items.length} 個顏文字！`, 'success');
        } catch {
          showToast('批量刪除時發生錯誤', 'error');
        }
      }),
    [handleBulkAction, kaomojiToCategoryMap, categories, updateCategoryData, showToast]
  );

  const handleBulkMove = useCallback(
    (selectedKaomojiIds: Set<string>, targetCategoryId: string) =>
      handleBulkAction(selectedKaomojiIds, async (items) => {
        const targetCategory = categories.find((c) => c.id === targetCategoryId);
        if (
          !targetCategory ||
          !window.confirm(
            `確定要將選中的 ${items.length} 個顏文字移動到「${targetCategory.name['zh-tw']}」嗎？`
          )
        )
          return;

        const originalCategories = JSON.parse(JSON.stringify(categories));
        const updates = new Map<string, KaomojiItem[]>();
        const itemsToMoveByCat = new Map<string, KaomojiItem[]>();

        items.forEach((item) => {
          const fromId = kaomojiToCategoryMap.get(item.id)!;
          if (fromId !== targetCategoryId) {
            if (!itemsToMoveByCat.has(fromId)) itemsToMoveByCat.set(fromId, []);
            itemsToMoveByCat.get(fromId)!.push(item);
          }
        });

        itemsToMoveByCat.forEach((itemsInCat, fromId) => {
          const fromCat = categories.find((c) => c.id === fromId)!;
          const idsToMove = new Set(itemsInCat.map((i) => i.id));
          updates.set(
            fromId,
            fromCat.items.filter((i) => !idsToMove.has(i.id))
          );
        });

        const newItemsInTarget = [...targetCategory.items];
        let nextIdCounter =
          Math.max(
            0,
            ...newItemsInTarget
              .map((item) => parseInt(item.id.split('_')[1] || '0'))
              .filter((n) => !isNaN(n))
          ) + 1;

        for (const item of items) {
          if (kaomojiToCategoryMap.get(item.id) !== targetCategoryId) {
            newItemsInTarget.push({
              ...item,
              id: `${targetCategoryId}_${String(nextIdCounter++).padStart(3, '0')}`,
            });
          }
        }
        updates.set(targetCategoryId, newItemsInTarget);

        const updatedCategories = categories.map((cat) => {
          if (updates.has(cat.id))
            return {
              ...cat,
              items: updates.get(cat.id)!,
              lastUpdated: getTodayDateString(),
            };
          return cat;
        });

        setCategories(updatedCategories);
        onDataChange(updatedCategories);

        const apiCalls = Array.from(updates.keys()).map((catId) =>
          adminService.updateCategoryItems(catId, {
            items: updates.get(catId)!,
            lastUpdated: getTodayDateString(),
          })
        );

        try {
          await Promise.all(apiCalls);
          showToast(`成功移動 ${items.length} 個顏文字！`, 'success');
        } catch {
          showToast('批量移動時發生未知錯誤！', 'error');
          setCategories(originalCategories);
          onDataChange(originalCategories);
        }
      }),
    [handleBulkAction, categories, kaomojiToCategoryMap, onDataChange, setCategories, showToast]
  );

  const bulkUpdateTags = useCallback(
    async (
      selectedKaomojiIds: Set<string>,
      items: KaomojiItem[],
      tags: string,
      mode: 'add' | 'remove'
    ) => {
      const tagsToProcess = tags
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagsToProcess.length === 0) {
        showToast(`請輸入要${mode === 'add' ? '新增' : '移除'}的標籤！`, 'error');
        return;
      }

      const updates = getCategorizedUpdatesForTagging(items);
      updates.forEach((currentItems, catId) => {
        const updatedItems = currentItems.map((item) => {
          if (selectedKaomojiIds.has(item.id)) {
            const itemTags = new Set(item.tags);
            if (mode === 'add') {
              tagsToProcess.forEach((tag) => itemTags.add(tag));
            } else {
              tagsToProcess.forEach((tag) => itemTags.delete(tag));
            }
            return { ...item, tags: Array.from(itemTags).sort() };
          }
          return item;
        });
        updates.set(catId, updatedItems);
      });

      const updatePromises = Array.from(updates.entries()).map(([catId, updatedItems]) =>
        updateCategoryData(catId, { items: updatedItems, lastUpdated: getTodayDateString() }, false)
      );

      try {
        await Promise.all(updatePromises);
        showToast(
          `成功為 ${items.length} 個顏文字${mode === 'add' ? '新增' : '移除'}標籤！`,
          'success'
        );
      } catch {
        showToast('批次標籤更新時發生錯誤', 'error');
      }
    },
    [getCategorizedUpdatesForTagging, showToast, updateCategoryData]
  );

  const handleBulkAddTags = useCallback(
    (selectedKaomojiIds: Set<string>, tagsToAdd: string) =>
      handleBulkAction(selectedKaomojiIds, (items) =>
        bulkUpdateTags(selectedKaomojiIds, items, tagsToAdd, 'add')
      ),
    [handleBulkAction, bulkUpdateTags]
  );

  const handleBulkRemoveTags = useCallback(
    (selectedKaomojiIds: Set<string>, tagsToRemove: string) =>
      handleBulkAction(selectedKaomojiIds, (items) =>
        bulkUpdateTags(selectedKaomojiIds, items, tagsToRemove, 'remove')
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
}
