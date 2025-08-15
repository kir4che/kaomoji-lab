interface AvailableTagListProps {
  tags: string[];
  selectedTags: string[];
  onSelect: (tag: string) => void;
}

const AvailableTagList: React.FC<AvailableTagListProps> = ({ tags, selectedTags, onSelect }) => {
  const availableTags = tags.filter((tag) => !selectedTags.includes(tag));

  if (!availableTags.length) return null;

  return (
    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
      <div className="flex flex-wrap gap-1.5">
        {availableTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelect(tag)}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
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
