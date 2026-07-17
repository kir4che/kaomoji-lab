'use client';

import { memo } from 'react';

import { Icon } from '@/components/atoms/Icon';
import IconBtn from '@/components/atoms/IconBtn';
import Input from '@/components/atoms/Input';
import SelectAllBtn from '@/components/atoms/SelectAllBtn';
import type { CategoryData, KaomojiItem } from '@/types/Kaomoji';
import { cn } from '@/utils/cn';

interface KaomojiGridProps {
  filteredKaomoji: KaomojiItem[];
  selectedKaomojiIds: Set<string>;
  selectedKaomoji: KaomojiItem | null;
  isLoading: boolean;
  toggleKaomojiSelection: (id: string) => void;
  setSelectedKaomoji: (kaomoji: KaomojiItem) => void;
  selectAllKaomoji: () => void;
  deselectAllKaomoji: () => void;
  onBulkDelete: () => void;
  onBulkMove: (targetCategoryId: string) => void;
  categories: CategoryData[];
  selectedCategory: string;
  tagsToAdd: string;
  setTagsToAdd: (value: string) => void;
  onBulkAddTags: () => void;
  onSingleDelete: (categoryId: string, kaomojiId: string) => void;
  kaomojiToCategoryMap: Map<string, string>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onAddNew: () => void;
}

interface KaomojiGridItemProps {
  kaomoji: KaomojiItem;
  isSelected: boolean;
  isActive: boolean;
  categoryId?: string;
  toggleKaomojiSelection: (id: string) => void;
  setSelectedKaomoji: (kaomoji: KaomojiItem) => void;
  onSingleDelete: (categoryId: string, kaomojiId: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const KaomojiGridItem = memo(
  ({
    kaomoji,
    isSelected,
    isActive,
    categoryId,
    toggleKaomojiSelection,
    setSelectedKaomoji,
    onSingleDelete,
    showToast,
  }: KaomojiGridItemProps) => (
    <div
      onClick={() => setSelectedKaomoji(kaomoji)}
      className={cn(
        'flex-between w-full px-2.5 py-3 border rounded-lg cursor-pointer transition-colors',
        isSelected || isActive
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
          <Icon name="check" className="size-3" />
        </button>
        <p className="text-base text-nowrap sm:text-lg">{kaomoji.text}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (categoryId) onSingleDelete(categoryId, kaomoji.id);
          else showToast('無法確定分類！', 'error');
        }}
        className="text-gray-500 hover:text-gray-700"
        aria-label={`刪除 ${kaomoji.text}`}
      >
        <Icon name="close" className="size-5" />
      </button>
    </div>
  )
);

KaomojiGridItem.displayName = 'KaomojiGridItem';

const KaomojiGrid = ({
  filteredKaomoji,
  selectedKaomojiIds,
  selectedKaomoji,
  isLoading,
  toggleKaomojiSelection,
  setSelectedKaomoji,
  selectAllKaomoji,
  deselectAllKaomoji,
  onBulkDelete,
  onBulkMove,
  categories,
  selectedCategory,
  tagsToAdd,
  setTagsToAdd,
  onBulkAddTags,
  onSingleDelete,
  kaomojiToCategoryMap,
  showToast,
  onAddNew,
}: KaomojiGridProps) => (
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
          icon={<Icon name="delete" />}
          onClick={onBulkDelete}
          label="批量刪除"
          size="medium"
          className="size-fit ml-1 text-rose-600 border-transparent! hover:bg-white! hover:text-rose-600! hover:border-transparent!"
          disabled={isLoading}
        />
      )}
      <IconBtn
        icon={<Icon name="plus" />}
        onClick={onAddNew}
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
          icon={<Icon name="plus" />}
          onClick={onBulkAddTags}
          label="新增標籤"
          className="text-blue-600 border-blue-600 hover:bg-blue-600"
          size="small"
        />
      </div>
    )}
    <div className="grid max-h-48 md:max-h-105 gap-2 overflow-x-hidden overflow-y-auto grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
      {filteredKaomoji.map((kaomoji) => (
        <KaomojiGridItem
          key={kaomoji.id}
          kaomoji={kaomoji}
          isSelected={selectedKaomojiIds.has(kaomoji.id)}
          isActive={selectedKaomoji?.id === kaomoji.id}
          categoryId={kaomojiToCategoryMap.get(kaomoji.id)}
          toggleKaomojiSelection={toggleKaomojiSelection}
          setSelectedKaomoji={setSelectedKaomoji}
          onSingleDelete={onSingleDelete}
          showToast={showToast}
        />
      ))}
    </div>
  </div>
);

export default KaomojiGrid;
