import { useState, useEffect } from 'react';

import type { Tag } from '@/types/Kaomoji';

interface UseAllTagsReturn {
  tags: Tag[];
  isLoading: boolean;
}

export function useAllTags(): UseAllTagsReturn {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
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
  }, []);

  return { tags, isLoading };
}
