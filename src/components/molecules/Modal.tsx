'use client';

import type { ReactNode } from 'react';

import CloseIcon from '@/assets/icons/close.svg';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const { lang } = useLanguage();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex-center bg-gray-600/65"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-11/12 sm:w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-between mb-6">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label={t('a11yModalClose', lang)}
          >
            <CloseIcon className="size-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
