import { cn } from '@/utils/cn';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';

interface SortingDropdownProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  options: readonly { value: string; label: string }[];
  onSortByChange: (value: string) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  className?: string;
}

const SortingDropdown = ({
  sortBy,
  sortOrder,
  options,
  onSortByChange,
  onSortOrderChange,
  className,
}: SortingDropdownProps) => {
  const { lang } = useLanguage();
  return (
  <div className={cn('flex items-center gap-x-0.5', className)}>
    <button
      type="button"
      onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
      className="-space-y-1.5"
      aria-label={
        sortOrder === 'asc' ? t('a11ySortDesc', lang) : t('a11ySortAsc', lang)
      }
      title={
        sortOrder === 'asc' ? t('a11ySortDesc', lang) : t('a11ySortAsc', lang)
      }
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
      className={cn('pr-1.5 cursor-pointer')}
    >
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  </div>
  );
};

export default SortingDropdown;
