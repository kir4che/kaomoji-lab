'use client';

import { FC, FormEvent } from 'react';

import type { CategoryData, KaomojiItem, Tag } from '@/types/Kaomoji';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTagManager } from '@/hooks/useTagManager';
import { cn } from '@/utils/cn';
import Input from '@/components/atoms/Input';
import SortingDropdown from '@/components/molecules/SortingDropdown';
import IconBtn from '@/components/atoms/IconBtn';
import EditCard from '@/components/admin/EditCard';
import Loading from '@/components/atoms/Loading';
import { Icon } from '@/components/atoms/Icon';
import SelectAllBtn from '@/components/atoms/SelectAllBtn';
import Modal from '@/components/molecules/Modal';

import TagModal from './TagModal';

interface TagManagerProps {
  categories: CategoryData[];
  allKaomoji: KaomojiItem[];
  tags: Tag[];
  onTagsChange: (updatedTags: Tag[]) => void;
  onCategoriesChange: (updatedCategories: CategoryData[]) => void;
}

const SORT_OPTIONS = [
  { value: 'count', label: '數量' },
  { value: 'name', label: '名稱' },
];

const TagManager: FC<TagManagerProps> = ({
  categories,
  allKaomoji,
  tags,
  onTagsChange,
  onCategoriesChange,
}) => {
  const { lang } = useLanguage();
  const {
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
  } = useTagManager({ categories, allKaomoji, tags, onTagsChange, onCategoriesChange });

  const expandedTagData = expandedTag ? processedTags.find((t) => t.id === expandedTag) : null;
  const filteredKaomojis = expandedTag ? filteredExpandedTagKaomojis : [];
  const secondaryFilterValue = crossFilterTagIds[0] ?? '';

  const crossFilterOptions = Array.from(tagUsageMap.values())
    .filter((tag) => tag.id !== expandedTag)
    .map((tag) => ({
      id: tag.id,
      label: tag.name[lang],
    }));

  return (
    <>
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex-between">
          <h3 className="text-xl font-semibold text-gray-800">標籤管理 ({processedTags.length})</h3>
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
              className={cn(
                'transition-colors',
                isDeleteTagsMode
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'rounded-md border px-3 py-1.5 text-xs font-medium border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              )}
              aria-label={isDeleteTagsMode ? '退出多選模式' : '多選模式'}
            >
              {isDeleteTagsMode ? <Icon name="close" className="size-5" /> : '多選模式'}
            </button>
            <button
              type="button"
              onClick={() => openModal()}
              className="rounded-md border border-primary-500 bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600"
            >
              新增標籤
            </button>
          </div>
        </div>

        <div className="flex-between flex-col sm:flex-row gap-y-2">
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
                  icon={showLowUsageOnly ? <Icon name="close" /> : <Icon name="check" />}
                  onClick={() => setShowLowUsageOnly(!showLowUsageOnly)}
                  label={showLowUsageOnly ? '顯示所有' : `只顯示低頻 (${lowUsageCount})`}
                  size="small"
                />
              )}
            </div>
            {isMergeMode ? (
              <button
                onClick={() => {
                  if (tagsToMerge.size < 2) return;
                  const firstTagId = Array.from(tagsToMerge)[0];
                  const fallbackName = tagUsageMap.get(firstTagId)?.name['zh-tw'] ?? '';
                  setFinalMergeTagName(fallbackName);
                  setIsMergeModalOpen(true);
                }}
                disabled={tagsToMerge.size < 2}
                className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-500 hover:bg-blue-100/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                合併選中項 ({tagsToMerge.size})
              </button>
            ) : (
              isDeleteTagsMode && (
                <div className="flex-center gap-x-2">
                  <SelectAllBtn
                    selectedCount={tagsToDeleteBulk.size}
                    totalCount={processedTags.length}
                    onSelectAll={() => setTagsToDeleteBulk(new Set(processedTags.map((t) => t.id)))}
                    onDeselectAll={() => setTagsToDeleteBulk(new Set())}
                    showCount
                  />
                  <button
                    onClick={handleBulkDeleteTags}
                    disabled={tagsToDeleteBulk.size === 0}
                    className="text-gray-600 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="刪除標籤"
                    title="刪除標籤"
                  >
                    <Icon name="delete" className="size-5" />
                  </button>
                </div>
              )
            )}
          </div>
          <div className="flex-center gap-x-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋標籤..."
              className="w-full py-2 border rounded-md"
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

        {isLoading ? (
          <Loading />
        ) : (
          <div
            className={cn(
              'grid grid-cols-1 gap-3 overflow-y-auto xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
              expandedTag ? 'max-h-60' : 'max-h-120'
            )}
          >
            {processedTags.map((tag) => {
              const isSelectedForMerge = isMergeMode && tagsToMerge.has(tag.id);
              const isSelectedForDelete = isDeleteTagsMode && tagsToDeleteBulk.has(tag.id);
              const isSelected = isSelectedForMerge || isSelectedForDelete;
              return (
                <div
                  key={tag.id}
                  className={cn('rounded-lg transition-all', {
                    'border-2 border-blue-400': isSelectedForMerge,
                    'border-2 border-rose-400': isSelectedForDelete,
                  })}
                >
                  <EditCard
                    type="tag"
                    title={tag.name[lang]}
                    count={tag.count}
                    onClick={() => handleTagClick(tag.id)}
                    handleEdit={() => openModal(tag)}
                    handleDelete={() => handleDelete(tag.id)}
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
                              <Icon name="check" className="size-3" />
                            </div>
                          </div>
                        )}
                        {tag.count === 0 && (
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
        )}
        {expandedTagData && !isMergeMode && !isDeleteTagsMode && (
          <div className="rounded-lg bg-primary-50 p-4">
            <div className="flex-between mb-3">
              <h4 className="font-medium text-gray-800">
                標籤「{expandedTagData.name[lang]}」的顏文字
              </h4>
              <div className="flex-center gap-x-2">
                <SelectAllBtn
                  selectedCount={selectedKaomojiIds.size}
                  totalCount={filteredKaomojis.length}
                  onSelectAll={() =>
                    setSelectedKaomojiIds(new Set(filteredKaomojis.map((k) => k.id)))
                  }
                  onDeselectAll={() => setSelectedKaomojiIds(new Set())}
                  showCount
                />
                <button
                  onClick={() => handleRemoveTagFromSelected(expandedTagData.id)}
                  disabled={selectedKaomojiIds.size === 0}
                  className="text-gray-600 hover:text-rose-600"
                  aria-label="刪除"
                  title="刪除"
                >
                  <Icon name="delete" className="size-5" />
                </button>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <label htmlFor="cross-filter" className="text-xs text-gray-600">
                交叉篩選
              </label>
              <select
                id="cross-filter"
                value={secondaryFilterValue}
                onChange={(event) => {
                  const value = event.target.value;
                  setCrossFilterTagIds(value ? [value] : []);
                }}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm"
              >
                <option value="">全部顯示</option>
                {crossFilterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {crossFilterTagIds.length > 0 && (
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-600">
                    {tagUsageMap.get(crossFilterTagIds[0])?.name[lang] ?? crossFilterTagIds[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCrossFilterTagIds([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    清除
                  </button>
                </span>
              )}
            </div>
            <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
              {filteredKaomojis.length > 0 ? (
                filteredKaomojis.map((kaomoji) => (
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
                      <Icon
                        name="check"
                        className={cn(
                          'size-3',
                          selectedKaomojiIds.has(kaomoji.id) ? 'text-white' : 'text-transparent'
                        )}
                      />
                    </div>
                    <p className="truncate text-sm">{kaomoji.text}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex justify-center rounded-md border border-dashed border-gray-300 bg-white py-6 text-sm text-gray-500">
                  沒有符合交叉篩選的顏文字
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <TagModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} tag={editingTag} />
      <Modal isOpen={isMergeModalOpen} onClose={closeModal} title="合併標籤">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            handleMergeTags();
          }}
          className="space-y-4"
        >
          <p>您將合併以下 {tagsToMerge.size} 個標籤：</p>
          <div className="flex flex-wrap gap-x-2">
            {Array.from(tagsToMerge).map((tagId) => (
              <span key={tagId} className="rounded-md bg-gray-200 px-2 py-1 text-sm">
                {tagUsageMap.get(tagId)?.name[lang] || tagId}
              </span>
            ))}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              請輸入最終標籤的中文名稱
            </label>
            <Input
              value={finalMergeTagName}
              onChange={(e) => setFinalMergeTagName(e.target.value)}
              list="merge-tag-options"
              placeholder="輸入或選擇標籤的中文名稱"
              className="w-full rounded-md border border-gray-300 px-2.5 py-2"
            />
            <datalist id="merge-tag-options">
              {Array.from(tagUsageMap.values()).map((tag) => (
                <option key={tag.id} value={tag.name['zh-tw']} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-500">
              {finalMergeTagName.trim()
                ? finalMergeTarget
                  ? `將合併至「${finalMergeTarget.name['zh-tw']}」 (ID: ${finalMergeTarget.id})`
                  : '找不到相符的標籤，請確認中文名稱或先新增該標籤。'
                : '可輸入現有標籤的中文名稱或從清單中選擇。'}
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!finalMergeTarget}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              確定合併
            </button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={isDeleteConfirmModalOpen} onClose={cancelDeleteTag} title="刪除標籤">
        {deleteConfirmTag && (
          <div className="space-y-4">
            <p>
              即將永久刪除標籤「<span className="font-semibold">{deleteConfirmTag.name}</span>」，
              該標籤目前被用於{' '}
              <span className="font-semibold text-rose-600">{deleteConfirmTag.count}</span>{' '}
              個顏文字。
            </p>
            <p className="text-sm text-gray-500">
              刪除後這些顏文字的該標籤將一併移除，此操作無法復原。
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={cancelDeleteTag}
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteTag}
                className="rounded-md bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
              >
                確認刪除
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default TagManager;
