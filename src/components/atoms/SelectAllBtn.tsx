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
    <div className={cn('flex-center gap-x-1', className)}>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'hover:text-primary-600 transition-colors',
          isAllSelected ? 'text-primary-600' : 'text-gray-800'
        )}
        aria-label={isAllSelected ? '取消全選' : '全選'}
      >
        <SelectAllIcon className="size-5" />
      </button>
      {showCount && hasSelection && (
        <span
          className={cn(
            'text-xs font-normal',
            isAllSelected ? 'text-primary-600' : 'text-gray-800',
            countClassName
          )}
        >
          已選擇 {selectedCount} 個
        </span>
      )}
    </div>
  );
};

export default SelectAllBtn;
