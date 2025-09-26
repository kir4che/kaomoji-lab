/* global RequestInit */
import type { CategoryData, KaomojiItem, Tag } from '@/types/Kaomoji';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') return '';
    if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    return `http://localhost:${process.env.PORT ?? 3000}`;
  };

  const res = await fetch(`${getBaseUrl()}/api/admin${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.error || 'API request failed!');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const createCategory = (data: {
  category: string;
  name: Record<string, string>;
  preview: string;
}) => {
  return fetchAPI('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const updateCategoryInfo = (
  originalCategory: string,
  data: { category: string; name: Record<string, string>; preview: string }
) => {
  return fetchAPI('/categories', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, originalCategory }),
  });
};

export const updateCategoryItems = (categoryId: string, data: Partial<CategoryData>) => {
  return fetchAPI('/categories', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: categoryId, ...data }),
  });
};

export const updateCategory = (categoryId: string, data: Partial<CategoryData>) => {
  return fetchAPI('/categories', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: categoryId, ...data }),
  });
};

export const deleteCategory = (categoryId: string) => {
  return fetchAPI('/categories', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: categoryId }),
  });
};

export const bulkUpdateCategoryItems = (categoryId: string, items: KaomojiItem[]) => {
  return updateCategoryItems(categoryId, {
    items,
    lastUpdated: new Date().toISOString().split('T')[0],
  });
};

export const getTags = (): Promise<Tag[]> => {
  return fetchAPI('/tags');
};

export const createTag = (tag: Tag) => {
  return fetchAPI('/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tag),
  });
};

export const updateTag = (tag: Tag) => {
  return fetchAPI('/tags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tag),
  });
};

export const deleteTag = (tagId: string) => {
  return fetchAPI('/tags', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: tagId }),
  });
};

export const mergeTags = (tagIdsToMerge: string[], finalTagId: string) => {
  return fetchAPI('/tags/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagIdsToMerge, finalTagId }),
  });
};

export const bulkRemoveTags = (tagIdsToRemove: string[]) => {
  return fetchAPI('/tags/bulk-remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagIdsToRemove }),
  });
};

export const cleanupTags = () => {
  return fetchAPI('/tags/cleanup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getCheckedKaomojiIds = async (): Promise<string[]> => {
  const data = await fetchAPI('/checked');
  if (Array.isArray(data?.ids))
    return data.ids.filter((id: unknown): id is string => typeof id === 'string');
  return [];
};

export const saveCheckedKaomojiIds = async (ids: string[]) => {
  try {
    await fetchAPI('/checked', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Checked kaomoji persistence disabled') return;
    throw error;
  }
};
