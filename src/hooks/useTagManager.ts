'use client';

import { useReducer, useMemo, useCallback, useEffect } from 'react';

import type { KaomojiItem } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import * as adminService from '@/services/adminService';

export interface TagUsage {
  tag: string;
  count: number;
  kaomojis: Array<{ id: string; text: string; category: string }>;
}

interface UseTagManagerProps {
  allKaomoji: KaomojiItem[];
  allTags: string[];
  onDataChange: () => void;
}

interface State {
  searchTerm: string;
  sortBy: 'name' | 'count';
  sortOrder: 'asc' | 'desc';
  usageThreshold: number;
  showLowUsageOnly: boolean;
  expandedTag: string | null;
  selectedKaomojiIds: Set<string>;
  editingTag: string | null;
  newTagName: string;
  isMergeMode: boolean;
  tagsToMerge: Set<string>;
  isMergeModalOpen: boolean;
  finalMergeTag: string;
  isDeleteTagsMode: boolean;
  tagsToDeleteBulk: Set<string>;
}

const LOCAL_STORAGE_KEY = 'tagManagerFilterSortState';

const initialState: State = {
  searchTerm: '',
  sortBy: 'count',
  sortOrder: 'desc',
  usageThreshold: 5,
  showLowUsageOnly: false,
  expandedTag: null,
  selectedKaomojiIds: new Set(),
  editingTag: null,
  newTagName: '',
  isMergeMode: false,
  tagsToMerge: new Set(),
  isMergeModalOpen: false,
  finalMergeTag: '',
  isDeleteTagsMode: false,
  tagsToDeleteBulk: new Set(),
};

const getInitialState = (): State => {
  try {
    const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      return {
        ...initialState,
        searchTerm: parsedState.searchTerm ?? initialState.searchTerm,
        sortBy: parsedState.sortBy ?? initialState.sortBy,
        sortOrder: parsedState.sortOrder ?? initialState.sortOrder,
        usageThreshold: parsedState.usageThreshold ?? initialState.usageThreshold,
        showLowUsageOnly: parsedState.showLowUsageOnly ?? initialState.showLowUsageOnly,
      };
    }
  } catch {}
  return initialState;
};

type Action =
  | { type: 'SET_STATE'; payload: Partial<State> }
  | { type: 'TOGGLE_MERGE_MODE' }
  | { type: 'TOGGLE_DELETE_MODE' }
  | { type: 'START_EDIT'; payload: string }
  | { type: 'CANCEL_EDIT' }
  | { type: 'RESET_MODALS' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'TOGGLE_MERGE_MODE':
      return {
        ...state,
        isMergeMode: !state.isMergeMode,
        isDeleteTagsMode: false,
        tagsToMerge: new Set(),
        tagsToDeleteBulk: new Set(),
      };
    case 'TOGGLE_DELETE_MODE':
      return {
        ...state,
        isDeleteTagsMode: !state.isDeleteTagsMode,
        isMergeMode: false,
        tagsToMerge: new Set(),
        tagsToDeleteBulk: new Set(),
      };
    case 'START_EDIT':
      return { ...state, editingTag: action.payload, newTagName: action.payload };
    case 'CANCEL_EDIT':
      return { ...state, editingTag: null, newTagName: '' };
    case 'RESET_MODALS':
      return {
        ...state,
        editingTag: null,
        newTagName: '',
        isMergeModalOpen: false,
        isMergeMode: false,
        tagsToMerge: new Set(),
      };
    default:
      return state;
  }
};

export const useTagManager = ({ allKaomoji, allTags, onDataChange }: UseTagManagerProps) => {
  const { showToast } = useToast();
  const [state, dispatch] = useReducer(reducer, {}, getInitialState);

  const {
    searchTerm,
    sortBy,
    sortOrder,
    usageThreshold,
    showLowUsageOnly,
    expandedTag,
    selectedKaomojiIds,
    editingTag,
    newTagName,
    isMergeMode,
    tagsToMerge,
    finalMergeTag,
    isDeleteTagsMode,
    tagsToDeleteBulk,
  } = state;

  useEffect(() => {
    const stateToSave = {
      searchTerm: state.searchTerm,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      usageThreshold: state.usageThreshold,
      showLowUsageOnly: state.showLowUsageOnly,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [
    state.searchTerm,
    state.sortBy,
    state.sortOrder,
    state.usageThreshold,
    state.showLowUsageOnly,
  ]);

  const tagUsageMap = useMemo(() => {
    const usageMap: Record<string, TagUsage> = {};
    allTags.forEach((tag: string) => {
      usageMap[tag] = { tag, count: 0, kaomojis: [] };
    });
    allKaomoji.forEach((kaomoji: KaomojiItem) => {
      kaomoji.tags.forEach((tag: string) => {
        if (usageMap[tag]) {
          usageMap[tag].count++;
          usageMap[tag].kaomojis.push({
            id: kaomoji.id,
            text: kaomoji.text,
            category: kaomoji.id.split('_')[0],
          });
        }
      });
    });
    return usageMap;
  }, [allKaomoji, allTags]);

  const filteredTags = useMemo(() => {
    const allTagsWithUsage = Object.values(tagUsageMap);
    const lowUsageTags = allTagsWithUsage.filter((t) => t.count < usageThreshold);
    let tags = showLowUsageOnly ? lowUsageTags : allTagsWithUsage;

    if (searchTerm)
      tags = tags.filter((t) => t.tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return [...tags].sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'name') return a.tag.localeCompare(b.tag) * multiplier;
      return (a.count - b.count) * multiplier;
    });
  }, [tagUsageMap, showLowUsageOnly, searchTerm, sortBy, sortOrder, usageThreshold]);

  const lowUsageCount = useMemo(
    () => Object.values(tagUsageMap).filter((t) => t.count < usageThreshold).length,
    [tagUsageMap, usageThreshold]
  );

  const handleRenameTag = useCallback(async () => {
    if (!editingTag) return;
    const trimmedNewTag = newTagName.trim();
    if (!trimmedNewTag || editingTag === trimmedNewTag) {
      dispatch({ type: 'CANCEL_EDIT' });
      return;
    }
    if (allTags.includes(trimmedNewTag)) {
      showToast('標籤名稱已存在！', 'error');
      return;
    }
    if (!window.confirm(`確定要將標籤「${editingTag}」重命名為「${trimmedNewTag}」嗎？`)) return;

    try {
      await adminService.renameTag(editingTag, trimmedNewTag);
      onDataChange();
      dispatch({ type: 'RESET_MODALS' });
      showToast('重命名成功！', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '重命名時發生未知錯誤！', 'error');
    }
  }, [editingTag, newTagName, allTags, onDataChange, showToast]);

  const handleDeleteTag = useCallback(
    async (tag: string) => {
      const usage = tagUsageMap[tag];
      let confirmMessage = '';
      let performBulkUpdate = false;

      if (usage && usage.count > 0) {
        confirmMessage = `標籤「${tag}」目前有 ${usage.count} 個顏文字使用中。確定要刪除此標籤，並將其從所有相關顏文字中移除嗎？`;
        performBulkUpdate = true;
      } else confirmMessage = `確定要刪除未使用的標籤「${tag}」嗎？`;

      if (!window.confirm(confirmMessage)) return;

      try {
        if (performBulkUpdate) {
          const updatesByCategory = new Map<string, KaomojiItem[]>();
          allKaomoji.forEach((kaomoji: KaomojiItem) => {
            if (kaomoji.tags.includes(tag)) {
              const newTags = kaomoji.tags.filter((t: string) => t !== tag);
              const categoryId = kaomoji.id.split('_')[0];

              if (!updatesByCategory.has(categoryId)) {
                updatesByCategory.set(
                  categoryId,
                  JSON.parse(
                    JSON.stringify(
                      allKaomoji.filter((item: KaomojiItem) => item.id.startsWith(`${categoryId}_`))
                    )
                  )
                );
              }
              const categoryItems = updatesByCategory.get(categoryId)!;
              const kaomojiIndex = categoryItems.findIndex(
                (item: KaomojiItem) => item.id === kaomoji.id
              );
              if (kaomojiIndex !== -1) {
                categoryItems[kaomojiIndex] = { ...kaomoji, tags: newTags };
              }
            }
          });
          await adminService.bulkUpdateCategoriesForTags(updatesByCategory);
        }

        await adminService.deleteTag(tag);
        onDataChange();
        showToast('刪除成功！', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : '刪除時發生未知錯誤！', 'error');
      }
    },
    [tagUsageMap, allKaomoji, onDataChange, showToast]
  );

  const handleMergeTags = useCallback(async () => {
    const trimmedFinalTag = finalMergeTag.trim();
    if (!trimmedFinalTag) {
      showToast('請選擇或輸入一個最終的標籤名稱', 'error');
      return;
    }
    if (!window.confirm(`確定要將 ${tagsToMerge.size} 個標籤合併為「${trimmedFinalTag}」嗎？`))
      return;

    try {
      await adminService.mergeTags(Array.from(tagsToMerge), trimmedFinalTag);
      onDataChange();
      dispatch({ type: 'RESET_MODALS' });
      showToast('標籤合併成功！', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '合併標籤時發生未知錯誤！', 'error');
    }
  }, [finalMergeTag, tagsToMerge, onDataChange, showToast]);

  const handleBulkDeleteTags = useCallback(async () => {
    if (tagsToDeleteBulk.size === 0) return;
    const tagsArray = Array.from(tagsToDeleteBulk);
    if (
      !window.confirm(
        `您確定要從所有相關顏文字中移除 ${tagsArray.join('、')} 這 ${tagsArray.length} 個標籤嗎？`
      )
    )
      return;

    try {
      const updatesByCategory = new Map<string, KaomojiItem[]>();
      allKaomoji.forEach((kaomoji: KaomojiItem) => {
        const newTags = kaomoji.tags.filter((tag: string) => !tagsToDeleteBulk.has(tag));
        if (newTags.length !== kaomoji.tags.length) {
          const categoryId = kaomoji.id.split('_')[0];
          if (!updatesByCategory.has(categoryId)) {
            updatesByCategory.set(
              categoryId,
              JSON.parse(
                JSON.stringify(
                  allKaomoji.filter((item: KaomojiItem) => item.id.startsWith(`${categoryId}_`))
                )
              )
            );
          }
          const categoryItems = updatesByCategory.get(categoryId)!;
          const kaomojiIndex = categoryItems.findIndex(
            (item: KaomojiItem) => item.id === kaomoji.id
          );
          if (kaomojiIndex !== -1) {
            categoryItems[kaomojiIndex] = { ...kaomoji, tags: newTags };
          }
        }
      });

      await adminService.bulkUpdateCategoriesForTags(updatesByCategory);
      showToast(`已成功從相關顏文字中移除 ${tagsArray.length} 個標籤！`, 'success');
      onDataChange();
      dispatch({ type: 'TOGGLE_DELETE_MODE' });
    } catch (err) {
      showToast(err instanceof Error ? err.message : '刪除時發生未知錯誤！', 'error');
    }
  }, [tagsToDeleteBulk, allKaomoji, onDataChange, showToast]);

  const handleRemoveTagFromSelected = useCallback(
    async (tagToRemove: string) => {
      if (selectedKaomojiIds.size === 0) return;
      if (
        !window.confirm(
          `確定要從這 ${selectedKaomojiIds.size} 個顏文字中移除「${tagToRemove}」標籤嗎？`
        )
      )
        return;

      try {
        const updatesByCategory = new Map<string, KaomojiItem[]>();
        const kaomojisToUpdate = allKaomoji.filter((k: KaomojiItem) =>
          selectedKaomojiIds.has(k.id)
        );

        kaomojisToUpdate.forEach((k: KaomojiItem) => {
          const categoryId = k.id.split('_')[0];
          if (!updatesByCategory.has(categoryId)) {
            updatesByCategory.set(
              categoryId,
              JSON.parse(
                JSON.stringify(
                  allKaomoji.filter((item: KaomojiItem) => item.id.startsWith(`${categoryId}_`))
                )
              )
            );
          }
        });

        updatesByCategory.forEach((items, categoryId) => {
          const updatedItems = items.map((item: KaomojiItem) =>
            selectedKaomojiIds.has(item.id)
              ? { ...item, tags: item.tags.filter((t) => t !== tagToRemove) }
              : item
          );
          updatesByCategory.set(categoryId, updatedItems);
        });

        await adminService.bulkUpdateCategoriesForTags(updatesByCategory);
        showToast('標籤移除成功！', 'success');
        onDataChange();
        dispatch({ payload: { selectedKaomojiIds: new Set() }, type: 'SET_STATE' });
      } catch (err) {
        showToast(err instanceof Error ? err.message : '更新失敗！', 'error');
      }
    },
    [selectedKaomojiIds, allKaomoji, onDataChange, showToast]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      if (isDeleteTagsMode) {
        const newSet = new Set(tagsToDeleteBulk);
        if (newSet.has(tag)) {
          newSet.delete(tag);
        } else {
          newSet.add(tag);
        }
        dispatch({ type: 'SET_STATE', payload: { tagsToDeleteBulk: newSet } });
      } else if (isMergeMode) {
        const newSet = new Set(tagsToMerge);
        if (newSet.has(tag)) {
          newSet.delete(tag);
        } else {
          newSet.add(tag);
        }
        dispatch({ type: 'SET_STATE', payload: { tagsToMerge: newSet } });
      } else {
        dispatch({
          type: 'SET_STATE',
          payload: { expandedTag: expandedTag === tag ? null : tag, selectedKaomojiIds: new Set() },
        });
      }
    },
    [isDeleteTagsMode, isMergeMode, tagsToDeleteBulk, tagsToMerge, expandedTag]
  );

  const setEditingTag = useCallback((tag: string | null) => {
    if (tag) {
      dispatch({ type: 'START_EDIT', payload: tag });
    } else {
      dispatch({ type: 'CANCEL_EDIT' });
    }
  }, []);

  return {
    ...state,
    setSearchTerm: (payload: string) =>
      dispatch({ type: 'SET_STATE', payload: { searchTerm: payload } }),
    setSortBy: (payload: 'name' | 'count') =>
      dispatch({ type: 'SET_STATE', payload: { sortBy: payload } }),
    setSortOrder: (payload: 'asc' | 'desc') =>
      dispatch({ type: 'SET_STATE', payload: { sortOrder: payload } }),
    setUsageThreshold: (payload: number) =>
      dispatch({ type: 'SET_STATE', payload: { usageThreshold: payload } }),
    setShowLowUsageOnly: (payload: boolean) =>
      dispatch({ type: 'SET_STATE', payload: { showLowUsageOnly: payload } }),
    setSelectedKaomojiIds: (payload: Set<string>) =>
      dispatch({ type: 'SET_STATE', payload: { selectedKaomojiIds: payload } }),
    setNewTagName: (payload: string) =>
      dispatch({ type: 'SET_STATE', payload: { newTagName: payload } }),
    setIsMergeModalOpen: (payload: boolean) =>
      dispatch({ type: 'SET_STATE', payload: { isMergeModalOpen: payload } }),
    setFinalMergeTag: (payload: string) =>
      dispatch({ type: 'SET_STATE', payload: { finalMergeTag: payload } }),
    setTagsToDeleteBulk: (payload: Set<string>) =>
      dispatch({ type: 'SET_STATE', payload: { tagsToDeleteBulk: payload } }),
    setEditingTag,
    filteredTags,
    lowUsageCount,
    handleRenameTag,
    handleDeleteTag,
    handleMergeTags,
    handleBulkDeleteTags,
    handleRemoveTagFromSelected,
    toggleMergeMode: () => dispatch({ type: 'TOGGLE_MERGE_MODE' }),
    toggleDeleteMode: () => dispatch({ type: 'TOGGLE_DELETE_MODE' }),
    handleTagClick,
    toggleKaomojiSelection: (kaomojiId: string) => {
      const newSet = new Set(selectedKaomojiIds);
      if (newSet.has(kaomojiId)) {
        newSet.delete(kaomojiId);
      } else {
        newSet.add(kaomojiId);
      }
      dispatch({ type: 'SET_STATE', payload: { selectedKaomojiIds: newSet } });
    },
  };
};
