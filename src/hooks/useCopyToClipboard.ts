import { useState } from 'react';

import { useToast } from '@/contexts/ToastContext';

// 處理剪貼簿複製的回饋
export const useCopyToClipboard = () => {
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      showToast('複製失敗！', 'error');
    }
  };

  return { copiedId, copyToClipboard };
};
