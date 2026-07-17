import { useState, useEffect, useMemo, useCallback } from 'react';

import type { CategoryData, KaomojiItem, Tag } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { computeTagRemovalFromSelectedKaomoji } from '@/utils/duplicateCleanup';
import { buildTagSynonymMap } from '@/utils/tagUtils';
import { getTodayDateString } from '@/utils/date';

export interface TagUsage extends Tag {
  count: number;
  kaomojis: Array<{ id: string; text: string; category: string }>;
}

interface UseTagManagerProps {
  categories: CategoryData[];
  allKaomoji: KaomojiItem[];
  tags: Tag[];
  onTagsChange: (updatedTags: Tag[]) => void;
  onCategoriesChange: (updatedCategories: CategoryData[]) => void;
}

// 標籤管理功能
export const useTagManager = ({
  categories,
  allKaomoji,
  tags: initialTags,
  onTagsChange,
  onCategoriesChange,
}: UseTagManagerProps) => {
  const { showToast } = useToast();
  const { lang } = useLanguage();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'count'>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usageThreshold, setUsageThreshold] = useState(5);
  const [showLowUsageOnly, setShowLowUsageOnly] = useState(false);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [selectedKaomojiIds, setSelectedKaomojiIds] = useState(new Set<string>());

  const [isMergeMode, setIsMergeMode] = useState(false);
  const [tagsToMerge, setTagsToMerge] = useState(new Set<string>());
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [finalMergeTagName, setFinalMergeTagName] = useState('');

  const [isDeleteTagsMode, setIsDeleteTagsMode] = useState(false);
  const [tagsToDeleteBulk, setTagsToDeleteBulk] = useState(new Set<string>());
  const [crossFilterTagIds, setCrossFilterTagIds] = useState<string[]>([]);

  const [deleteConfirmTag, setDeleteConfirmTag] = useState<{
    id: string;
    name: string;
    count: number;
  } | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);

  const kaomojiMap = useMemo(() => {
    const map = new Map<string, KaomojiItem>();
    allKaomoji.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [allKaomoji]);

  useEffect(() => {
    setTags(initialTags);
    setIsLoading(false);
  }, [initialTags]);

  const updateTagsDraft = useCallback(
    (updatedTags: Tag[]) => {
      const sortedTags = [...updatedTags].sort((a, b) => a.id.localeCompare(b.id));
      setTags(sortedTags);
      onTagsChange(sortedTags);
    },
    [onTagsChange]
  );

  const updateCategoriesDraft = useCallback(
    (updatedCategories: CategoryData[]) => {
      onCategoriesChange(updatedCategories);
    },
    [onCategoriesChange]
  );

  const tagUsageMap = useMemo(() => {
    const usageMap = new Map<string, TagUsage>();
    tags.forEach((tag) => {
      usageMap.set(tag.id, { ...tag, count: 0, kaomojis: [] });
    });
    allKaomoji.forEach((item) => {
      const categoryId = item.id.split('_')[0];
      item.tags.forEach((tagId) => {
        const usage = usageMap.get(tagId);
        if (usage) {
          usage.count++;
          usage.kaomojis.push({ id: item.id, text: item.text, category: categoryId });
        }
      });
    });
    return usageMap;
  }, [allKaomoji, tags]);

  const tagSynonymMap = useMemo(() => buildTagSynonymMap(tags), [tags]);

  const allTagsWithUsage = useMemo(() => Array.from(tagUsageMap.values()), [tagUsageMap]);

  const processedTags: TagUsage[] = useMemo(() => {
    let filtered = allTagsWithUsage;

    if (showLowUsageOnly) filtered = filtered.filter((tag) => tag.count < usageThreshold);

    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tag) =>
          tag.id.toLowerCase().includes(lowercasedSearchTerm) ||
          tag.name.en.toLowerCase().includes(lowercasedSearchTerm) ||
          tag.name['zh-tw'].toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    filtered.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'name') return a.name[lang].localeCompare(b.name[lang]) * multiplier;
      return (a.count - b.count) * multiplier;
    });

    return filtered;
  }, [allTagsWithUsage, showLowUsageOnly, usageThreshold, searchTerm, sortBy, sortOrder, lang]);

  const lowUsageCount = useMemo(
    () => allTagsWithUsage.filter((t) => t.count < usageThreshold).length,
    [allTagsWithUsage, usageThreshold]
  );

  const openModal = (tag: Tag | null = null) => {
    setEditingTag(tag);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingTag(null);
    setIsModalOpen(false);
    setIsMergeModalOpen(false);
    setFinalMergeTagName('');
  };

  const toggleKaomojiSelection = (kaomojiId: string) => {
    setSelectedKaomojiIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(kaomojiId)) newSet.delete(kaomojiId);
      else newSet.add(kaomojiId);
      return newSet;
    });
  };

  const handleTagClick = (tagId: string) => {
    if (isDeleteTagsMode)
      setTagsToDeleteBulk((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tagId)) newSet.delete(tagId);
        else newSet.add(tagId);
        return newSet;
      });
    else if (isMergeMode)
      setTagsToMerge((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tagId)) newSet.delete(tagId);
        else newSet.add(tagId);
        return newSet;
      });
    else {
      setExpandedTag((prev) => (prev === tagId ? null : tagId));
      setSelectedKaomojiIds(new Set());
      setCrossFilterTagIds([]);
    }
  };

  const toggleMergeMode = () => {
    setIsMergeMode(!isMergeMode);
    setIsDeleteTagsMode(false);
    setTagsToMerge(new Set());
    setTagsToDeleteBulk(new Set());
    setFinalMergeTagName('');
  };

  const toggleDeleteMode = () => {
    setIsDeleteTagsMode(!isDeleteTagsMode);
    setIsMergeMode(false);
    setTagsToMerge(new Set());
    setTagsToDeleteBulk(new Set());
  };

  const finalMergeTarget = useMemo(() => {
    const trimmedName = finalMergeTagName.trim();
    if (!trimmedName) return null;
    return allTagsWithUsage.find((tag) => tag.name['zh-tw']?.trim() === trimmedName) ?? null;
  }, [finalMergeTagName, allTagsWithUsage]);

  const handleMergeTags = async () => {
    const trimmedFinalName = finalMergeTagName.trim();
    if (!trimmedFinalName) {
      showToast('請輸入最終標籤的中文名稱', 'error');
      return;
    }
    if (!finalMergeTarget) {
      showToast('找不到相符的標籤，請確認輸入的中文名稱或先建立新標籤。', 'error');
      return;
    }
    if (tagsToMerge.size < 2) {
      showToast('請至少選擇兩個標籤進行合併！', 'info');
      return;
    }
    if (
      !window.confirm(
        `確定要將 ${tagsToMerge.size} 個標籤合併為「${trimmedFinalName}」嗎？此操作無法復原。`
      )
    )
      return;

    const mergeSet = new Set(tagsToMerge);
    const today = getTodayDateString();
    const updatedCategories = categories.map((category) => {
      let changed = false;
      const items = category.items.map((item) => {
        if (!item.tags.some((tag) => mergeSet.has(tag))) return item;
        changed = true;
        return {
          ...item,
          tags: Array.from(
            new Set(item.tags.map((tag) => (mergeSet.has(tag) ? finalMergeTarget.id : tag)))
          ).sort(),
        };
      });
      return changed ? { ...category, items, lastUpdated: today } : category;
    });
    updateCategoriesDraft(updatedCategories);
    updateTagsDraft(tags.filter((tag) => !mergeSet.has(tag.id) || tag.id === finalMergeTarget.id));
    showToast('標籤合併已加入本次更新！', 'success');
    closeModal();
  };

  const handleBulkDeleteTags = async () => {
    if (tagsToDeleteBulk.size === 0) return;
    const tagsArray = Array.from(tagsToDeleteBulk);
    if (
      !window.confirm(
        `您確定要從所有相關顏文字中移除 ${tagsArray.join('、')} 這 ${tagsArray.length} 個標籤嗎？`
      )
    )
      return;

    const removeSet = new Set(tagsArray);
    const today = getTodayDateString();
    const updatedCategories = categories.map((category) => {
      let changed = false;
      const items = category.items.map((item) => {
        const nextTags = item.tags.filter((tag) => !removeSet.has(tag));
        if (nextTags.length === item.tags.length) return item;
        changed = true;
        return { ...item, tags: nextTags.sort() };
      });
      return changed ? { ...category, items, lastUpdated: today } : category;
    });
    updateCategoriesDraft(updatedCategories);
    showToast(`已將 ${tagsArray.length} 個標籤移除加入本次更新！`, 'success');
    toggleDeleteMode();
  };

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
        const { updatedItemCount, updatedCategories } = computeTagRemovalFromSelectedKaomoji({
          categories,
          selectedKaomojiIds,
          tagInputs: [tagToRemove],
          tagSynonymMap,
        });

        if (updatedItemCount === 0) {
          showToast('沒有符合的標籤可移除。', 'info');
          return;
        }

        updateCategoriesDraft(updatedCategories);
        showToast('標籤移除已加入本次更新！', 'success');
        setSelectedKaomojiIds(new Set());
      } catch (err) {
        showToast(err instanceof Error ? err.message : '更新失敗！', 'error');
      }
    },
    [selectedKaomojiIds, categories, tagSynonymMap, updateCategoriesDraft, showToast]
  );

  const filteredExpandedTagKaomojis = useMemo(() => {
    if (!expandedTag) return [];
    const baseKaomojis = tagUsageMap.get(expandedTag)?.kaomojis ?? [];
    if (crossFilterTagIds.length === 0) return baseKaomojis;

    return baseKaomojis.filter((kaomoji) => {
      const fullKaomoji = kaomojiMap.get(kaomoji.id);
      if (!fullKaomoji) return false;
      return crossFilterTagIds.every((tagId) => fullKaomoji.tags.includes(tagId));
    });
  }, [expandedTag, tagUsageMap, crossFilterTagIds, kaomojiMap]);

  useEffect(() => {
    setSelectedKaomojiIds((prev) => {
      if (!expandedTag) return new Set<string>();
      if (prev.size === 0) return prev;

      const validIds = new Set(filteredExpandedTagKaomojis.map((k) => k.id));
      const next = new Set<string>();

      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });

      if (next.size === prev.size) return prev;
      return next;
    });
  }, [expandedTag, filteredExpandedTagKaomojis]);

  const handleSave = async (tagData: Tag) => {
    const nextTags = editingTag
      ? tags.map((tag) => (tag.id === editingTag.id ? tagData : tag))
      : [...tags, tagData];
    updateTagsDraft(nextTags);
    showToast(`標籤${editingTag ? '更新' : '新增'}已加入本次更新！`, 'success');
    closeModal();
  };

  const executeDelete = async (tagId: string) => {
    const usedTags = new Set<string>();
    const today = getTodayDateString();
    const updatedCategories = categories.map((category) => {
      const keptItems = category.items.filter((item) => !item.tags.includes(tagId));
      keptItems.forEach((item) => item.tags.forEach((tag) => usedTags.add(tag)));
      if (keptItems.length === category.items.length) return category;
      return { ...category, items: keptItems, lastUpdated: today };
    });

    updateCategoriesDraft(updatedCategories);
    updateTagsDraft(tags.filter((tag) => usedTags.has(tag.id)));
    showToast('標籤刪除已加入本次更新！', 'success');
  };

  const handleDelete = async (tagId: string) => {
    const usage = tagUsageMap.get(tagId);
    const count = usage?.count ?? 0;

    if (count > 5) {
      setDeleteConfirmTag({
        id: tagId,
        name: usage?.name['zh-tw'] || usage?.name.en || tagId,
        count,
      });
      setIsDeleteConfirmModalOpen(true);
      return;
    }

    if (count > 0) {
      if (
        !window.confirm(
          `確定要刪除標籤「${tagId}」嗎？該標籤包含 ${count} 個顏文字。此操作無法復原。`
        )
      )
        return;
    }

    await executeDelete(tagId);
  };

  const confirmDeleteTag = async () => {
    if (!deleteConfirmTag) return;
    await executeDelete(deleteConfirmTag.id);
    setDeleteConfirmTag(null);
    setIsDeleteConfirmModalOpen(false);
  };

  const cancelDeleteTag = () => {
    setDeleteConfirmTag(null);
    setIsDeleteConfirmModalOpen(false);
  };

  return {
    isLoading,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    processedTags,
    editingTag,
    isModalOpen,
    openModal,
    closeModal,
    handleSave,
    handleDelete,
    usageThreshold,
    setUsageThreshold,
    showLowUsageOnly,
    setShowLowUsageOnly,
    lowUsageCount,
    expandedTag,
    handleTagClick,
    selectedKaomojiIds,
    setSelectedKaomojiIds,
    toggleKaomojiSelection,
    handleRemoveTagFromSelected,
    isMergeMode,
    toggleMergeMode,
    tagsToMerge,
    isMergeModalOpen,
    setIsMergeModalOpen,
    finalMergeTagName,
    setFinalMergeTagName,
    finalMergeTarget,
    handleMergeTags,
    isDeleteTagsMode,
    toggleDeleteMode,
    tagsToDeleteBulk,
    setTagsToDeleteBulk,
    handleBulkDeleteTags,
    tagUsageMap,
    crossFilterTagIds,
    setCrossFilterTagIds,
    filteredExpandedTagKaomojis,
    deleteConfirmTag,
    isDeleteConfirmModalOpen,
    confirmDeleteTag,
    cancelDeleteTag,
  };
};
