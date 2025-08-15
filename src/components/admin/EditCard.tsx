import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';
import DeleteIcon from '@/assets/icons/delete.svg';
import EditIcon from '@/assets/icons/edit.svg';

interface EditCardProps {
  type?: 'category' | 'tag';
  title: string;
  titleEn?: string;
  count: number;
  lastUpdated?: string;
  onClick?: () => void;
  handleEdit?: () => void;
  handleDelete?: () => void;
  isEditDisabled?: boolean;
  isDeleteDisabled?: boolean;
  extraContent?: ReactNode;
  className?: string;
}

const EditCard: React.FC<EditCardProps> = ({
  type,
  title,
  titleEn,
  count,
  lastUpdated,
  onClick,
  handleEdit,
  handleDelete,
  isEditDisabled,
  isDeleteDisabled,
  extraContent,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col justify-between border border-gray-200 rounded-lg',
        type === 'category' ? 'p-4' : 'p-3',
        className
      )}
    >
      <div>
        <div className={type === 'category' ? 'flex-between' : 'flex items-center gap-x-2 -mt-1'}>
          <h4 className="font-semibold -mt-0.5">
            {title}
            {titleEn && <span className="text-sm text-gray-500 ml-1">({titleEn})</span>}
          </h4>
          {type === 'category' && <p className="text-2xl font-bold text-primary-600">{count}</p>}
          {type === 'tag' && (
            <p className="flex-center text-sm font-bold text-primary-600 bg-primary-50 rounded-full size-8">
              {count}
            </p>
          )}
        </div>
      </div>
      <div className={cn('flex justify-between items-end', type === 'category' ? 'mt-6' : 'mt-2')}>
        <div className="flex items-center gap-x-2">
          {lastUpdated && <p className="text-xs text-gray-400">更新於 {lastUpdated}</p>}
          {extraContent}
        </div>
        <div className="flex gap-x-2">
          {handleEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              disabled={isEditDisabled}
              className="text-gray-400 hover:text-blue-500"
              aria-label="編輯"
            >
              <EditIcon className="size-5" />
            </button>
          )}
          {handleDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isDeleteDisabled}
              className="text-gray-400 hover:text-rose-600"
              aria-label="刪除"
            >
              <DeleteIcon className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditCard;
