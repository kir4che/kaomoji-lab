import { cn } from '@/utils/cn';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';

interface SortingDropdownProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  options: readonly { value: string; label: string }[];
  onSortByChange: (value: string) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  className?: string;
}

const SortingDropdown: React.FC<SortingDropdownProps> = ({
  sortBy,
  sortOrder,
  options,
  onSortByChange,
  onSortOrderChange,
  className,
}) => (
  <div className={cn('flex items-center gap-x-0.5', className)}>
    <button
      type="button"
      onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
      className="-space-y-1.5"
      aria-label={sortOrder === 'asc' ? '切換倒序' : '切換正序'}
      title={sortOrder === 'asc' ? '切換倒序' : '切換正序'}
      aria-pressed={sortOrder === 'desc'}
    >
      <ArrowDownIcon
        className={cn('size-4 text-gray-800 rotate-180', {
          'opacity-50': sortOrder !== 'asc',
        })}
      />
      <ArrowDownIcon
        className={cn('size-4 text-gray-800', {
          'opacity-50': sortOrder !== 'desc',
        })}
      />
    </button>
    <select
      value={sortBy}
      onChange={(e) => onSortByChange(e.target.value)}
      className={cn('pr-1.5 cursor-pointer', 'focus:outline-none')}
    >
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  </div>
);

export default SortingDropdown;
