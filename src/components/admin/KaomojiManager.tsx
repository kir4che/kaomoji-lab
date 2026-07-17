'use client';

import { useCallback, useDeferredValue, useEffect, useRef, useState, useTransition } from 'react';

import KaomojiEditor from '@/components/admin/KaomojiEditor';
import KaomojiFilterBar from '@/components/admin/KaomojiFilterBar';
import KaomojiGrid from '@/components/admin/KaomojiGrid';
import Loading from '@/components/atoms/Loading';
import { useToast } from '@/contexts/ToastContext';
import { useAdminFilterState } from '@/hooks/useAdminFilterState';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { useKaomojiMutations } from '@/hooks/useKaomojiMutations';
import type { CategoryData, IndexData, KaomojiItem } from '@/types/Kaomoji';
import { cn } from '@/utils/cn';

interface KaomojiManagerProps {
  categories: CategoryData[];
  indexData: IndexData;
  onDataChange: (updatedCategories: CategoryData[]) => void;
  onTagsChange: (updatedTags: IndexData['tags']) => void;
  checkedKaomojiIds: Set<string>;
  onToggleKaomojiChecked: (kaomojiId: string) => void;
  onUpdateCheckedIdsWithMapping: (idMapping?: Map<string, string>) => void;
}

const KaomojiManager = ({
  categories: initialCategories,
  indexData,
  onDataChange,
  onTagsChange,
  checkedKaomojiIds,
  onToggleKaomojiChecked,
  onUpdateCheckedIdsWithMapping,
}: KaomojiManagerProps) => {
  const { showToast } = useToast();

  // 單一 state，包含暫存分類（Temp Category 跟一般分類同陣列管理）
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);

  const [selectedKaomoji, setSelectedKaomoji] = useState<KaomojiItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const [selectedKaomojiIds, setSelectedKaomojiIds] = useState<Set<string>>(new Set());
  // 用於「篩選後保持選取」
  const lastSelectedIdRef = useRef<string | null>(null);
  const lastSelectedIndexRef = useRef<number | null>(null);
  const previousFilteredIdsRef = useRef<string[]>([]);

  // 外部資料更新時同步
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const filterState = useAdminFilterState({ categories, indexData, checkedKaomojiIds });
  const {
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
    filterCheckedStatus,
    tagNameMap,
    kaomojiToCategoryMap,
    allKaomoji,
    tagsWithCounts,
    checkedCount,
    uncheckedCount,
    handleResetCrossViewSelection,
  } = filterState;

  const [, startTransition] = useTransition();

  const toggleKaomojiSelection = useCallback((kaomojiId: string) => {
    setSelectedKaomojiIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(kaomojiId)) newSet.delete(kaomojiId);
      else newSet.add(kaomojiId);
      return newSet;
    });
  }, []);

  useEffect(() => {
    if (selectedKaomoji) lastSelectedIdRef.current = selectedKaomoji.id;
  }, [selectedKaomoji]);

  const clearSelectedKaomoji = useCallback(
    (options?: { preserveLast?: boolean }) => {
      if (options?.preserveLast) {
        if (selectedKaomoji) lastSelectedIdRef.current = selectedKaomoji.id;
        if (selectedKaomoji) {
          const ids = previousFilteredIdsRef.current;
          const index = ids.indexOf(selectedKaomoji.id);
          if (index >= 0) lastSelectedIndexRef.current = index;
        }
      } else {
        lastSelectedIdRef.current = null;
        lastSelectedIndexRef.current = null;
      }
      setSelectedKaomoji(null);
    },
    [selectedKaomoji]
  );

  const filteredKaomoji = useFilteredKaomoji({
    sourceKaomojis: allKaomoji,
    allCategories: categories,
    selectedCategory,
    searchTerm: deferredSearchTerm,
    filterTag: filterTags,
    filterMode,
    filterCheckedStatus,
    checkedKaomojiIds,
    allTags: indexData.tags,
  });

  const selectAllKaomoji = useCallback(() => {
    setSelectedKaomojiIds(new Set(filteredKaomoji.map((k) => k.id)));
  }, [filteredKaomoji]);

  const deselectAllKaomoji = useCallback(() => {
    setSelectedKaomojiIds(new Set());
  }, []);

  useEffect(() => {
    if (filteredKaomoji.length === 0) {
      if (selectedKaomoji || lastSelectedIdRef.current) clearSelectedKaomoji();
      previousFilteredIdsRef.current = [];
      return;
    }

    const currentIds = filteredKaomoji.map((item) => item.id);
    const referenceId = selectedKaomoji?.id ?? lastSelectedIdRef.current;

    if (!referenceId) {
      setSelectedKaomoji(filteredKaomoji[0]);
      previousFilteredIdsRef.current = currentIds;
      lastSelectedIndexRef.current = 0;
      return;
    }

    const currentIndex = filteredKaomoji.findIndex((item) => item.id === referenceId);

    if (currentIndex !== -1) {
      lastSelectedIndexRef.current = currentIndex;
      if (!selectedKaomoji || selectedKaomoji.id !== referenceId)
        setSelectedKaomoji(filteredKaomoji[currentIndex]);
    } else {
      const previousIds = previousFilteredIdsRef.current;
      const previousIndexFromList = previousIds.indexOf(referenceId);
      const fallbackIndex = lastSelectedIndexRef.current ?? previousIndexFromList;
      const tentativeIndex =
        fallbackIndex >= 0 ? Math.min(fallbackIndex, filteredKaomoji.length - 1) : 0;
      const nextSelection = filteredKaomoji[tentativeIndex];

      if (nextSelection) {
        lastSelectedIndexRef.current = tentativeIndex;
        if (selectedKaomoji?.id !== nextSelection.id) setSelectedKaomoji(nextSelection);
      } else {
        lastSelectedIndexRef.current = null;
        clearSelectedKaomoji();
      }
    }
    previousFilteredIdsRef.current = currentIds;
  }, [filteredKaomoji, selectedKaomoji, clearSelectedKaomoji]);

  const {
    isLoading,
    addKaomoji,
    editKaomoji,
    deleteKaomoji,
    moveKaomoji,
    handleBulkDelete,
    handleBulkMove,
    handleBulkAddTags,
  } = useKaomojiMutations({
    categories,
    onDataChange,
    setCategories,
    kaomojiToCategoryMap,
    availableTags: indexData.tags,
  });

  const handleMoveFromEditor = useCallback(
    async (toCategoryId: string, updatedData?: KaomojiItem) => {
      if (!selectedKaomoji) return;
      const kaomojiToProcess = updatedData || selectedKaomoji;
      const fromCategoryId = kaomojiToCategoryMap.get(kaomojiToProcess.id);
      if (!fromCategoryId) {
        showToast('無法確定來源分類！', 'error');
        return;
      }
      const result = await moveKaomoji(fromCategoryId, toCategoryId, kaomojiToProcess);
      if (result?.idMapping && result.kaomoji) {
        onUpdateCheckedIdsWithMapping(result.idMapping);
        setSelectedKaomoji(result.kaomoji);
      } else clearSelectedKaomoji();
    },
    [
      selectedKaomoji,
      kaomojiToCategoryMap,
      showToast,
      moveKaomoji,
      clearSelectedKaomoji,
      onUpdateCheckedIdsWithMapping,
    ]
  );

  const handleSave = useCallback(
    async (data: KaomojiItem) => {
      const categoryId = kaomojiToCategoryMap.get(data.id) || selectedCategory;
      if (!categoryId) {
        showToast('無法確定分類！', 'error');
        return;
      }
      let savedKaomoji: KaomojiItem | null = null;
      if (data.id === '')
        savedKaomoji = await addKaomoji(categoryId, { text: data.text, tags: data.tags });
      else
        savedKaomoji = await editKaomoji(categoryId, data.id, { text: data.text, tags: data.tags });

      if (savedKaomoji && selectedKaomoji && savedKaomoji.id === selectedKaomoji.id)
        setSelectedKaomoji(savedKaomoji);
      else if (data.id === '') clearSelectedKaomoji();
    },
    [
      kaomojiToCategoryMap,
      selectedCategory,
      selectedKaomoji,
      addKaomoji,
      editKaomoji,
      showToast,
      clearSelectedKaomoji,
    ]
  );

  const onSingleDelete = useCallback(
    (cId: string, kId: string) => {
      deleteKaomoji(cId, kId).then((success) => {
        if (success && selectedKaomoji?.id === kId) clearSelectedKaomoji({ preserveLast: true });
      });
    },
    [clearSelectedKaomoji, deleteKaomoji, selectedKaomoji]
  );

  const onBulkDelete = () => {
    handleBulkDelete(selectedKaomojiIds).then(() => setSelectedKaomojiIds(new Set()));
  };

  const onBulkMove = (targetCategoryId: string) => {
    handleBulkMove(selectedKaomojiIds, targetCategoryId).then((result) => {
      onUpdateCheckedIdsWithMapping(result?.idMapping);
      setSelectedKaomojiIds(new Set());
    });
  };

  const onBulkAddTags = () => {
    handleBulkAddTags(selectedKaomojiIds, tagsToAdd)
      .then((result) => {
        if (result && result.updatedItemCount > 0) {
          setTagsToAdd('');
          setSelectedKaomojiIds(new Set());
        }
      })
      .catch(() => {});
  };

  if (isLoading) return <Loading />;

  return (
    <div
      className={cn('grid grid-cols-1 gap-4', {
        'md:grid-cols-[2fr_1.5fr]': Boolean(selectedKaomoji),
      })}
    >
      <div className="space-y-3">
        <KaomojiFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={(value) =>
            startTransition(() => {
              setSelectedCategory(value);
              clearSelectedKaomoji();
            })
          }
          categories={categories}
          filterTags={filterTags}
          setFilterTags={setFilterTags}
          tagsWithCounts={tagsWithCounts}
          filterMode={filterMode}
          onFilterModeChange={(mode) => startTransition(() => setFilterMode(mode))}
          checkedStatusFilters={checkedStatusFilters}
          toggleStatusFilter={toggleStatusFilter}
          checkedCount={checkedCount}
          uncheckedCount={uncheckedCount}
          checkedKaomojiIds={checkedKaomojiIds}
          tagNameMap={tagNameMap}
          onCategoryClick={(categoryId) =>
            startTransition(() => {
              setSelectedCategory(categoryId);
              setFilterTags([]);
              setCheckedStatusFilters(new Set(['unchecked']));
            })
          }
          onTagClick={(categoryId, tagId) =>
            startTransition(() => {
              setSelectedCategory(categoryId);
              setFilterTags([tagId]);
              setCheckedStatusFilters(new Set(['unchecked']));
            })
          }
          onResetCrossView={handleResetCrossViewSelection}
        />
        <KaomojiGrid
          filteredKaomoji={filteredKaomoji}
          selectedKaomojiIds={selectedKaomojiIds}
          selectedKaomoji={selectedKaomoji}
          isLoading={isLoading}
          toggleKaomojiSelection={toggleKaomojiSelection}
          setSelectedKaomoji={setSelectedKaomoji}
          selectAllKaomoji={selectAllKaomoji}
          deselectAllKaomoji={deselectAllKaomoji}
          onBulkDelete={onBulkDelete}
          onBulkMove={onBulkMove}
          categories={categories}
          selectedCategory={selectedCategory}
          tagsToAdd={tagsToAdd}
          setTagsToAdd={setTagsToAdd}
          onBulkAddTags={onBulkAddTags}
          onSingleDelete={onSingleDelete}
          kaomojiToCategoryMap={kaomojiToCategoryMap}
          showToast={showToast}
          onAddNew={() => {
            if (!selectedCategory) {
              showToast('請先選擇一個分類再新增顏文字！', 'error');
              return;
            }
            setSelectedKaomoji({ id: '', text: '', tags: [] });
          }}
        />
      </div>
      {selectedKaomoji && (
        <KaomojiEditor
          kaomoji={selectedKaomoji}
          categories={categories}
          allTags={indexData.tags}
          currCategory={kaomojiToCategoryMap.get(selectedKaomoji.id) || selectedCategory}
          onSave={handleSave}
          onMove={handleMoveFromEditor}
          isChecked={selectedKaomoji && checkedKaomojiIds.has(selectedKaomoji.id)}
          onToggleChecked={onToggleKaomojiChecked}
          onTagCreated={(tag) => {
            if (indexData.tags.some((existing) => existing.id === tag.id)) return;
            onTagsChange([...indexData.tags, tag].sort((a, b) => a.id.localeCompare(b.id)));
          }}
        />
      )}
    </div>
  );
};

export default KaomojiManager;
