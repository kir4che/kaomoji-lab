'use client';

import { useRef, useState, type SetStateAction } from 'react';

import { Icon } from '@/components/atoms/Icon';
import { cn } from '@/utils/cn';

interface TagMultiSelectProps {
  filterTags: string[];
  setFilterTags: (value: SetStateAction<string[]>) => void;
  tagsWithCounts: Array<{ tag: string; count: number; label: string }>;
  filterMode: 'or' | 'and';
  onFilterModeChange: (mode: 'or' | 'and') => void;
}

const TagMultiSelect = ({
  filterTags,
  setFilterTags,
  tagsWithCounts,
  filterMode,
  onFilterModeChange,
}: TagMultiSelectProps) => {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 relative min-w-32 lg:min-w-40 max-w-60" ref={tagDropdownRef}>
      <div
        className={cn(
          'flex items-center justify-between border border-gray-300 rounded-md px-2 text-xs cursor-pointer focus:outline-none bg-white appearance-none w-full',
          filterTags.length === 0 ? 'py-2.5' : 'h-9.5'
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
                    <Icon name="close" className="size-3" />
                  </button>
                </span>
              );
            })
          ) : (
            <span className="whitespace-nowrap">選擇標籤</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onFilterModeChange(filterMode === 'and' ? 'or' : 'and');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onFilterModeChange(filterMode === 'and' ? 'or' : 'and');
              }
            }}
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-sm leading-none select-none',
              filterMode === 'and'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-amber-100 text-amber-700'
            )}
            aria-label={`當前模式：${filterMode === 'and' ? 'AND（全部符合）' : 'OR（符合任一）'}，點擊切換`}
            title={`${filterMode === 'and' ? 'AND（全部符合）' : 'OR（符合任一）'}`}
          >
            {filterMode.toUpperCase()}
          </span>
          <Icon name="arrow-down" className="size-4 shrink-0" />
        </div>
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
              .sort((a, b) => b.count - a.count) // 依顏文字數量由大到小排
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
                      {isSelected && <Icon name="check" className="size-2.5" />}
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
  );
};

export default TagMultiSelect;
