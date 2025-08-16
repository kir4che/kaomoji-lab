import { cn } from '@/utils/cn';

interface AvailableTagListProps {
  tags: string[];
  selectedTags: string[];
  onSelect: (tag: string) => void;
  className?: string;
}

const AvailableTagList: React.FC<AvailableTagListProps> = ({
  tags,
  selectedTags,
  onSelect,
  className,
}) => {
  const availableTags = tags.filter((tag) => !selectedTags.includes(tag));

  if (!availableTags.length) return null;

  return (
    <div
      className={cn('max-h-45 overflow-y-auto border border-gray-200 rounded-md p-2', className)}
    >
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelect(tag)}
            className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            aria-label={`加入標籤 ${tag}`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AvailableTagList;
