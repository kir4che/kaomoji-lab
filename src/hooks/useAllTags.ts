import { useState, useEffect } from 'react';

import type { Tag } from '@/types/Kaomoji';

interface UseAllTagsReturn {
  tags: Tag[];
  isLoading: boolean;
}

// 取得所有標籤列表，提供給不需要自己管理標籤狀態的唯讀 UI 用。
export const useAllTags = (enabled = true): UseAllTagsReturn => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchTags = async () => {
      setIsLoading(true);

      try {
        const res = await fetch('/api/tags');
        if (!res.ok) throw new Error('取得標籤失敗！');
        const data: Tag[] = await res.json();
        setTags(data);
      } catch {
        setTags([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [enabled]);

  return { tags, isLoading };
};
