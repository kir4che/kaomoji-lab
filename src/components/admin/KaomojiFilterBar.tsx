'use client';

import { useState, type SetStateAction } from 'react';

import { Icon } from '@/components/atoms/Icon';
import CategoryTagCrossView from '@/components/admin/CategoryTagCrossView';
import IconBtn from '@/components/atoms/IconBtn';
import Input from '@/components/atoms/Input';
import TagMultiSelect from '@/components/molecules/TagMultiSelect';
import type { CategoryData } from '@/types/Kaomoji';
import { cn } from '@/utils/cn';

interface KaomojiFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: CategoryData[];
  filterTags: string[];
  setFilterTags: (value: SetStateAction<string[]>) => void;
  filterMode: 'or' | 'and';
  onFilterModeChange: (mode: 'or' | 'and') => void;
  tagsWithCounts: Array<{ tag: string; count: number; label: string }>;
  checkedStatusFilters: Set<'checked' | 'unchecked'>;
  toggleStatusFilter: (status: 'checked' | 'unchecked') => void;
  checkedCount: number;
  uncheckedCount: number;
  checkedKaomojiIds: Set<string>;
  tagNameMap: Map<string, string>;
  onCategoryClick: (categoryId: string) => void;
  onTagClick: (categoryId: string, tagId: string) => void;
  onResetCrossView: () => void;
}

const KaomojiFilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  filterTags,
  setFilterTags,
  filterMode,
  onFilterModeChange,
  tagsWithCounts,
  checkedStatusFilters,
  toggleStatusFilter,
  checkedCount,
  uncheckedCount,
  checkedKaomojiIds,
  tagNameMap,
  onCategoryClick,
  onTagClick,
  onResetCrossView,
}: KaomojiFilterBarProps) => {
  const [showCrossView, setShowCrossView] = useState(false);

  return (
    <>
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
            <TagMultiSelect
              filterTags={filterTags}
              setFilterTags={setFilterTags}
              tagsWithCounts={tagsWithCounts}
              filterMode={filterMode}
              onFilterModeChange={onFilterModeChange}
            />
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
              {checkedStatusFilters.has('checked') && <Icon name="check" className="size-2" />}
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
              {checkedStatusFilters.has('unchecked') && <Icon name="check" className="size-2" />}
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
              icon={<Icon name="reset" />}
              onClick={onResetCrossView}
              label="重置交叉檢視篩選"
              size="small"
              className="text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-700"
            />
            <IconBtn
              icon={showCrossView ? <Icon name="minus" /> : <Icon name="plus" />}
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
              onCategoryClick={onCategoryClick}
              onTagClick={onTagClick}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default KaomojiFilterBar;
