import { useState, useEffect, useMemo, useCallback } from 'react';

import type { KaomojiItem, Tag } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import * as adminService from '@/services/adminService';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TagUsage extends Tag {
  count: number;
  kaomojis: Array<{ id: string; text: string; category: string }>;
}

interface UseTagManagerProps {
  allKaomoji: KaomojiItem[];
  onDataChange: () => void;
}

export const useTagManager = ({ allKaomoji, onDataChange }: UseTagManagerProps) => {
  const { showToast } = useToast();
  const { lang } = useLanguage();
  const [tags, setTags] = useState<Tag[]>([]);
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

  const kaomojiMap = useMemo(() => {
    const map = new Map<string, KaomojiItem>();
    allKaomoji.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [allKaomoji]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedTags = await adminService.getTags();
      setTags(fetchedTags);
    } catch {
      showToast('無法載入標籤，請重試！', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

    try {
      await adminService.mergeTags(Array.from(tagsToMerge), finalMergeTarget.id);
      showToast('標籤合併成功！', 'success');
      fetchData();
      onDataChange();
      closeModal();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '合併標籤時發生未知錯誤！', 'error');
    }
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

    try {
      await adminService.bulkRemoveTags(tagsArray);
      showToast(`已成功從相關顏文字中移除 ${tagsArray.length} 個標籤！`, 'success');
      fetchData();
      onDataChange();
      toggleDeleteMode();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '刪除時發生未知錯誤！', 'error');
    }
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
        const updatesByCat = new Map<string, KaomojiItem[]>();

        selectedKaomojiIds.forEach((kaomojiId) => {
          const kaomoji = allKaomoji.find((k) => k.id === kaomojiId);
          if (!kaomoji) return;

          const categoryId = kaomoji.id.split('_')[0];
          if (!updatesByCat.has(categoryId)) {
            updatesByCat.set(
              categoryId,
              allKaomoji.filter((k) => k.id.startsWith(`${categoryId}_`))
            );
          }
        });

        updatesByCat.forEach((items, categoryId) => {
          const updatedItems = items.map((item) => {
            if (selectedKaomojiIds.has(item.id))
              return { ...item, tags: item.tags.filter((t) => t !== tagToRemove) };
            return item;
          });
          updatesByCat.set(categoryId, updatedItems);
        });

        const updatePromises = Array.from(updatesByCat.entries()).map(([catId, items]) =>
          adminService.bulkUpdateCategoryItems(catId, items)
        );

        await Promise.all(updatePromises);

        showToast('標籤移除成功！', 'success');
        onDataChange();
        setSelectedKaomojiIds(new Set());
      } catch (err) {
        showToast(err instanceof Error ? err.message : '更新失敗！', 'error');
      }
    },
    [selectedKaomojiIds, allKaomoji, onDataChange, showToast]
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
    try {
      if (editingTag) {
        await adminService.updateTag(tagData);
        showToast('標籤更新成功！', 'success');
      } else {
        await adminService.createTag(tagData);
        showToast('標籤新增成功！', 'success');
      }
      fetchData();
      onDataChange();
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失敗，請重試！';
      showToast(message, 'error');
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!window.confirm(`確定要刪除標籤「${tagId}」嗎？此操作無法復原。`)) return;

    try {
      await adminService.deleteTag(tagId);
      showToast('標籤刪除成功！', 'success');
      fetchData();
      onDataChange();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '刪除失敗，請重試！', 'error');
    }
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
  };
};
