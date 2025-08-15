'use client';

import { FC, FormEvent } from 'react';

import type { KaomojiItem } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/utils/cn';
import { useTagManager } from '@/hooks/useTagManager';
import EditCard from '@/components/admin/EditCard';
import Input from '@/components/atoms/Input';
import SelectAllBtn from '@/components/atoms/SelectAllBtn';
import Modal from '@/components/molecules/Modal';
import SortingDropdown from '@/components/molecules/SortingDropdown';
import IconBtn from '@/components/atoms/IconBtn';
import CloseIcon from '@/assets/icons/close.svg';
import CheckIcon from '@/assets/icons/check.svg';
import DeleteIcon from '@/assets/icons/delete.svg';

interface TagManagerProps {
  allKaomoji: KaomojiItem[];
  allTags: string[];
  onDataChange: () => void;
}

const SORT_OPTIONS = [
  { value: 'count', label: '數量' },
  { value: 'name', label: '名稱' },
];

const TagManager: FC<TagManagerProps> = ({ allKaomoji, allTags, onDataChange }) => {
  const { showToast } = useToast();
  const {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    usageThreshold,
    setUsageThreshold,
    showLowUsageOnly,
    setShowLowUsageOnly,
    expandedTag,
    selectedKaomojiIds,
    setSelectedKaomojiIds,
    editingTag,
    setEditingTag,
    newTagName,
    setNewTagName,
    isMergeMode,
    tagsToMerge,
    isMergeModalOpen,
    setIsMergeModalOpen,
    finalMergeTag,
    setFinalMergeTag,
    isDeleteTagsMode,
    tagsToDeleteBulk,
    setTagsToDeleteBulk,
    filteredTags,
    lowUsageCount,
    toggleKaomojiSelection,
    handleRemoveTagFromSelected,
    handleRenameTag,
    handleDeleteTag,
    handleMergeTags,
    handleBulkDeleteTags,
    toggleMergeMode,
    toggleDeleteMode,
    handleTagClick,
  } = useTagManager({ allKaomoji, allTags, onDataChange });

  return (
    <>
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex-between">
          <h3 className="text-xl font-semibold text-gray-800 -mt-1">標籤管理 ({allTags.length})</h3>
          <div className="flex-center gap-x-2">
            <button
              type="button"
              onClick={toggleMergeMode}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                isMergeMode
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {isMergeMode ? '正在合併' : '合併標籤'}
            </button>
            <button
              type="button"
              onClick={toggleDeleteMode}
              className={
                isDeleteTagsMode
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'rounded-md border px-3 py-1.5 text-xs font-medium border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }
              aria-label={isDeleteTagsMode ? '退出多選模式' : '多選模式'}
            >
              {isDeleteTagsMode ? <CloseIcon className="size-5" /> : '多選模式'}
            </button>
          </div>
        </div>
        <div className="flex-between flex-col-reverse sm:flex-row gap-y-2">
          <div className="flex-center gap-x-2.5 mr-auto">
            <div className="flex-center">
              <label htmlFor="threshold" className="text-xs text-gray-600 mr-2">
                低頻
              </label>
              <Input
                id="threshold"
                type="number"
                value={String(usageThreshold)}
                onChange={(e) => setUsageThreshold(Number(e.target.value))}
                className="w-12 rounded-md border pl-1.5 pr-0 py-1 text-sm"
              />
              {lowUsageCount > 0 && (
                <IconBtn
                  icon={showLowUsageOnly ? <CloseIcon /> : <CheckIcon />}
                  onClick={() => setShowLowUsageOnly(!showLowUsageOnly)}
                  label={showLowUsageOnly ? '顯示所有' : `只顯示低頻 (${lowUsageCount})`}
                  size="small"
                />
              )}
            </div>
            {isMergeMode ? (
              <button
                onClick={() => {
                  if (tagsToMerge.size < 2) {
                    showToast('請至少選擇兩個標籤進行合併！', 'info');
                    return;
                  }
                  setFinalMergeTag(Array.from(tagsToMerge)[0]);
                  setIsMergeModalOpen(true);
                }}
                disabled={tagsToMerge.size < 2}
                className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-500 hover:bg-blue-100/80"
              >
                合併選中項 ({tagsToMerge.size})
              </button>
            ) : (
              isDeleteTagsMode && (
                <div className="flex-center gap-x-2">
                  <SelectAllBtn
                    selectedCount={tagsToDeleteBulk.size}
                    totalCount={filteredTags.length}
                    onSelectAll={() => setTagsToDeleteBulk(new Set(filteredTags.map((t) => t.tag)))}
                    onDeselectAll={() => setTagsToDeleteBulk(new Set())}
                    showCount
                  />
                  <button
                    onClick={handleBulkDeleteTags}
                    disabled={tagsToDeleteBulk.size === 0}
                    className="text-gray-600 hover:text-rose-600"
                    aria-label="刪除標籤"
                    title="刪除標籤"
                  >
                    <DeleteIcon className="size-5" />
                  </button>
                </div>
              )
            )}
          </div>
          <div className="flex-center gap-x-2 w-full sm:w-fit ml-auto">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋標籤..."
              className=" py-2 border rounded-md"
            />
            <SortingDropdown
              sortBy={sortBy}
              sortOrder={sortOrder}
              options={SORT_OPTIONS}
              onSortByChange={(value) => setSortBy(value as 'name' | 'count')}
              onSortOrderChange={setSortOrder}
            />
          </div>
        </div>
        <div
          className={cn(
            'grid grid-cols-1 gap-3 overflow-y-auto xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
            expandedTag ? 'max-h-[240px]' : 'max-h-[480px]'
          )}
        >
          {filteredTags.map((tagUsage) => {
            const isSelectedForMerge = isMergeMode && tagsToMerge.has(tagUsage.tag);
            const isSelectedForDelete = isDeleteTagsMode && tagsToDeleteBulk.has(tagUsage.tag);
            const isSelected = isSelectedForMerge || isSelectedForDelete;

            return (
              <div
                key={tagUsage.tag}
                className={cn('rounded-lg transition-all', {
                  'border-2 border-blue-400': isSelectedForMerge,
                  'border-2 border-rose-400': isSelectedForDelete,
                })}
              >
                <EditCard
                  type="tag"
                  title={tagUsage.tag}
                  count={tagUsage.count}
                  onClick={() => handleTagClick(tagUsage.tag)}
                  handleEdit={() => setEditingTag(tagUsage.tag)}
                  handleDelete={() => handleDeleteTag(tagUsage.tag)}
                  isEditDisabled={isMergeMode || isDeleteTagsMode}
                  isDeleteDisabled={isMergeMode || isDeleteTagsMode}
                  className={cn('cursor-pointer hover:bg-gray-50')}
                  extraContent={
                    <>
                      {isSelected && (
                        <div className="flex-center">
                          <div
                            className={cn(
                              'flex-center size-5 rounded-full text-white',
                              isSelectedForMerge && 'bg-blue-500',
                              isSelectedForDelete && 'bg-rose-500'
                            )}
                          >
                            <CheckIcon className="size-3" />
                          </div>
                        </div>
                      )}
                      {tagUsage.count === 0 && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                          未使用
                        </span>
                      )}
                    </>
                  }
                />
              </div>
            );
          })}
        </div>
        {expandedTag &&
          !isMergeMode &&
          !isDeleteTagsMode &&
          (() => {
            const expandedTagData = filteredTags.find((t) => t.tag === expandedTag);
            if (!expandedTagData) return null;

            return (
              <div className="rounded-lg bg-primary-50 p-4">
                <div className="flex-between mb-3">
                  <h4 className="font-medium text-gray-800">標籤「{expandedTag}」的顏文字</h4>
                  <div className="flex-center gap-x-2">
                    <SelectAllBtn
                      selectedCount={
                        expandedTagData.kaomojis.filter((k) => selectedKaomojiIds.has(k.id)).length
                      }
                      totalCount={expandedTagData.kaomojis.length}
                      onSelectAll={() =>
                        setSelectedKaomojiIds(new Set(expandedTagData.kaomojis.map((k) => k.id)))
                      }
                      onDeselectAll={() => setSelectedKaomojiIds(new Set())}
                      showCount
                    />
                    <button
                      onClick={() => handleRemoveTagFromSelected(expandedTag)}
                      disabled={selectedKaomojiIds.size === 0}
                      className="text-gray-600 hover:text-rose-600"
                      aria-label="刪除"
                      title="刪除"
                    >
                      <DeleteIcon className="size-5" />
                    </button>
                  </div>
                </div>
                <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                  {expandedTagData.kaomojis.map((kaomoji) => (
                    <div
                      key={kaomoji.id}
                      onClick={() => toggleKaomojiSelection(kaomoji.id)}
                      className={cn(
                        'flex items-center cursor-pointer gap-x-1.5 rounded-md border bg-white p-2',
                        selectedKaomojiIds.has(kaomoji.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'flex-center size-3.5 rounded-full',
                          selectedKaomojiIds.has(kaomoji.id)
                            ? 'bg-primary-400'
                            : 'border border-gray-300'
                        )}
                      >
                        <CheckIcon
                          className={cn(
                            'size-3',
                            selectedKaomojiIds.has(kaomoji.id) ? 'text-white' : 'text-transparent'
                          )}
                        />
                      </div>
                      <p className="truncate text-sm">{kaomoji.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
      </div>
      <Modal isOpen={!!editingTag} onClose={() => setEditingTag(null)} title="重新命名標籤">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            handleRenameTag();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">原標籤名稱</label>
            <Input
              type="text"
              value={editingTag || ''}
              disabled
              onChange={() => {}}
              className="w-full rounded-md border border-gray-300 px-2.5 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">新標籤名稱</label>
            <Input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2.5 py-2"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setEditingTag(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!newTagName.trim() || newTagName.trim() === editingTag}
              className="rounded-md bg-primary-500 px-4 py-2 text-white hover:bg-primary-600"
            >
              重命名
            </button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="合併標籤">
        <div className="space-y-4">
          <p>您將合併以下 {tagsToMerge.size} 個標籤：</p>
          <div className="flex flex-wrap gap-x-2">
            {Array.from(tagsToMerge).map((tag) => (
              <span key={tag} className="rounded-md bg-gray-200 px-2 py-1 text-sm">
                {tag}
              </span>
            ))}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              選擇或輸入最終的標籤名稱
            </label>
            <Input
              value={finalMergeTag}
              onChange={(e) => setFinalMergeTag(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2.5 py-2"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsMergeModalOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleMergeTags}
              disabled={!finalMergeTag.trim()}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              確定合併
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TagManager;
