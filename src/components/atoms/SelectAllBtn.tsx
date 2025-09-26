import { cn } from '@/utils/cn';
import SelectAllIcon from '@/assets/icons/select-all.svg';

interface SelectAllBtnProps {
  selectedCount: number;
  totalCount: number;
  showCount?: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
  countClassName?: string;
}

const SelectAllBtn: React.FC<SelectAllBtnProps> = ({
  selectedCount,
  totalCount,
  showCount = true,
  onSelectAll,
  onDeselectAll,
  className,
  countClassName,
}) => {
  const isAllSelected = selectedCount === totalCount;
  const hasSelection = selectedCount > 0;

  const handleClick = () => {
    if (isAllSelected) onDeselectAll();
    else onSelectAll();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex-center gap-1 hover:text-primary-600 transition-colors',
        isAllSelected ? 'text-primary-600' : 'text-gray-800',
        className
      )}
      aria-label={isAllSelected ? '取消全選' : '全選'}
    >
      <SelectAllIcon className="size-4.5" />
      <span
        className={cn(
          'text-xs font-normal',
          isAllSelected ? 'text-primary-600' : 'text-gray-800',
          countClassName
        )}
      >
        {showCount && hasSelection
          ? `
已選擇 ${selectedCount} 個`
          : '全選'}
      </span>
    </button>
  );
};

export default SelectAllBtn;
