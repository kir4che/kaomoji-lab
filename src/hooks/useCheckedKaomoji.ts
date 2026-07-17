'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { getCheckedKaomojiIds, saveCheckedKaomojiIds } from '@/services/adminService';

const CHECKED_STORAGE_KEY = 'checkedKaomojiIds';

// 管理「已檢查」狀態：瀏覽器端即時回應，同時同步到後端檔案儲存。
export const useCheckedKaomoji = () => {
  const { showToast } = useToast();
  const [checkedKaomojiIds, setCheckedKaomojiIds] = useState<Set<string>>(new Set());
  const loadErrorNotifiedRef = useRef(false);
  const persistErrorNotifiedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isCancelled = false;

    const hydrateFromLocalStorage = () => {
      // 先載入瀏覽器端的 localStorage，讓 UI 在後端同步完成前就有資料可用。
      try {
        const stored = window.localStorage.getItem(CHECKED_STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validIds = parsed.filter((id: unknown): id is string => typeof id === 'string');
          if (!isCancelled) setCheckedKaomojiIds(new Set(validIds));
        }
      } catch {
        window.localStorage.removeItem(CHECKED_STORAGE_KEY);
        if (!loadErrorNotifiedRef.current) {
          loadErrorNotifiedRef.current = true;
          showToast('載入檢查狀態時發生錯誤，已重設清單。', 'info');
        }
      }
    };

    hydrateFromLocalStorage();

    getCheckedKaomojiIds()
      .then((ids) => {
        if (isCancelled || !Array.isArray(ids)) return;
        const validIds = ids.filter((id: unknown): id is string => typeof id === 'string');
        if (!isCancelled) {
          setCheckedKaomojiIds(new Set(validIds));
          window.localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(validIds));
        }
      })
      .catch((err) => {
        if (isCancelled || loadErrorNotifiedRef.current) return;
        if (err instanceof Error && err.message === 'Checked kaomoji persistence disabled') return;
        loadErrorNotifiedRef.current = true;
        showToast('無法讀取本機檔案中的檢查狀態，已使用瀏覽器的資料。', 'info');
      });

    return () => {
      isCancelled = true;
    };
  }, [showToast]);

  const persistCheckedKaomojiIds = useCallback(
    async (ids: Set<string>) => {
      if (typeof window !== 'undefined') {
        const idsArray = Array.from(ids);
        window.localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(idsArray));

        try {
          await saveCheckedKaomojiIds(idsArray);
          persistErrorNotifiedRef.current = false;
        } catch (err) {
          if (err instanceof Error && err.message === 'Checked kaomoji persistence disabled')
            return;

          if (!persistErrorNotifiedRef.current) {
            persistErrorNotifiedRef.current = true;
            showToast('儲存檢查狀態到本機檔案時發生錯誤，只會保留瀏覽器資料。', 'error');
          }
        }
      }
    },
    [showToast]
  );

  const toggleKaomojiChecked = useCallback(
    (kaomojiId: string) => {
      setCheckedKaomojiIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(kaomojiId)) newSet.delete(kaomojiId);
        else newSet.add(kaomojiId);

        persistCheckedKaomojiIds(newSet);
        return newSet;
      });
    },
    [persistCheckedKaomojiIds]
  );

  const remapCheckedIds = useCallback((prev: Set<string>, idMapping: Map<string, string>) => {
    if (idMapping.size === 0) return prev;

    // 移動或批量移動會重新指派 ID，「已檢查」狀態要跟著新 ID 走。
    const newSet = new Set(prev);
    for (const [oldId, newId] of idMapping.entries()) {
      if (newSet.has(oldId)) {
        newSet.delete(oldId);
        newSet.add(newId);
      }
    }
    return newSet;
  }, []);

  const updateCheckedIdsWithMapping = useCallback(
    (idMapping?: Map<string, string>) => {
      if (!idMapping || idMapping.size === 0) return;
      setCheckedKaomojiIds((prev) => {
        const mapped = remapCheckedIds(prev, idMapping);
        persistCheckedKaomojiIds(mapped);
        return mapped;
      });
    },
    [persistCheckedKaomojiIds, remapCheckedIds]
  );

  return {
    checkedKaomojiIds,
    toggleKaomojiChecked,
    persistCheckedKaomojiIds,
    updateCheckedIdsWithMapping,
  };
};
