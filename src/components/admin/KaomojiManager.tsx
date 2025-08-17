'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import type { KaomojiItem, CategoryData, IndexData } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/utils/cn';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { useKaomojiMutations } from '@/hooks/useKaomojiMutations';
import KaomojiEditor from '@/components/admin/KaomojiEditor';
import Input from '@/components/atoms/Input';
import IconBtn from '@/components/atoms/IconBtn';
import SelectAllBtn from '@/components/atoms/SelectAllBtn';
import Loading from '@/components/atoms/Loading';
import PlusIcon from '@/assets/icons/plus.svg';
import MinusIcon from '@/assets/icons/minus.svg';
import CloseIcon from '@/assets/icons/close.svg';
import CheckIcon from '@/assets/icons/check.svg';

interface KaomojiManagerProps {
  categories: CategoryData[];
  indexData: IndexData;
  onDataChange: (updatedCategories: CategoryData[]) => void;
}

const KaomojiManager: React.FC<KaomojiManagerProps> = ({
  categories: initialCategories,
  indexData,
  onDataChange,
}: KaomojiManagerProps) => {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedKaomoji, setSelectedKaomoji] = useState<KaomojiItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const [selectedKaomojiIds, setSelectedKaomojiIds] = useState<Set<string>>(new Set());
  const [checkedKaomojiIds, setCheckedKaomojiIds] = useState<Set<string>>(() => {
    const savedCheckedIds = localStorage.getItem('checkedKaomojiIds');
    return savedCheckedIds ? new Set(JSON.parse(savedCheckedIds)) : new Set();
  });
  const [filterCheckedStatus, setFilterCheckedStatus] = useState<'all' | 'checked' | 'unchecked'>(
    'unchecked'
  );

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [tagsToAdd, setTagsToAdd] = useState('');
  const [tagsToRemove, setTagsToRemove] = useState('');

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const allKaomoji = useMemo(() => categories.flatMap((c) => c.items), [categories]);

  const kaomojiToCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      for (const item of category.items) {
        map.set(item.id, category.id);
      }
    }
    return map;
  }, [categories]);

  const toggleKaomojiChecked = useCallback((kaomojiId: string) => {
    setCheckedKaomojiIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(kaomojiId)) newSet.delete(kaomojiId);
      else newSet.add(kaomojiId);
      localStorage.setItem('checkedKaomojiIds', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, []);

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
  });

  const selectAllKaomoji = useCallback(() => {
    setSelectedKaomojiIds(new Set(filteredKaomoji.map((k) => k.id)));
  }, [filteredKaomoji]);

  const deselectAllKaomoji = useCallback(() => {
    setSelectedKaomojiIds(new Set());
  }, []);

  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode((prev) => {
      if (prev) {
        if (selectedKaomojiIds.size === 1) {
          const selectedId = selectedKaomojiIds.values().next().value;
          let kaomojiToSelect = null;
          for (const category of categories) {
            const found = category.items.find((k) => k.id === selectedId);
            if (found) {
              kaomojiToSelect = found;
              break;
            }
          }
          if (kaomojiToSelect) setSelectedKaomoji(kaomojiToSelect);
        }
        setSelectedKaomojiIds(new Set());
      }
      return !prev;
    });
  }, [selectedKaomojiIds, categories]);

  useEffect(() => {
    if (!selectedKaomoji && filteredKaomoji.length > 0 && !isMultiSelectMode)
      setSelectedKaomoji(filteredKaomoji[0]);
    if (isMultiSelectMode) setSelectedKaomoji(null);
  }, [filteredKaomoji, selectedKaomoji, isMultiSelectMode]);

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
      .map((tag) => ({ tag, count: counts[tag] }))
      .sort((a, b) => a.tag.localeCompare(b.tag, 'zh-TW'));
  }, [allKaomoji, categories, selectedCategory]);

  const {
    isLoading,
    addKaomoji,
    editKaomoji,
    deleteKaomoji,
    moveKaomoji,
    handleBulkDelete,
    handleBulkMove,
    handleBulkAddTags,
    handleBulkRemoveTags,
  } = useKaomojiMutations({
    categories,
    onDataChange,
    setCategories,
    kaomojiToCategoryMap,
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
    handleBulkAddTags(selectedKaomojiIds, tagsToAdd).then(() => {
      setTagsToAdd('');
      setSelectedKaomojiIds(new Set());
    });
  };

  const onBulkRemoveTags = () => {
    if (!tagsToRemove.trim()) {
      showToast('請輸入要移除的標籤！', 'info');
      return;
    }

    const tagsToRemoveList = tagsToRemove
      .split(/[,，、\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (tagsToRemoveList.length === 0) {
      showToast('無效的標籤輸入！', 'info');
      return;
    }

    handleBulkRemoveTags(selectedKaomojiIds, tagsToRemove)
      .then(() => {
        setTagsToRemove('');
        setSelectedKaomojiIds(new Set());
        showToast(`已成功移除選定的標籤！`, 'success');
      })
      .catch(() => {
        showToast('移除標籤時發生錯誤！', 'error');
      });
  };

  if (isLoading) return <Loading />;

  return (
    <div
      className={cn('grid grid-cols-1 gap-4', {
        'md:grid-cols-[2fr_1.5fr]': !isMultiSelectMode && selectedKaomoji,
      })}
    >
      <div className="space-y-3">
        <div className="relative bg-white rounded-lg px-4 sm:px-6 py-3">
          <div className="flex gap-x-1.5">
            <Input
              value={searchTerm}
              placeholder="搜尋顏文字或標籤"
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded-md border-gray-300 flex-2 text-xs xs:text-sm"
            />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedKaomoji(null);
              }}
              className={cn(
                'text-xs xs:text-sm p-1.5 border border-gray-300 rounded-md focus:outline-none flex-1',
                isMultiSelectMode ? 'max-w-36' : 'max-w-24'
              )}
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
              className={cn(
                'text-xs xs:text-sm p-1.5 border border-gray-300 rounded-md focus:outline-none flex-1',
                isMultiSelectMode ? 'max-w-36' : 'max-w-24'
              )}
            >
              <option value="">選擇標籤</option>
              {tagsWithCounts.map((tagInfo) => (
                <option key={tagInfo.tag} value={tagInfo.tag}>
                  {tagInfo.tag} ({tagInfo.count})
                </option>
              ))}
            </select>
            <select
              value={filterCheckedStatus}
              onChange={(e) =>
                setFilterCheckedStatus(e.target.value as 'all' | 'checked' | 'unchecked')
              }
              className={cn(
                'text-xs xs:text-sm p-1 border border-gray-300 rounded-md focus:outline-none flex-1',
                isMultiSelectMode ? 'max-w-28' : 'max-w-24'
              )}
            >
              <option value="all">全部</option>
              <option value="checked">
                已檢查 (
                {selectedCategory
                  ? categories
                      .find((c) => c.id === selectedCategory)
                      ?.items.filter((item) => checkedKaomojiIds.has(item.id)).length || 0
                  : Array.from(checkedKaomojiIds).length}
                )
              </option>
              <option value="unchecked">
                未檢查 (
                {selectedCategory
                  ? categories
                      .find((c) => c.id === selectedCategory)
                      ?.items.filter((item) => !checkedKaomojiIds.has(item.id)).length || 0
                  : allKaomoji.length - Array.from(checkedKaomojiIds).length}
                )
              </option>
            </select>
          </div>
        </div>
        <div className="bg-white rounded-lg px-4 md:px-6 py-3 shadow-sm">
          <div className="flex-between mb-4">
            <h3 className="text-lg font-semibold">顏文字們 ({filteredKaomoji.length}) </h3>
            <div className={cn('flex-center mt-1 gap-x-2')}>
              {isMultiSelectMode ? (
                <>
                  <SelectAllBtn
                    selectedCount={selectedKaomojiIds.size}
                    totalCount={filteredKaomoji.length}
                    onSelectAll={selectAllKaomoji}
                    onDeselectAll={deselectAllKaomoji}
                  />
                  <button
                    type="button"
                    onClick={toggleMultiSelectMode}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="退出多選模式"
                  >
                    <CloseIcon className="size-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleMultiSelectMode}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-primary-600 border border-primary-300"
                  >
                    多選模式
                  </button>
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
                    disabled={isLoading}
                  />
                </>
              )}
            </div>
          </div>
          {isMultiSelectMode && selectedKaomojiIds.size > 0 && (
            <div className="flex flex-col gap-y-3 mb-6">
              <div className="flex-center gap-x-3">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onBulkMove(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="flex-1 p-1.5 text-xs border border-gray-300 rounded-md focus:outline-none"
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
                <button
                  type="button"
                  onClick={onBulkDelete}
                  className="px-3 py-2 text-xs bg-rose-100/50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100"
                  disabled={isLoading}
                >
                  批量刪除
                </button>
              </div>
              <div className="flex-center gap-x-2 flex-1">
                <div className="flex-center gap-x-1.5 w-full">
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
                    className="text-blue-600  border-blue-600 hover:bg-blue-600"
                    size="small"
                  />
                </div>
                <div className="flex-center gap-x-1.5 w-full">
                  <Input
                    value={tagsToRemove}
                    onChange={(e) => setTagsToRemove(e.target.value)}
                    placeholder="輸入要移除的標籤（可用逗號或空格分隔）"
                    aria-label="輸入要移除的標籤"
                    className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:border-rose-400 focus:shadow-rose-100/50"
                  />
                  <IconBtn
                    icon={<MinusIcon />}
                    onClick={onBulkRemoveTags}
                    label="移除標籤"
                    className="text-rose-600 border-rose-600 hover:bg-rose-600"
                    size="small"
                  />
                </div>
              </div>
            </div>
          )}
          <div
            className={cn(
              'grid max-h-48 md:max-h-[420px] gap-2 overflow-x-hidden overflow-y-auto',
              isMultiSelectMode
                ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-2 lg:grid-cols-3'
            )}
          >
            {filteredKaomoji.map((kaomoji) => {
              const isSelected = selectedKaomojiIds.has(kaomoji.id);
              return (
                <div
                  key={kaomoji.id}
                  onClick={() => {
                    if (isMultiSelectMode) toggleKaomojiSelection(kaomoji.id);
                    else setSelectedKaomoji(kaomoji);
                  }}
                  className={cn(
                    'flex-between w-full px-2.5 py-3 border rounded-lg cursor-pointer transition-colors',
                    (isMultiSelectMode && isSelected) || selectedKaomoji?.id === kaomoji.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isMultiSelectMode && (
                      <div
                        className={cn(
                          'size-4 border-2 rounded flex-center transition-colors',
                          isSelected ? 'border-primary-400 bg-primary-400' : 'border-gray-300'
                        )}
                      >
                        <CheckIcon className="size-3 text-white" />
                      </div>
                    )}
                    <p
                      className={cn('text-base text-nowrap', { 'sm:text-lg': !isMultiSelectMode })}
                    >
                      {kaomoji.text}
                    </p>
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
      {selectedKaomoji && !isMultiSelectMode && (
        <KaomojiEditor
          kaomoji={selectedKaomoji}
          categories={categories}
          allTags={indexData.tags}
          currCategory={kaomojiToCategoryMap.get(selectedKaomoji.id) || selectedCategory}
          onSave={handleSave}
          onMove={handleMoveFromEditor}
          isChecked={selectedKaomoji && checkedKaomojiIds.has(selectedKaomoji.id)}
          onToggleChecked={toggleKaomojiChecked}
        />
      )}
    </div>
  );
};

export default KaomojiManager;
