'use client';

import { memo } from 'react';
import type { KeyboardEvent } from 'react';

import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';
import { useKaomojiForm } from '@/hooks/useKaomojiForm';
import AvailableTagList from '@/components/organisms/AvailableTagList';
import IconBtn from '@/components/atoms/IconBtn';
import Input from '@/components/atoms/Input';
import CloseIcon from '@/assets/icons/close.svg';
import MoveRightIcon from '@/assets/icons/move-right.svg';
import PlusIcon from '@/assets/icons/plus.svg';

interface KaomojiEditorProps {
  kaomoji: KaomojiItem;
  categories: CategoryData[];
  allTags?: string[];
  currCategory: string;
  isSaving?: boolean;
  onSave: (kaomoji: KaomojiItem) => void;
  onMove: (toCategory: string, updatedData?: KaomojiItem) => void;
}

const KaomojiEditor: React.FC<KaomojiEditorProps> = ({
  kaomoji,
  categories,
  allTags,
  currCategory,
  isSaving = false,
  onSave,
  onMove,
}) => {
  const {
    formData,
    setFormData,
    newTag,
    setNewTag,
    selectedMoveCategory,
    setSelectedMoveCategory,
    addTags,
    removeTag,
    handleSubmit,
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
    <div className="bg-white rounded-md p-4 sm:p-6 flex flex-col min-h-[500px]">
      {isEditMode && <h3 className="mb-4 text-lg font-semibold">顏文字 ({formData.id})</h3>}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1 space-y-4">
          <Input
            value={formData.text}
            onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="請輸入顏文字"
            aria-label="輸入顏文字"
            className="rounded-md text-2xl"
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
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTags(newTag);
                }
              }}
              placeholder="輸入新標籤（可用逗號或空白分隔）"
              aria-label="新增標籤"
              className="px-3 py-2 border rounded-md border-gray-300"
            />
            <IconBtn
              icon={<PlusIcon />}
              onClick={() => addTags(newTag)}
              label="新增標籤"
              className="w-9.5"
            />
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
                  onChange={(e) => setSelectedMoveCategory(e.target.value)}
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
        <div className="flex justify-end gap-x-3 mt-8 xl:mt-0">
          <button
            type="submit"
            className="px-4 py-2 text-white border rounded-md bg-primary-500 hover:bg-primary-600 text-sm font-medium transition-colors"
            disabled={isSaving}
          >
            {selectedMoveCategory ? '儲存並移動' : isEditMode ? '儲存' : '新增'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default memo(KaomojiEditor);
