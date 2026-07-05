'use client';

import { useEffect } from 'react';

import { cn } from '@/utils/cn';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  const { lang } = useLanguage();
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClasses = {
    success: 'bg-green-100 border border-green-400 text-green-800',
    error: 'bg-rose-100 border border-rose-400 text-rose-800',
    info: 'bg-blue-100 border border-blue-400 text-blue-800',
  };

  const icon = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div
      role="alert"
      className={cn(
        'px-4 py-2.5 rounded-full shadow-md flex-between z-50 xs:min-w-60 animate-fade-in-up',
        typeClasses[type]
      )}
    >
      <p className="flex-center gap-x-2">
        <span>{icon[type]}</span>
        {message}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="ml-4 text-lg font-semibold"
        aria-label={t('a11yToastClose', lang)}
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;
