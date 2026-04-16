import { useState } from 'react';

import { useToast } from '@/contexts/ToastContext';

export function useCopyToClipboard() {
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
}
