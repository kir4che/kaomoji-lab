import { Icon } from '@/components/atoms/Icon';
import { cn } from '@/utils/cn';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

interface SelectAllBtnProps {
  selectedCount: number;
  totalCount: number;
  showCount?: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
  countClassName?: string;
}

const SelectAllBtn = ({
  selectedCount,
  totalCount,
  showCount = true,
  onSelectAll,
  onDeselectAll,
  className,
  countClassName,
}: SelectAllBtnProps) => {
  const { lang } = useLanguage();
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
      aria-label={isAllSelected ? t('a11yDeselectAll', lang) : t('a11ySelectAll', lang)}
    >
      <Icon name="select-all" className="size-4.5" />
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
