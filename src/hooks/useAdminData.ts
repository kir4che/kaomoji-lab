'use client';

import { useState, useEffect, useCallback } from 'react';

import type { CategoryData, IndexData } from '@/types/Kaomoji';
import { normalizeTemporaryCategory } from '@/utils/tempCategory';
import { getTodayDateString } from '@/utils/date';
import {
  normalizePlans,
  computeDuplicateCleanup,
  computeCategoryItemRemoval,
} from '@/utils/duplicateCleanup';
import type { DuplicateCleanupPlan } from '@/utils/kaomojiDuplicates';
import { useToast } from '@/contexts/ToastContext';
import * as adminService from '@/services/adminService';

export const useAdminData = () => {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('kaomoji');

  const allKaomoji = categories.flatMap((c) => c.items);

  const loadData = useCallback(
    async (forceReload = false) => {
      if (!forceReload && categories.length > 0 && indexData) return;

      try {
        setIsLoading(true);
        const cacheBuster = Date.now().toString();

        const idxRes = await fetch(`/data/index.json?cb=${cacheBuster}`, { cache: 'no-store' });
        if (!idxRes.ok) throw new Error('無法載入索引資料！');
        const idxData: IndexData = await idxRes.json();
        setIndexData(idxData);

        const catData = await Promise.all(
          idxData.categories.map(async (cat) => {
            const res = await fetch(`/data/categories/${cat.id}.json?cb=${cacheBuster}`, {
              cache: 'no-store',
            });
            if (!res.ok) throw new Error(`無法載入分類：${cat.id}！`);
            return res.json() as Promise<CategoryData>;
          })
        );

        try {
          const tempRes = await fetch(`/api/admin/temporary-category?cb=${cacheBuster}`, {
            cache: 'no-store',
          });
          if (tempRes.ok) {
            const tempData = await tempRes.json();
            catData.push(normalizeTemporaryCategory(tempData));
          }
        } catch {
          // 暫存分類載入失敗不影響主流程
        }

        setCategories(catData);
      } catch (err) {
        showToast(err instanceof Error ? err.message : '載入時發生未知錯誤！', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, categories.length, indexData]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 從 DuplicateKaomojiManager 來的批量刪除
  const handleBulkDelete = useCallback(
    async (kaomojiIds: Set<string>): Promise<void | null> => {
      try {
        const itemsToDelete = allKaomoji.filter((k) => kaomojiIds.has(k.id));
        if (itemsToDelete.length === 0) {
          showToast('沒有找到要刪除的顏文字', 'error');
          return null;
        }
        if (!window.confirm(`確定要刪除選中的 ${itemsToDelete.length} 個顏文字嗎？`)) return null;

        const { deletedCount, updatedCategories, updatesByCategory } = computeCategoryItemRemoval(
          categories,
          kaomojiIds
        );

        setCategories(updatedCategories);

        await Promise.all(
          Array.from(updatesByCategory.entries()).map(([catId, items]) =>
            adminService.updateCategoryItems(catId, { items, lastUpdated: getTodayDateString() })
          )
        );

        showToast(`成功刪除 ${deletedCount} 個顏文字！`, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : '批量刪除失敗', 'error');
        await loadData(true);
        throw err;
      }
    },
    [allKaomoji, categories, showToast, loadData]
  );

  // 智慧清理重複：標籤合併後刪除
  const handleSmartDuplicateCleanup = useCallback(
    async (plans: DuplicateCleanupPlan[]): Promise<void | null> => {
      const cleanupPlans = normalizePlans(plans);
      const allDupIds = new Set(cleanupPlans.flatMap((p) => p.duplicateIds));
      if (allDupIds.size === 0) {
        showToast('沒有可清理的安全重複顏文字', 'info');
        return null;
      }
      if (
        !window.confirm(
          `確定要智慧清理 ${allDupIds.size} 個重複顏文字嗎？會先把標籤合併到保留項目。`
        )
      )
        return null;

      const original = categories;
      const { duplicateIds, updatesByCategory, updatedCategories } = computeDuplicateCleanup(
        categories,
        cleanupPlans
      );

      if (updatesByCategory.size === 0) {
        showToast('沒有找到要清理的顏文字', 'error');
        return null;
      }

      setCategories(updatedCategories);

      try {
        await Promise.all(
          Array.from(updatesByCategory.entries()).map(([catId, items]) =>
            adminService.updateCategoryItems(catId, { items, lastUpdated: getTodayDateString() })
          )
        );
        showToast(`成功智慧清理 ${duplicateIds.size} 個重複顏文字！`, 'success');
      } catch (err) {
        setCategories(original);
        showToast(err instanceof Error ? err.message : '智慧清理失敗', 'error');
        await loadData(true);
        throw err;
      }
    },
    [categories, showToast, loadData]
  );

  return {
    isLoading,
    categories,
    setCategories,
    indexData,
    activeTab,
    setActiveTab,
    allKaomoji,
    loadData,
    handleBulkDelete,
    handleSmartDuplicateCleanup,
  };
};
