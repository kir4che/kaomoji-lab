import { ButtonHTMLAttributes, ReactNode, cloneElement, isValidElement, ReactElement } from 'react';

import { cn } from '@/utils/cn';

interface IconBtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  icon: ReactNode;
  onClick: () => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const IconBtn: React.FC<IconBtnProps> = ({
  icon,
  onClick,
  label,
  size = 'medium',
  className,
  ...props
}) => {
  const sizeStyles = {
    small: 'size-6 border-[1.25px]',
    medium: 'size-8.5 border-[1.5px]',
    large: 'size-12 border-2',
  };

  const iconSizes = {
    small: 'size-4',
    medium: 'size-5',
    large: 'size-6.5',
  };

  const iconWithStyles = isValidElement(icon)
    ? cloneElement(icon as ReactElement<any>, {
        className: cn(iconSizes[size], (icon as any).props?.className),
        'aria-hidden': 'true',
      })
    : icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-center flex-shrink-0 rounded-full transition-colors focus:outline-none bg-white text-primary-600 hover:text-white border-primary-600 hover:bg-primary-600 focus:ring-primary-500',
        sizeStyles[size],
        className
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      {iconWithStyles}
    </button>
  );
};

export default IconBtn;
