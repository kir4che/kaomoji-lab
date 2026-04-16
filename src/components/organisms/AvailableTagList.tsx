'use client';

import type { Tag } from '@/types/Kaomoji';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';

interface AvailableTagListProps {
  tags: Tag[];
  selectedTags: string[];
  onSelect: (tagId: string) => void;
  className?: string;
}

const AvailableTagList = ({ tags, selectedTags, onSelect, className }: AvailableTagListProps) => {
  const { lang } = useLanguage();
  const availableTags = tags.filter((tag) => !selectedTags.includes(tag.id));

  if (!availableTags.length) return null;

  return (
    <div
      className={cn('max-h-45 overflow-y-auto border border-gray-200 rounded-md p-2', className)}
    >
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onSelect(tag.id)}
            className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            aria-label={`加入標籤 ${tag.name[lang]}`}
          >
            {tag.name[lang]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AvailableTagList;
