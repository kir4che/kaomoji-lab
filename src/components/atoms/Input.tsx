import { useId, ChangeEvent, InputHTMLAttributes } from 'react';

import { cn } from '@/utils/cn';
import CloseIcon from '@/assets/icons/close.svg';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  title?: string;
  type?: 'text' | 'number';
  name?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  labelClass?: string;
  className?: string;
  focusEffect?: boolean;
  helperText?: string;
}

const Input = ({
  title,
  type = 'text',
  name,
  value,
  placeholder,
  onChange,
  disabled = false,
  labelClass,
  className,
  focusEffect = false,
  helperText,
  ...props
}: InputProps) => {
  const id = useId();

  const handleClear = () => {
    onChange({
      target: { name: name || '', value: '' },
    } as ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="w-full">
      {title && (
        <label
          htmlFor={id}
          className={cn('block text-sm font-medium text-gray-700 mb-2', labelClass)}
        >
          {title}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'w-full p-3 rounded-full bg-white border-2 border-gray-200 focus:outline-none',
            {
              'pl-4 pr-12 focus:scale-105 focus:-translate-y-1 focus:border-primary-400 transition-all duration-300':
                focusEffect,
              'cursor-not-allowed opacity-80 bg-gray-100': disabled,
            },
            className
          )}
          {...props}
        />
        {value && !disabled && type === 'text' && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
            aria-label="清除內容"
          >
            <CloseIcon className="size-5" />
          </button>
        )}
      </div>
      {helperText && !disabled && <p className="text-xs text-gray-500 mt-2">{helperText}</p>}
    </div>
  );
};

export default Input;
