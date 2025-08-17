'use client';

import { memo, useState } from 'react';
import type { KeyboardEvent, CompositionEvent } from 'react';

import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';
import { useKaomojiForm } from '@/hooks/useKaomojiForm';
import { cn } from '@/utils/cn';
import AvailableTagList from '@/components/organisms/AvailableTagList';
import IconBtn from '@/components/atoms/IconBtn';
import Input from '@/components/atoms/Input';
import CloseIcon from '@/assets/icons/close.svg';
import MoveRightIcon from '@/assets/icons/move-right.svg';
import PlusIcon from '@/assets/icons/plus.svg';
import SparkleIcon from '@/assets/icons/sparkle.svg';

interface KaomojiEditorProps {
  kaomoji: KaomojiItem;
  categories: CategoryData[];
  allTags?: string[];
  currCategory: string;
  onSave: (kaomoji: KaomojiItem) => Promise<void>;
  onMove: (toCategory: string, updatedData?: KaomojiItem) => void;
  isChecked?: boolean;
  onToggleChecked?: (kaomojiId: string) => void;
}

const KaomojiEditor: React.FC<KaomojiEditorProps> = ({
  kaomoji,
  categories,
  allTags,
  currCategory,
  onSave,
  onMove,
  isChecked,
  onToggleChecked,
}) => {
  const [isComposing, setIsComposing] = useState(false);

  const {
    formData,
    newTag,
    setNewTag,
    selectedMoveCategory,
    setSelectedMoveCategory,
    isSaving: isAutoSaving,
    addTags,
    removeTag,
    handleSubmit,
    handleTextChange,
    handleMove,
  } = useKaomojiForm({
    kaomoji,
    categories,
    currCategory,
    onSave,
    onMove,
  });

  const isEditMode = Boolean(formData.id);
  const currCategoryName = categories.find((c) => c.id === currCategory)?.name['zh-tw'];

  return (
    <div className="p-4 sm:px-6 pb-6 space-y-4 bg-white rounded-lg">
      {isEditMode && (
        <div className="flex-between text-xs">
          <div className="flex items-center gap-x-2">
            <h3 className="text-lg font-semibold">顏文字 ({formData.id})</h3>
            {onToggleChecked && (
              <button
                type="button"
                onClick={() => onToggleChecked(formData.id)}
                className={cn(
                  'p-1 rounded-full transition-colors',
                  isChecked
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
                aria-label={`${isChecked ? '取消' : '標記'}已檢查`}
              >
                <SparkleIcon className="size-4" />
              </button>
            )}
          </div>
          {isAutoSaving ? (
            <p className="flex items-center gap-x-1.5 text-gray-500">
              <div className="animate-spin rounded-full size-3 border border-gray-400 border-t-transparent" />
              儲存中...
            </p>
          ) : (
            <p className="flex items-center gap-x-1.5 text-green-600">
              <span>✓</span>
              已自動儲存
            </p>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1 space-y-4">
          <Input
            value={formData.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="請輸入顏文字"
            aria-label="輸入顏文字"
            className="rounded-md text-2xl pr-12"
          />
          <div className="flex items-center flex-wrap gap-2 mb-3 min-h-8">
            {formData.tags.length ? (
              formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center pl-2.5 pr-1 py-1 bg-white text-primary-600 border border-primary-600 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-primary-400 text-xs font-bold hover:text-primary-600 transition-colors"
                    aria-label={`刪除標籤 ${tag}`}
                  >
                    <CloseIcon className="size-5" />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-gray-400 text-sm">尚未選擇標籤</p>
            )}
          </div>
          <div className="flex-between gap-x-3">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e: CompositionEvent<HTMLInputElement>) => {
                setIsComposing(false);
                setNewTag(e.currentTarget.value);
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !isComposing) {
                  e.preventDefault();
                  addTags(newTag);
                }
              }}
              placeholder="輸入新標籤（可用逗號、分號或空白分隔）"
              aria-label="新增標籤"
              className="px-3 py-2 border rounded-md border-gray-300"
            />
            <IconBtn icon={<PlusIcon />} onClick={() => addTags(newTag)} label="新增標籤" />
          </div>
          {allTags && (
            <AvailableTagList tags={allTags} selectedTags={formData.tags} onSelect={addTags} />
          )}
          {isEditMode && (
            <div className="flex lg:items-center flex-col lg:flex-row gap-3">
              <p className="whitespace-nowrap">
                從 <span className="mx-1 text-primary-600 font-medium">{currCategoryName}</span>{' '}
                移動到
              </p>
              <div className="flex-center gap-x-3">
                <MoveRightIcon className="size-5 flex-shrink-0" />
                <select
                  value={selectedMoveCategory}
                  onChange={(e) => {
                    setSelectedMoveCategory(e.target.value);
                    if (e.target.value) handleMove();
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">選擇目標分類</option>
                  {categories
                    .filter((cat) => cat.id !== currCategory)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name['zh-tw']} ({category.items.length})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default memo(KaomojiEditor);
