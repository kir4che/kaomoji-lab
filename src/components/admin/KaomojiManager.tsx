'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import type { KaomojiItem, CategoryData, IndexData } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/utils/cn';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { useKaomojiMutations } from '@/hooks/useKaomojiMutations';
import { getCheckedKaomojiIds, saveCheckedKaomojiIds } from '@/services/adminService';
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

interface KaomojiManagerProps {
  categories: CategoryData[];
  indexData: IndexData;
  onDataChange: (updatedCategories: CategoryData[]) => void;
  onRefreshIndexData?: () => void;
}

const CHECKED_STORAGE_KEY = 'checkedKaomojiIds';

const KaomojiManager: React.FC<KaomojiManagerProps> = ({
  categories: initialCategories,
  indexData,
  onDataChange,
  onRefreshIndexData,
}: KaomojiManagerProps) => {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedKaomoji, setSelectedKaomoji] = useState<KaomojiItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const [selectedKaomojiIds, setSelectedKaomojiIds] = useState<Set<string>>(new Set());
  const [checkedKaomojiIds, setCheckedKaomojiIds] = useState<Set<string>>(new Set());
  const loadErrorNotifiedRef = useRef(false);
  const persistErrorNotifiedRef = useRef(false);
  const [checkedStatusFilters, setCheckedStatusFilters] = useState<Set<'checked' | 'unchecked'>>(
    () => new Set(['unchecked'])
  );
  const filterCheckedStatus = useMemo<'all' | 'checked' | 'unchecked'>(() => {
    if (checkedStatusFilters.size === 0 || checkedStatusFilters.size === 2) return 'all';
    if (checkedStatusFilters.has('checked')) return 'checked';
    return 'unchecked';
  }, [checkedStatusFilters]);

  const [tagsToAdd, setTagsToAdd] = useState('');
  const [showCrossView, setShowCrossView] = useState(false);
  const previousFilteredIdsRef = useRef<string[]>([]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

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
    (ids: Set<string>) => {
      if (typeof window !== 'undefined')
        window.localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(Array.from(ids)));

      saveCheckedKaomojiIds(Array.from(ids))
        .then(() => {
          persistErrorNotifiedRef.current = false;
        })
        .catch((err) => {
          if (err instanceof Error && err.message === 'Checked kaomoji persistence disabled')
            return;
          if (persistErrorNotifiedRef.current) return;
          persistErrorNotifiedRef.current = true;
          showToast('儲存檢查狀態到本機檔案時發生錯誤，只會保留瀏覽器資料。', 'error');
        });
    },
    [showToast]
  );

  const allKaomoji = useMemo(() => categories.flatMap((c) => c.items), [categories]);

  const tagNameMap = useMemo(() => {
    const map = new Map<string, string>();
    indexData.tags.forEach((tag) => {
      if (tag?.id) map.set(tag.id, tag.name?.['zh-tw'] || tag.name?.en || tag.id);
    });
    return map;
  }, [indexData.tags]);

  const tagAliasMap = useMemo(() => {
    const normalize = (value: string) =>
      value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

    const map = new Map<string, string[]>();
    indexData.tags.forEach((tag) => {
      if (!tag?.id) return;
      const aliases = new Set<string>();
      const candidates = [tag.id, tag.name?.en, tag.name?.['zh-tw']].filter(
        (value): value is string => Boolean(value)
      );
      candidates.forEach((value) => aliases.add(normalize(value)));
      const aliasArray = Array.from(aliases);
      map.set(tag.id, aliasArray);
      map.set(normalize(tag.id), aliasArray);
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

  const filteredKaomoji = useFilteredKaomoji({
    sourceKaomojis: allKaomoji,
    allCategories: categories,
    selectedCategory,
    searchTerm,
    filterTag,
    filterCheckedStatus,
    checkedKaomojiIds,
    tagAliasMap,
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
    setFilterTag('');
    setCheckedStatusFilters(new Set(['unchecked']));
    setSelectedKaomojiIds(new Set());
    setSelectedKaomoji(null);
  }, [
    setSelectedCategory,
    setFilterTag,
    setCheckedStatusFilters,
    setSelectedKaomojiIds,
    setSelectedKaomoji,
  ]);

  useEffect(() => {
    if (filteredKaomoji.length === 0) {
      if (selectedKaomoji) setSelectedKaomoji(null);
      previousFilteredIdsRef.current = [];
      return;
    }

    const currentIndex = selectedKaomoji
      ? filteredKaomoji.findIndex((item) => item.id === selectedKaomoji.id)
      : -1;

    if (currentIndex === -1) {
      const previousIds = previousFilteredIdsRef.current;
      const previousIndex = selectedKaomoji ? previousIds.indexOf(selectedKaomoji.id) : -1;
      const nextIndex =
        previousIndex >= 0 ? Math.min(previousIndex, filteredKaomoji.length - 1) : 0;
      const nextSelection = filteredKaomoji[nextIndex];
      if (nextSelection) setSelectedKaomoji(nextSelection);
      else setSelectedKaomoji(null);
    }

    previousFilteredIdsRef.current = filteredKaomoji.map((item) => item.id);
  }, [filteredKaomoji, selectedKaomoji]);

  const tagsWithCounts = useMemo(() => {
    const counts: { [tag: string]: number } = {};
    let itemsToProcess: KaomojiItem[] = [];

    if (selectedCategory) {
      const category = categories.find((c) => c.id === selectedCategory);
      itemsToProcess = category ? category.items : [];
    } else itemsToProcess = allKaomoji;

    itemsToProcess.forEach((item) => {
      item.tags.forEach((tag) => (counts[tag] = (counts[tag] || 0) + 1));
    });
    return Object.keys(counts)
      .map((tag) => ({ tag, count: counts[tag], label: tagNameMap.get(tag) || tag }))
      .sort((a, b) => a.label.localeCompare(b.label, 'zh-TW'));
  }, [allKaomoji, categories, selectedCategory, tagNameMap]);

  const checkedCount = useMemo(() => {
    if (selectedCategory) {
      const category = categories.find((c) => c.id === selectedCategory);
      return category ? category.items.filter((item) => checkedKaomojiIds.has(item.id)).length : 0;
    }
    return checkedKaomojiIds.size;
  }, [selectedCategory, categories, checkedKaomojiIds]);

  const uncheckedCount = useMemo(() => {
    if (selectedCategory) {
      const category = categories.find((c) => c.id === selectedCategory);
      return category ? category.items.filter((item) => !checkedKaomojiIds.has(item.id)).length : 0;
    }
    return allKaomoji.length - checkedKaomojiIds.size;
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
      const movedKaomoji = await moveKaomoji(fromCategoryId, toCategoryId, kaomojiToProcess);
      if (movedKaomoji) setSelectedKaomoji(movedKaomoji);
      else setSelectedKaomoji(null);
    },
    [selectedKaomoji, kaomojiToCategoryMap, showToast, moveKaomoji]
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
      else if (data.id === '') setSelectedKaomoji(null);
    },
    [kaomojiToCategoryMap, selectedCategory, selectedKaomoji, addKaomoji, editKaomoji, showToast]
  );

  const onSingleDelete = (cId: string, kId: string) => {
    deleteKaomoji(cId, kId).then((success) => {
      if (success && selectedKaomoji?.id === kId) setSelectedKaomoji(null);
    });
  };

  const onBulkDelete = () => {
    handleBulkDelete(selectedKaomojiIds).then(() => {
      setSelectedKaomojiIds(new Set());
    });
  };

  const onBulkMove = (targetCategoryId: string) => {
    handleBulkMove(selectedKaomojiIds, targetCategoryId).then(() =>
      setSelectedKaomojiIds(new Set())
    );
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
        <div className="relative bg-white rounded-lg px-4 sm:px-6 py-3">
          <div className="flex flex-col gap-2 xs:flex-row xs:gap-1.5">
            <Input
              value={searchTerm}
              placeholder="搜尋顏文字或標籤"
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md border-gray-300 text-sm h-12 xs:flex-[2]"
            />
            <div className="flex flex-wrap gap-2 xs:flex-nowrap xs:flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedKaomoji(null);
                }}
                className="flex-1 text-xs xs:text-sm p-1.5 border border-gray-300 rounded-md focus:outline-none"
              >
                <option value="">選擇分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name['zh-tw']} ({category.items.length})
                  </option>
                ))}
              </select>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="flex-1 text-xs xs:text-sm p-1.5 border border-gray-300 rounded-md focus:outline-none"
              >
                <option value="">選擇標籤</option>
                {tagsWithCounts.map((tagInfo) => (
                  <option key={tagInfo.tag} value={tagInfo.tag}>
                    {tagInfo.label} ({tagInfo.count})
                  </option>
                ))}
              </select>
              <div className="flex flex-1 xs:flex-col gap-x-3 gap-y-0.5 border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-600">
                <label className="flex items-center gap-1 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="size-2.5 accent-primary-500"
                    checked={checkedStatusFilters.has('checked')}
                    onChange={() => toggleStatusFilter('checked')}
                  />
                  <span>已檢查 ({checkedCount})</span>
                </label>
                <label className="flex items-center gap-1 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="size-2.5 accent-primary-500"
                    checked={checkedStatusFilters.has('unchecked')}
                    onChange={() => toggleStatusFilter('unchecked')}
                  />
                  <span>未檢查 ({uncheckedCount})</span>
                </label>
              </div>
            </div>
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
                  setFilterTag('');
                  setCheckedStatusFilters(new Set(['unchecked']));
                }}
                onTagClick={(categoryId, tagId) => {
                  setSelectedCategory(categoryId);
                  setFilterTag(tagId);
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
