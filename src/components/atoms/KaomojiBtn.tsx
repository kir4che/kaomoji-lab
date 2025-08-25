import { useState, useEffect, useLayoutEffect, useRef } from 'react';

import { cn } from '@/utils/cn';

interface KaomojiBtnProps {
  text: string;
  onCopy: () => void;
  isCopied: boolean;
  className?: string;
}

const KaomojiBtn: React.FC<KaomojiBtnProps> = ({ text, onCopy, isCopied, className }) => {
  const [showCopyText, setShowCopyText] = useState(false);
  const [minWidth, setMinWidth] = useState<number>(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  // 避免文字變動導致寬度跳動
  useLayoutEffect(() => {
    if (btnRef.current) setMinWidth(btnRef.current.offsetWidth);
  }, [text]);

  // 顯示 "Copy!" 過渡效果
  useEffect(() => {
    if (isCopied) {
      setShowCopyText(true);
      const timerId = setTimeout(() => setShowCopyText(false), 750);
      return () => clearTimeout(timerId);
    }
    setShowCopyText(false);
  }, [isCopied]);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onCopy}
      aria-label={`${text}（點擊複製）`}
      aria-live="polite"
      className={cn(
        'bg-white rounded-lg p-2 shadow text-sm md:text-base font-medium text-nowrap border-2 border-transparent hover:border-primary-500/25 hover:text-pink-500 focus:border-transparent transition-colors duration-300',
        {
          'text-primary-500 font-medium': showCopyText,
          'shake-animation pulse-glow': isCopied,
        },
        className
      )}
      style={{ minWidth: minWidth || undefined }}
    >
      {showCopyText ? 'Copy!' : text}
    </button>
  );
};

export default KaomojiBtn;
