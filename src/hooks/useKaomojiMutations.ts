'use client';

import { useCallback, useMemo, useState } from 'react';

import type { KaomojiItem, CategoryData, Tag } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import * as adminService from '@/services/adminService';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const sanitizeTagToken = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/^[\s"'`“”‘’「」『』《》〈〉﹁﹂﹃﹄()（）\[\]{}【】<>]+/, '')
    .replace(/[\s"'`“”‘’「」『』《》〈〉﹁﹂﹃﹄()（）\[\]{}【】<>]+$/, '')
    .trim();

interface BulkTagUpdateResult {
  updatedItemCount: number;
  skippedForDuplicate: number;
}

const generateNextKaomojiId = (category: CategoryData) => {
  const maxId = Math.max(
    0,
    ...category.items
      .map((item) => {
        const segments = item.id.split('_');
        const lastSegment = segments[segments.length - 1] || '0';
        return parseInt(lastSegment, 10);
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

export function useKaomojiMutations({
  categories,
  onDataChange,
  setCategories,
  kaomojiToCategoryMap,
  availableTags = [],
}: UseKaomojiMutationsParams) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const normalizeTag = useCallback((tag: string) => {
    return tag.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  }, []);

  const tagLookup = useMemo(() => {
    const map = new Map<string, string>();

    availableTags.forEach((tag) => {
      const candidates = [tag.id, tag.name?.en, tag.name?.['zh-tw']].filter(
        (value): value is string => Boolean(value)
      );

      candidates.forEach((value) => {
        const normalized = normalizeTag(value);
        if (!normalized) return;
        if (!map.has(normalized)) map.set(normalized, tag.id);
      });
    });

    return map;
  }, [availableTags, normalizeTag]);

  const tagSynonymMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    availableTags.forEach((tag) => {
      if (!tag?.id) return;
      const synonyms = new Set<string>();
      synonyms.add(tag.id.trim());
      if (tag.name?.en) synonyms.add(tag.name.en.trim());
      if (tag.name?.['zh-tw']) synonyms.add(tag.name['zh-tw'].trim());
      map.set(tag.id, synonyms);
    });

    return map;
  }, [availableTags]);

  const resolveTagId = useCallback(
    (tagInput: string) => {
      const normalized = normalizeTag(tagInput);
      if (!normalized) return '';
      return tagLookup.get(normalized) ?? tagInput.trim();
    },
    [normalizeTag, tagLookup]
  );

  const updateCategoryData = useCallback(
    async (categoryName: string, updatedData: Partial<CategoryData>, showError = true) => {
      const originalCategories = categories;
      const nextCategories = originalCategories.map((cat) =>
        cat.id === categoryName ? { ...cat, ...updatedData } : cat
      );

      const hasTargetCategory = nextCategories.some((cat) => cat.id === categoryName);
      if (!hasTargetCategory) {
        if (showError) showToast('找不到分類！', 'error');
        return;
      }

      setCategories(nextCategories);
      onDataChange(nextCategories);

      try {
        await adminService.updateCategory(categoryName, updatedData);
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
        await adminService.updateCategory(categoryName, {
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
        return { kaomoji: null, idMapping: new Map() };
      }

      const oldId = kaomojiToMove.id;
      const updatedFromItems = fromCategory.items.filter((item) => item.id !== oldId);
      const newId = generateNextKaomojiId(toCategory);
      const newKaomoji: KaomojiItem = { ...kaomojiToMove, id: newId };
      const updatedToItems = [...toCategory.items, newKaomoji];

      const idMapping = new Map<string, string>([[oldId, newId]]);

      const updatedCategories = categories.map((cat) => {
        if (cat.id === fromCategoryId)
          return { ...cat, items: updatedFromItems, lastUpdated: getTodayDateString() };
        else if (cat.id === toCategoryId)
          return { ...cat, items: updatedToItems, lastUpdated: getTodayDateString() };

        return cat;
      });

      const originalCategories = categories;

      try {
        setCategories(updatedCategories);
        onDataChange(updatedCategories);

        await adminService.updateCategory(fromCategoryId, {
          items: updatedFromItems,
          lastUpdated: getTodayDateString(),
        });
        await adminService.updateCategory(toCategoryId, {
          items: updatedToItems,
          lastUpdated: getTodayDateString(),
        });

        showToast(`顏文字「${kaomojiToMove.text}」已成功移動！`, 'success');
        return { kaomoji: newKaomoji, idMapping };
      } catch {
        showToast('移動時發生錯誤！', 'error');
        setCategories(originalCategories);
        onDataChange(originalCategories);
        return { kaomoji: null, idMapping: new Map() };
      }
    },
    [categories, showToast, setCategories, onDataChange]
  );

  const handleBulkAction = useCallback(
    async <T>(
      selectedKaomojiIds: Set<string>,
      action: (items: KaomojiItem[]) => Promise<T>
    ): Promise<T | null> => {
      setIsLoading(true);
      try {
        const allKaomoji = categories.flatMap((c) => c.items);
        const items = allKaomoji.filter((k) => selectedKaomojiIds.has(k.id));
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

        const originalCategories = categories;

        const nextCategories = originalCategories.map((category) => {
          const idsToDelete = new Set<string>();
          items.forEach((item) => {
            if (kaomojiToCategoryMap.get(item.id) === category.id) {
              idsToDelete.add(item.id);
            }
          });

          if (idsToDelete.size === 0) return category;

          const updatedItems = category.items.filter((item) => !idsToDelete.has(item.id));
          return { ...category, items: updatedItems, lastUpdated: getTodayDateString() };
        });

        setCategories(nextCategories);
        onDataChange(nextCategories);

        const updatesByCat = new Map<string, { items: KaomojiItem[]; lastUpdated: string }>();
        items.forEach((item) => {
          const catId = kaomojiToCategoryMap.get(item.id);
          if (catId) {
            if (!updatesByCat.has(catId)) {
              const updatedCategory = nextCategories.find((c) => c.id === catId)!;
              updatesByCat.set(catId, {
                items: updatedCategory.items,
                lastUpdated: updatedCategory.lastUpdated,
              });
            }
          }
        });

        const updatePromises = Array.from(updatesByCat.entries()).map(([catId, data]) =>
          adminService.updateCategory(catId, data)
        );

        try {
          await Promise.all(updatePromises);
          showToast(`成功刪除 ${items.length} 個顏文字！`, 'success');
        } catch {
          showToast('批量刪除時發生錯誤', 'error');
          setCategories(originalCategories);
          onDataChange(originalCategories);
        }
      }),
    [handleBulkAction, kaomojiToCategoryMap, categories, setCategories, onDataChange, showToast]
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
        const idMapping = new Map<string, string>();

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
            const newId = `${targetCategoryId}_${String(nextIdCounter++).padStart(3, '0')}`;
            newItemsInTarget.push({
              ...item,
              id: newId,
            });
            idMapping.set(item.id, newId);
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
          adminService.updateCategory(catId, {
            items: updates.get(catId)!,
            lastUpdated: getTodayDateString(),
          })
        );

        try {
          await Promise.all(apiCalls);
          showToast(`成功移動 ${items.length} 個顏文字！`, 'success');
          return { idMapping };
        } catch {
          showToast('批量移動時發生未知錯誤！', 'error');
          setCategories(originalCategories);
          onDataChange(originalCategories);
          return { idMapping: new Map<string, string>() };
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
    ): Promise<BulkTagUpdateResult> => {
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

      const tagsToAddMap = new Map<string, string>();
      const removalLookup = new Set<string>();

      rawInputs.forEach((input) => {
        const resolved = resolveTagId(input);
        if (resolved) {
          const normalizedResolved = normalizeTag(resolved);
          if (normalizedResolved) {
            removalLookup.add(normalizedResolved);
            const synonyms = tagSynonymMap.get(resolved);
            if (synonyms) {
              synonyms.forEach((value) => {
                const normalized = normalizeTag(value);
                if (normalized) removalLookup.add(normalized);
              });
            }
            if (mode === 'add') tagsToAddMap.set(normalizedResolved, resolved.trim());
          }
        }

        const normalizedInput = normalizeTag(input);
        if (normalizedInput) removalLookup.add(normalizedInput);
      });

      if (mode === 'add' && tagsToAddMap.size === 0) {
        showToast('找不到可新增的標籤 ID，請確認輸入內容。', 'error');
        return { updatedItemCount: 0, skippedForDuplicate: 0 };
      }

      const categorizedClones = getCategorizedUpdatesForTagging(items);
      const updatesToApply: Array<[string, KaomojiItem[]]> = [];
      let updatedItemCount = 0;

      for (const [catId, currentItems] of categorizedClones.entries()) {
        let categoryChanged = false;
        const updatedItems = currentItems.map((item) => {
          if (!selectedKaomojiIds.has(item.id)) return item;

          const tagMap = new Map<string, string>();
          item.tags
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
            .forEach((tag) => {
              const normalized = normalizeTag(tag);
              if (!normalized) return;
              if (!tagMap.has(normalized)) tagMap.set(normalized, tag);
            });

          if (mode === 'add') {
            let addedCount = 0;
            tagsToAddMap.forEach((tagId, normalizedTag) => {
              if (tagMap.has(normalizedTag)) return;
              tagMap.set(normalizedTag, tagId);
              addedCount += 1;
            });
            if (addedCount === 0) return item;
          } else {
            let removed = false;
            const keysToDelete = Array.from(tagMap.keys()).filter((key) => removalLookup.has(key));
            if (keysToDelete.length > 0) {
              removed = true;
              keysToDelete.forEach((key) => tagMap.delete(key));
            }
            if (!removed) return item;
          }

          categoryChanged = true;
          updatedItemCount += 1;
          return { ...item, tags: Array.from(tagMap.values()).sort() };
        });

        if (categoryChanged) updatesToApply.push([catId, updatedItems]);
      }

      const skippedForDuplicate = items.length - updatedItemCount;

      if (updatedItemCount === 0) {
        if (mode === 'add') {
          const message =
            skippedForDuplicate > 0
              ? '選取的顏文字都已包含這些標籤，無需新增。'
              : '沒有符合條件的顏文字可新增標籤。';
          showToast(message, 'info');
        } else showToast('沒有符合的標籤可移除。', 'info');

        return { updatedItemCount: 0, skippedForDuplicate };
      }

      const updatePromises = updatesToApply.map(([catId, updatedItems]) =>
        updateCategoryData(catId, { items: updatedItems, lastUpdated: getTodayDateString() }, false)
      );

      try {
        await Promise.all(updatePromises);
        showToast(
          `成功為 ${updatedItemCount} 個顏文字${mode === 'add' ? '新增' : '移除'}標籤！`,
          'success'
        );
        if (mode === 'add' && skippedForDuplicate > 0)
          showToast(`有 ${skippedForDuplicate} 個顏文字已擁有這些標籤，未重複新增。`, 'info');

        return { updatedItemCount, skippedForDuplicate };
      } catch (err) {
        showToast('批次標籤更新時發生錯誤！', 'error');
        throw err;
      }
    },
    [
      getCategorizedUpdatesForTagging,
      resolveTagId,
      showToast,
      updateCategoryData,
      tagSynonymMap,
      normalizeTag,
    ]
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
