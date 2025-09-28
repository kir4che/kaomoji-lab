'use client';

import { useState, useMemo, useCallback } from 'react';

import type { CategoryData } from '@/types/Kaomoji';
import { findDuplicateGroups, type DuplicateGroup } from '@/utils/kaomojiDuplicates';
import { cn } from '@/utils/cn';
import IconBtn from '@/components/atoms/IconBtn';
import DeleteIcon from '@/assets/icons/delete.svg';
import CheckIcon from '@/assets/icons/check.svg';
import MinusIcon from '@/assets/icons/minus.svg';

interface DuplicateKaomojiManagerProps {
  categories: CategoryData[];
  onBulkDelete: (kaomojiIds: Set<string>) => Promise<void | null>;
}

const DuplicateKaomojiManager: React.FC<DuplicateKaomojiManagerProps> = ({
  categories,
  onBulkDelete,
}) => {
  const [duplicateThreshold, setDuplicateThreshold] = useState<number>(1);
  const [duplicateStrict, setDuplicateStrict] = useState(true);
  const [duplicateFingerprint, setDuplicateFingerprint] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const duplicateGroups = useMemo(
    () =>
      findDuplicateGroups(categories, {
        threshold: duplicateThreshold,
        strict: duplicateStrict,
        fingerprint: duplicateFingerprint,
        keepStrategy: 'priorities',
      }),
    [categories, duplicateThreshold, duplicateStrict, duplicateFingerprint]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);

      return newSet;
    });
  }, []);

  const toggleSelectGroup = useCallback((group: DuplicateGroup) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      const groupIds = group.items.map((i) => i.id);
      const allSelected = groupIds.every((id) => newSet.has(id));

      if (allSelected) groupIds.forEach((id: string) => newSet.delete(id));
      else groupIds.forEach((id: string) => newSet.add(id));

      return newSet;
    });
  }, []);

  const handleBulkDelete = async () => {
    if (isDeleting || selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      await onBulkDelete(selectedIds);
      setSelectedIds(new Set());
    } catch {
      throw new Error('批量刪除失敗！');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg px-4 md:px-6 py-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-amber-700">重複顏文字檢視</h3>
          <p className="text-xs text-gray-500">
            掃描結果：{duplicateGroups.length} 組，調整判定條件以控制抓取範圍。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1 text-gray-600">
            <span>距離 ≤</span>
            <input
              type="number"
              min={0}
              max={3}
              value={duplicateThreshold}
              onChange={(e) => setDuplicateThreshold(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-xs"
            />
          </label>
          <label className="flex items-center gap-1 text-gray-600">
            <input
              type="checkbox"
              checked={duplicateStrict}
              onChange={(e) => setDuplicateStrict(e.target.checked)}
              className="size-3.5 accent-amber-600"
            />
            <span>保留符號差異</span>
          </label>
          <label className="flex items-center gap-1 text-gray-600">
            <input
              type="checkbox"
              checked={duplicateFingerprint}
              onChange={(e) => setDuplicateFingerprint(e.target.checked)}
              className="size-3.5 accent-amber-600"
            />
            <span>比較手勢/星號</span>
          </label>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-4 border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-600">已選取 {selectedIds.size} 個</p>
          <IconBtn
            icon={<DeleteIcon />}
            onClick={handleBulkDelete}
            label={`刪除 ${selectedIds.size} 個顏文字`}
            size="small"
            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            disabled={isDeleting}
          />
        </div>
      )}

      <div className="mt-4 max-h-[480px] overflow-y-auto pr-1">
        {duplicateGroups.length === 0 ? (
          <div className="rounded-md border border-dashed border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-600">
            目前沒有符合條件的重複顏文字。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {duplicateGroups.map((group: DuplicateGroup) => {
              const allInGroupSelected = group.items.every((i) => selectedIds.has(i.id));
              const someInGroupSelected =
                !allInGroupSelected && group.items.some((i) => selectedIds.has(i.id));

              return (
                <div
                  key={group.id}
                  className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectGroup(group)}
                        className={cn(
                          'size-4 border-2 rounded flex-center transition-colors',
                          allInGroupSelected
                            ? 'border-primary-400 bg-primary-400 text-white'
                            : 'border-gray-300 bg-white text-transparent',
                          someInGroupSelected &&
                            !allInGroupSelected &&
                            'bg-primary-100 border-primary-300'
                        )}
                      >
                        {someInGroupSelected && !allInGroupSelected ? (
                          <MinusIcon className="size-2.5 text-primary-500" />
                        ) : (
                          <CheckIcon className="size-3" />
                        )}
                      </button>
                      <p className="text-sm font-medium text-amber-800">{group.keeper.text}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelection(item.id)}
                          className={cn(
                            'flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors',
                            isSelected
                              ? 'border-rose-200 bg-rose-50/80'
                              : 'border-white bg-white hover:bg-amber-50'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'size-4 border-2 rounded flex-center transition-colors pointer-events-none',
                                isSelected
                                  ? 'border-primary-400 bg-primary-400 text-white'
                                  : 'border-gray-300 bg-white text-transparent'
                              )}
                            >
                              <CheckIcon className="size-3" />
                            </div>
                            <div className="flex flex-col text-sm">
                              <span
                                className={cn(
                                  'font-medium',
                                  isSelected ? 'text-gray-500 line-through' : 'text-gray-800'
                                )}
                              >
                                {item.text}
                              </span>
                              <span
                                className={cn(
                                  'text-xs',
                                  isSelected ? 'text-gray-500 line-through' : 'text-gray-500'
                                )}
                              >
                                {item.categoryName}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateKaomojiManager;
