'use client';

import { useEffect, useState } from 'react';

import type { Language } from '@/types/Language';
import type { CategorySummary } from '@/types/Kaomoji';

interface UseKaomojiResult {
  categories: CategorySummary[];
  totalKaomojis: number;
  getCategoryName: (id: string) => string;
  isLoading: boolean;
  error: string | null;
}

export function useKaomoji(lang: Language): UseKaomojiResult {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/data/index.json', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`載入失敗：HTTP ${res.status}`);

        const data = await res.json();
        setCategories(
          (data?.categories || []).map((c: CategorySummary) => ({
            ...c,
            filePath: `categories/${c.id}.json`,
          }))
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : '載入時發生未知錯誤！');
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name[lang] || id;

  const totalKaomojis = categories.reduce((total, category) => total + category.itemCount, 0);

  return { categories, totalKaomojis, getCategoryName, isLoading, error };
}
