'use client';

import { useState, useEffect, useMemo, useCallback, useRef, type SetStateAction } from 'react';

import type { KaomojiItem, CategoryData, IndexData } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/utils/cn';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { useKaomojiMutations } from '@/hooks/useKaomojiMutations';
import {
  getCheckedKaomojiIds,
  getTemporaryCategory,
  saveCheckedKaomojiIds,
} from '@/services/adminService';
import { TEMP_CATEGORY_ID, createDefaultTemporaryCategory } from '@/constants/tempCategory';
import KaomojiEditor from '@/components/admin/KaomojiEditor';
import CategoryTagCrossView from '@/components/admin/CategoryTagCrossView';
import Input from '@/components/atoms/Input';
import IconBtn from '@/components/atoms/IconBtn';
import SelectAllBtn from '@/components/atoms/SelectAllBtn';
import Loading from '@/components/atoms/Loading';
import PlusIcon from '@/assets/icons/plus.svg';
import MinusIcon from '@/assets/icons/minus.svg';
import DeleteIcon from '@/assets/icons/delete.svg';
import CloseIcon from '@/assets/icons/close.svg';
import CheckIcon from '@/assets/icons/check.svg';
import ResetIcon from '@/assets/icons/reset.svg';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';

interface KaomojiManagerProps {
  categories: CategoryData[];
  indexData: IndexData;
  onDataChange: (updatedCategories: CategoryData[]) => void;
  onRefreshIndexData?: () => void;
}

const CHECKED_STORAGE_KEY = 'checkedKaomojiIds';

const normalizeTemporaryCategory = (data?: Partial<CategoryData>): CategoryData => {
  const base = createDefaultTemporaryCategory();

  return {
    ...base,
    ...data,
    id: TEMP_CATEGORY_ID,
    name: {
      en: data?.name?.en ?? base.name.en,
      'zh-tw': data?.name?.['zh-tw'] ?? base.name['zh-tw'],
    },
    preview: typeof data?.preview === 'string' ? data.preview : '',
    lastUpdated: data?.lastUpdated ?? base.lastUpdated,
    items: Array.isArray(data?.items) ? data.items : [],
  };
};

const splitCategoriesByTemp = (list: CategoryData[], fallbackTemp: CategoryData) => {
  let temp: CategoryData | null = null;
  const base: CategoryData[] = [];
  for (const category of list) {
    if (category.id === TEMP_CATEGORY_ID) temp = normalizeTemporaryCategory(category);
    else base.push(category);
  }
  return { base, temp: temp ?? fallbackTemp };
};

const remapCheckedIds = (prev: Set<string>, idMapping: Map<string, string>) => {
  if (idMapping.size === 0) return prev;
  const newSet = new Set(prev);
  for (const [oldId, newId] of idMapping.entries()) {
    if (newSet.has(oldId)) {
      newSet.delete(oldId);
      newSet.add(newId);
    }
  }
  return newSet;
};

const updateCheckedIdsWithMapping = (
  setCheckedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  persistIds: (ids: Set<string>) => Promise<void>,
  idMapping?: Map<string, string>
) => {
  if (!idMapping || idMapping.size === 0) return;

  setCheckedIds((prev) => {
    const mapped = remapCheckedIds(prev, idMapping);
    persistIds(mapped);
    return mapped;
  });
};

const KaomojiManager: React.FC<KaomojiManagerProps> = ({
  categories: initialCategories,
  indexData,
  onDataChange,
  onRefreshIndexData,
}: KaomojiManagerProps) => {
  const { showToast } = useToast();

  const [baseCategories, setBaseCategories] = useState<CategoryData[]>(() =>
    initialCategories.filter((category) => category.id !== TEMP_CATEGORY_ID)
  );
  const [temporaryCategory, setTemporaryCategory] = useState<CategoryData>(() =>
    createDefaultTemporaryCategory()
  );
  const tempCategoryRef = useRef<CategoryData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedKaomoji, setSelectedKaomoji] = useState<KaomojiItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const [selectedKaomojiIds, setSelectedKaomojiIds] = useState<Set<string>>(new Set());
  const [checkedKaomojiIds, setCheckedKaomojiIds] = useState<Set<string>>(new Set());
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const loadErrorNotifiedRef = useRef(false);
  const persistErrorNotifiedRef = useRef(false);
  const tempLoadErrorRef = useRef(false);
  const [checkedStatusFilters, setCheckedStatusFilters] = useState<Set<'checked' | 'unchecked'>>(
    () => new Set(['unchecked'])
  );
  const lastSelectedIdRef = useRef<string | null>(null);
  const lastSelectedIndexRef = useRef<number | null>(null);
  const filterCheckedStatus = useMemo<'all' | 'checked' | 'unchecked'>(() => {
    if (checkedStatusFilters.size === 0 || checkedStatusFilters.size === 2) return 'all';
    if (checkedStatusFilters.has('checked')) return 'checked';
    return 'unchecked';
  }, [checkedStatusFilters]);

  const [tagsToAdd, setTagsToAdd] = useState('');
  const [showCrossView, setShowCrossView] = useState(false);
  const previousFilteredIdsRef = useRef<string[]>([]);

  useEffect(() => {
    setBaseCategories(initialCategories.filter((category) => category.id !== TEMP_CATEGORY_ID));
  }, [initialCategories]);

  useEffect(() => {
    tempCategoryRef.current = temporaryCategory;
  }, [temporaryCategory]);

  useEffect(() => {
    if (!showTagDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
        setTagSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagDropdown]);

  useEffect(() => {
    let isMounted = true;

    const loadTempCategory = async () => {
      try {
        const data = await getTemporaryCategory();
        if (isMounted) setTemporaryCategory(normalizeTemporaryCategory(data));
      } catch (_err) {
        if (!isMounted) return;

        if (!tempLoadErrorRef.current) {
          tempLoadErrorRef.current = true;
          showToast('無法載入暫存分類，已使用預設清單。', 'info');
        }
        setTemporaryCategory((prev) => normalizeTemporaryCategory(prev));
      }
    };

    loadTempCategory();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isCancelled = false;

    const hydrateFromLocalStorage = () => {
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
        const validIds = ids.filter((id): id is string => typeof id === 'string');
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

  const categories = useMemo(
    () => [...baseCategories, temporaryCategory],
    [baseCategories, temporaryCategory]
  );

  const allKaomoji = useMemo(() => categories.flatMap((c) => c.items), [categories]);

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
      for (const item of category.items) {
        map.set(item.id, category.id);
      }
    }
    return map;
  }, [categories]);

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

  const toggleKaomojiSelection = useCallback((kaomojiId: string) => {
    setSelectedKaomojiIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(kaomojiId)) newSet.delete(kaomojiId);
      else newSet.add(kaomojiId);

      return newSet;
    });
  }, []);

  const isTempCategoryChanged = useCallback((prev: CategoryData, next: CategoryData) => {
    return (
      prev.items !== next.items ||
      prev.lastUpdated !== next.lastUpdated ||
      prev.preview !== next.preview ||
      prev.name.en !== next.name.en ||
      prev.name['zh-tw'] !== next.name['zh-tw']
    );
  }, []);

  const setCategoriesProxy = useCallback(
    (updater: SetStateAction<CategoryData[]>) => {
      setBaseCategories((prevBase) => {
        const previousTemp = tempCategoryRef.current ?? temporaryCategory;
        const previousCombined = [...prevBase, previousTemp];
        const nextCombined =
          typeof updater === 'function'
            ? (updater as (prev: CategoryData[]) => CategoryData[])(previousCombined)
            : updater;
        const { base, temp } = splitCategoriesByTemp(nextCombined, previousTemp);

        tempCategoryRef.current = temp;
        if (isTempCategoryChanged(previousTemp, temp)) setTemporaryCategory(temp);

        return base;
      });
    },
    [temporaryCategory, isTempCategoryChanged]
  );

  const onDataChangeProxy = useCallback(
    (updated: CategoryData[]) => {
      const previousTemp = tempCategoryRef.current ?? temporaryCategory;
      const { base, temp } = splitCategoriesByTemp(updated, previousTemp);

      tempCategoryRef.current = temp;
      if (isTempCategoryChanged(previousTemp, temp)) setTemporaryCategory(temp);
      onDataChange(base);
    },
    [onDataChange, temporaryCategory, isTempCategoryChanged]
  );

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
    searchTerm,
    filterTag: filterTags,
    filterCheckedStatus,
    checkedKaomojiIds,
  });

  const selectAllKaomoji = useCallback(() => {
    setSelectedKaomojiIds(new Set(filteredKaomoji.map((k) => k.id)));
  }, [filteredKaomoji]);

  const deselectAllKaomoji = useCallback(() => {
    setSelectedKaomojiIds(new Set());
  }, []);

  const toggleStatusFilter = useCallback((status: 'checked' | 'unchecked') => {
    setCheckedStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);

      return next;
    });
  }, []);

  const handleResetCrossViewSelection = useCallback(() => {
    setSelectedCategory('');
    setFilterTags([]);
    setCheckedStatusFilters(new Set(['unchecked']));
    setSelectedKaomojiIds(new Set());
    clearSelectedKaomoji();
  }, [clearSelectedKaomoji]);

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

  const tagsWithCounts = useMemo(() => {
    const itemsToProcess = selectedCategory
      ? categories.find((c) => c.id === selectedCategory)?.items || []
      : allKaomoji;

    const counts = itemsToProcess.reduce((acc, item) => {
      item.tags.forEach((tag) => acc.set(tag, (acc.get(tag) || 0) + 1));
      return acc;
    }, new Map<string, number>());

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count, label: tagNameMap.get(tag) || tag }))
      .sort((a, b) => a.label.localeCompare(b.label, 'zh-TW'));
  }, [allKaomoji, categories, selectedCategory, tagNameMap]);

  const checkedCount = useMemo(() => {
    const items = selectedCategory
      ? categories.find((c) => c.id === selectedCategory)?.items || []
      : allKaomoji;
    return items.filter((item) => checkedKaomojiIds.has(item.id)).length;
  }, [selectedCategory, categories, checkedKaomojiIds, allKaomoji]);

  const uncheckedCount = useMemo(() => {
    const items = selectedCategory
      ? categories.find((c) => c.id === selectedCategory)?.items || []
      : allKaomoji;
    return items.filter((item) => !checkedKaomojiIds.has(item.id)).length;
  }, [selectedCategory, categories, checkedKaomojiIds, allKaomoji]);

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
    onDataChange: onDataChangeProxy,
    setCategories: setCategoriesProxy,
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
        updateCheckedIdsWithMapping(
          setCheckedKaomojiIds,
          persistCheckedKaomojiIds,
          result.idMapping
        );
        setSelectedKaomoji(result.kaomoji);
      } else clearSelectedKaomoji();
    },
    [
      selectedKaomoji,
      kaomojiToCategoryMap,
      showToast,
      moveKaomoji,
      clearSelectedKaomoji,
      persistCheckedKaomojiIds,
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
      else {
        savedKaomoji = await editKaomoji(categoryId, data.id, { text: data.text, tags: data.tags });
      }

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

  const onSingleDelete = (cId: string, kId: string) => {
    deleteKaomoji(cId, kId).then((success) => {
      if (success && selectedKaomoji?.id === kId) clearSelectedKaomoji({ preserveLast: true });
    });
  };

  const onBulkDelete = () => {
    handleBulkDelete(selectedKaomojiIds).then(() => {
      setSelectedKaomojiIds(new Set());
    });
  };

  const onBulkMove = (targetCategoryId: string) => {
    handleBulkMove(selectedKaomojiIds, targetCategoryId).then((result) => {
      updateCheckedIdsWithMapping(
        setCheckedKaomojiIds,
        persistCheckedKaomojiIds,
        result?.idMapping
      );
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
      .catch(() => {
        /* error toast already handled inside mutation hook */
      });
  };

  if (isLoading) return <Loading />;

  return (
    <div
      className={cn('grid grid-cols-1 gap-4', {
        'md:grid-cols-[2fr_1.5fr]': Boolean(selectedKaomoji),
      })}
    >
      <div className="space-y-3">
        <div className="relative bg-white rounded-lg px-4 sm:px-6 py-3 space-y-2">
          <div className="grid gap-2 xs:gap-2 lg:grid-cols-[1fr_auto_auto]">
            <Input
              value={searchTerm}
              placeholder="搜尋顏文字或標籤"
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md border-gray-300 text-sm"
            />
            <div className="flex flex-wrap gap-2 xs:flex-nowrap lg:contents">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  clearSelectedKaomoji();
                }}
                className="text-xs border border-gray-300 rounded-md focus:outline-none py-2 w-28 lg:w-24 xs:w-28 max-xs:w-full"
              >
                <option value="">選擇分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name['zh-tw']} ({category.items.length})
                  </option>
                ))}
              </select>
              <div className="flex-1 relative min-w-32 lg:min-w-40" ref={tagDropdownRef}>
                <div
                  className={cn(
                    'flex items-center justify-between border border-gray-300 rounded-md px-2 text-xs cursor-pointer focus:outline-none bg-white appearance-none w-full',
                    filterTags.length === 0 ? 'py-2.5' : 'h-[38px]'
                  )}
                  onClick={() => setShowTagDropdown((prev) => !prev)}
                >
                  <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden scrollbar-hide">
                    {filterTags.length > 0 ? (
                      filterTags.map((tagId) => {
                        const tagInfo = tagsWithCounts.find((t) => t.tag === tagId);
                        return (
                          <span
                            key={tagId}
                            className="inline-flex items-center shrink-0 pl-2 pr-1 py-0.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-md mr-1 my-0.5"
                          >
                            {tagInfo?.label || tagId}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterTags((prev) => prev.filter((t) => t !== tagId));
                              }}
                              className="ml-1 text-primary-400 hover:text-primary-600"
                              aria-label={`移除標籤 ${tagInfo?.label || tagId}`}
                            >
                              <CloseIcon className="size-3" />
                            </button>
                          </span>
                        );
                      })
                    ) : (
                      <span className="whitespace-nowrap">選擇標籤</span>
                    )}
                  </div>
                  <ArrowDownIcon className="size-4 ml-1 shrink-0" />
                </div>
                {showTagDropdown && (
                  <div className="absolute z-10 top-full left-0 w-[150%] mt-1 max-h-80 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                    <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="搜索標籤..."
                        value={tagSearchTerm}
                        onChange={(e) => setTagSearchTerm(e.target.value)}
                        className="w-full p-2 text-xs border-none focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="p-1">
                      {tagsWithCounts
                        .filter((tagInfo) =>
                          tagSearchTerm
                            ? tagInfo.label.toLowerCase().includes(tagSearchTerm.toLowerCase())
                            : true
                        )
                        .map((tagInfo) => {
                          const isSelected = filterTags.includes(tagInfo.tag);
                          return (
                            <div
                              key={tagInfo.tag}
                              className={cn(
                                'flex items-center px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-100',
                                isSelected ? 'bg-primary-50' : ''
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterTags((prev) => {
                                  if (isSelected) return prev.filter((t) => t !== tagInfo.tag);
                                  return [...prev, tagInfo.tag];
                                });
                              }}
                            >
                              <div
                                className={cn(
                                  'size-4 mr-2 border rounded flex items-center justify-center',
                                  isSelected
                                    ? 'border-primary-500 bg-primary-500 text-white'
                                    : 'border-gray-300'
                                )}
                              >
                                {isSelected && <CheckIcon className="size-2.5" />}
                              </div>
                              <span className="truncate">
                                {tagInfo.label} ({tagInfo.count})
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-x-3 gap-y-0.5 text-xs text-gray-600">
            <label
              className="flex-center gap-1.5 whitespace-nowrap cursor-pointer"
              onClick={() => toggleStatusFilter('checked')}
            >
              <div
                className={cn(
                  'size-3 border rounded-sm flex-center transition-colors',
                  checkedStatusFilters.has('checked')
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-400 bg-white'
                )}
              >
                {checkedStatusFilters.has('checked') && <CheckIcon className="size-2" />}
              </div>
              <span>已檢查 ({checkedCount})</span>
            </label>
            <label
              className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              onClick={() => toggleStatusFilter('unchecked')}
            >
              <div
                className={cn(
                  'size-3 border rounded-sm flex-center transition-colors',
                  checkedStatusFilters.has('unchecked')
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-gray-400 bg-white'
                )}
              >
                {checkedStatusFilters.has('unchecked') && <CheckIcon className="size-2" />}
              </div>
              <span>未檢查 ({uncheckedCount})</span>
            </label>
          </div>
        </div>
        <div className="bg-white rounded-lg px-4 md:px-6 py-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">分類 × 標籤檢視</h3>
            <div className="flex items-center gap-2">
              <IconBtn
                icon={<ResetIcon />}
                onClick={handleResetCrossViewSelection}
                label="重置交叉檢視篩選"
                size="small"
                className="text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-700"
              />
              <IconBtn
                icon={showCrossView ? <MinusIcon /> : <PlusIcon />}
                onClick={() => setShowCrossView((prev) => !prev)}
                label={showCrossView ? '收合交叉檢視' : '展開交叉檢視'}
                size="small"
                className="text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-700"
              />
            </div>
          </div>
          {showCrossView && (
            <div className="mt-4">
              <CategoryTagCrossView
                categories={categories}
                tagNameMap={tagNameMap}
                checkedKaomojiIds={checkedKaomojiIds}
                onCategoryClick={(categoryId) => {
                  setSelectedCategory(categoryId);
                  setFilterTags([]);
                  setCheckedStatusFilters(new Set(['unchecked']));
                }}
                onTagClick={(categoryId, tagId) => {
                  setSelectedCategory(categoryId);
                  setFilterTags([tagId]);
                  setCheckedStatusFilters(new Set(['unchecked']));
                }}
              />
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg px-4 md:px-6 py-3 shadow-sm">
          <div className="flex-between mb-4">
            <h3 className="text-lg font-semibold">顏文字們 ({filteredKaomoji.length})</h3>
            <SelectAllBtn
              selectedCount={selectedKaomojiIds.size}
              totalCount={filteredKaomoji.length}
              onSelectAll={selectAllKaomoji}
              onDeselectAll={deselectAllKaomoji}
              className="ml-2"
            />
            {selectedKaomojiIds.size > 0 && (
              <IconBtn
                icon={<DeleteIcon />}
                onClick={onBulkDelete}
                label="批量刪除"
                size="medium"
                className="size-fit ml-1 text-rose-600 !border-transparent hover:!bg-white hover:!text-rose-600 hover:!border-transparent"
                disabled={isLoading}
              />
            )}
            <IconBtn
              icon={<PlusIcon />}
              onClick={() => {
                if (!selectedCategory) {
                  showToast('請先選擇一個分類再新增顏文字！', 'error');
                  return;
                }
                setSelectedKaomoji({ id: '', text: '', tags: [] });
              }}
              label="顏文字"
              size="small"
              className="ml-auto"
              disabled={isLoading}
            />
          </div>
          {selectedKaomojiIds.size > 0 && (
            <div className="flex-center gap-3 mb-4 md:max-w-sm">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkMove(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="p-1.5 text-xs border border-gray-300 rounded-md focus:outline-none min-w-28"
              >
                <option value="">移動到...</option>
                {categories
                  .filter((cat) => cat.id !== selectedCategory)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name['zh-tw']}
                    </option>
                  ))}
              </select>
              <Input
                value={tagsToAdd}
                onChange={(e) => setTagsToAdd(e.target.value)}
                placeholder="輸入新標籤（可用逗號或空格分隔）"
                aria-label="輸入新標籤"
                className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:border-blue-400 focus:shadow-blue-100/50"
              />
              <IconBtn
                icon={<PlusIcon />}
                onClick={onBulkAddTags}
                label="新增標籤"
                className="text-blue-600 border-blue-600 hover:bg-blue-600"
                size="small"
              />
            </div>
          )}
          <div className="grid max-h-48 md:max-h-[420px] gap-2 overflow-x-hidden overflow-y-auto grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
            {filteredKaomoji.map((kaomoji) => {
              const isSelected = selectedKaomojiIds.has(kaomoji.id);
              return (
                <div
                  key={kaomoji.id}
                  onClick={() => setSelectedKaomoji(kaomoji)}
                  className={cn(
                    'flex-between w-full px-2.5 py-3 border rounded-lg cursor-pointer transition-colors',
                    isSelected || selectedKaomoji?.id === kaomoji.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKaomojiSelection(kaomoji.id);
                      }}
                      className={cn(
                        'size-4 border-2 rounded flex-center transition-colors',
                        isSelected
                          ? 'border-primary-400 bg-primary-400 text-white'
                          : 'border-gray-300 bg-white text-transparent'
                      )}
                      aria-label={`選取 ${kaomoji.text}`}
                      aria-pressed={isSelected}
                    >
                      <CheckIcon className="size-3" />
                    </button>
                    <p className="text-base text-nowrap sm:text-lg">{kaomoji.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const cId = kaomojiToCategoryMap.get(kaomoji.id);
                      if (cId) onSingleDelete(cId, kaomoji.id);
                      else showToast('無法確定分類！', 'error');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={`刪除 ${kaomoji.text}`}
                  >
                    <CloseIcon className="size-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
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
          onToggleChecked={toggleKaomojiChecked}
          onTagCreated={() => onRefreshIndexData?.()}
        />
      )}
    </div>
  );
};

export default KaomojiManager;
