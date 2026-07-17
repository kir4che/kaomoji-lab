'use client';

import { useState, useEffect } from 'react';

import { Icon } from '@/components/atoms/Icon';
import { cn } from '@/utils/cn';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

const ScrollToTopBtn = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { lang } = useLanguage();

  const toggleVisibility = () => {
    setIsVisible(window.scrollY > 300);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-8 right-8 z-50 rounded-full bg-primary-400 p-2.5 text-white shadow duration-300 hover:bg-primary-500 focus:outline-none',
        'transition-all',
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
      )}
      aria-label={t('a11yScrollToTop', lang)}
    >
      <Icon name="arrow-right" className="size-8 -rotate-90" />
    </button>
  );
};

export default ScrollToTopBtn;
