import type { CategoryData, KaomojiItem } from '@/types/Kaomoji';

async function fetchAPI(endpoint: string, options: any) {
  const res = await fetch(`/api/admin${endpoint}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || 'API request failed!');
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const createCategory = (data: { category: string; name: object; preview: string }) => {
  return fetchAPI('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const updateCategoryInfo = (
  originalCategory: string,
  data: { category: string; name: object; preview: string }
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

export const deleteCategory = (categoryId: string) => {
  return fetchAPI('/categories', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: categoryId }),
  });
};

export const bulkUpdateCategoriesForTags = (updates: Map<string, KaomojiItem[]>) => {
  const promises = Array.from(updates.entries()).map(([categoryId, items]) =>
    updateCategoryItems(categoryId, {
      items,
      lastUpdated: new Date().toISOString().split('T')[0],
    })
  );
  return Promise.all(promises);
};

export const renameTag = (oldTag: string, newTag: string) => {
  return fetchAPI('/tags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldTag, newTag }),
  });
};

export const mergeTags = (oldTags: string[], newTag: string) => {
  return fetchAPI('/tags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldTags, newTag }),
  });
};

export const deleteTag = (tag: string) => {
  return fetchAPI('/tags', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag }),
  });
};

export const cleanupTags = () => {
  return fetchAPI('/tags/cleanup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};
