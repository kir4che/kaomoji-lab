import { promises as fs } from 'fs';
import path from 'path';

import type { IndexData, CategoryData, Tag } from '@/types/Kaomoji';
import {
  TEMP_CATEGORY_ID,
  TEMP_CATEGORY_NAME,
  createDefaultTemporaryCategory,
} from '@/constants/tempCategory';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CATEGORIES_DIR = path.join(DATA_DIR, 'categories');
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const TEMP_CATEGORY_FILE = path.join(STORAGE_DIR, 'temporary-category.json');
const CHECKED_KAOMOJI_FILE = path.join(STORAGE_DIR, 'checked-kaomoji.json');

const CACHE_TTL = 60000; // 60 秒
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};
const memoryCache = new Map<string, CacheEntry<any>>();

const getCached = <T>(key: string): T | null => {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
};

const setCache = <T>(key: string, data: T): void => {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

const invalidateCache = (pattern?: string): void => {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) memoryCache.delete(key);
  }
};

const getIndexFilePath = () => path.join(DATA_DIR, 'index.json');
const getCategoryFilePath = (id: string) => path.join(CATEGORIES_DIR, `${id}.json`);

const isTagObject = (val: unknown): val is Tag =>
  typeof val === 'object' && val !== null && 'id' in val;
const isTagObjectArray = (arr: unknown): arr is Tag[] =>
  Array.isArray(arr) && arr.every(isTagObject);

export const getTodayDateString = (): string => new Date().toISOString().split('T')[0];

export const isValidCategoryId = (id?: string): id is string =>
  typeof id === 'string' && id !== 'undefined' && id.trim() !== '';

const ensureStorageDir = async (): Promise<void> => {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
};

const sanitizeTemporaryCategory = (data?: Partial<CategoryData>): CategoryData => {
  const base = createDefaultTemporaryCategory();
  return {
    ...base,
    ...data,
    id: TEMP_CATEGORY_ID,
    name: {
      en: data?.name?.en || TEMP_CATEGORY_NAME.en,
      'zh-tw': data?.name?.['zh-tw'] || TEMP_CATEGORY_NAME['zh-tw'],
    },
    preview: typeof data?.preview === 'string' ? data.preview : '',
    lastUpdated: data?.lastUpdated || getTodayDateString(),
    items: Array.isArray(data?.items) ? data.items : [],
  };
};

export const readTemporaryCategory = async (): Promise<CategoryData> => {
  await ensureStorageDir();
  try {
    const content = await fs.readFile(TEMP_CATEGORY_FILE, 'utf-8');
    const parsed = JSON.parse(content) as Partial<CategoryData>;
    return sanitizeTemporaryCategory(parsed);
  } catch {
    const fallback = sanitizeTemporaryCategory();
    await writeTemporaryCategory(fallback);
    return fallback;
  }
};

export const writeTemporaryCategory = async (
  categoryData: Partial<CategoryData>
): Promise<void> => {
  await ensureStorageDir();
  const sanitized = sanitizeTemporaryCategory(categoryData);
  await fs.writeFile(TEMP_CATEGORY_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
};

export const readIndexFile = async (): Promise<IndexData> => {
  const cacheKey = 'index.json';
  const cached = getCached<IndexData>(cacheKey);
  if (cached) return cached;

  const content = await fs.readFile(getIndexFilePath(), 'utf-8');
  const data = JSON.parse(content) as IndexData;
  setCache(cacheKey, data);
  return data;
};

export const updateIndexFile = async (indexData: IndexData): Promise<void> => {
  await fs.writeFile(getIndexFilePath(), JSON.stringify(indexData, null, 2), 'utf-8');
  invalidateCache('index.json');
};

export const readCategoryFile = async (categoryId: string): Promise<CategoryData | null> => {
  if (!isValidCategoryId(categoryId)) return null;

  const cacheKey = `category:${categoryId}`;
  const cached = getCached<CategoryData>(cacheKey);
  if (cached) return cached;

  try {
    const content = await fs.readFile(getCategoryFilePath(categoryId), 'utf-8');
    const data = JSON.parse(content) as CategoryData;
    setCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
};

export const writeCategoryFile = async (categoryData: CategoryData): Promise<void> => {
  if (!isValidCategoryId(categoryData.id))
    throw new Error('Invalid category ID, cannot write file.');

  await fs.writeFile(
    getCategoryFilePath(categoryData.id),
    JSON.stringify(categoryData, null, 2),
    'utf-8'
  );
  invalidateCache(`category:${categoryData.id}`);
};

export const deleteCategoryFile = async (categoryId: string): Promise<void> => {
  if (!isValidCategoryId(categoryId)) throw new Error('Invalid category ID, cannot delete file.');
  await fs.unlink(getCategoryFilePath(categoryId));
  invalidateCache(`category:${categoryId}`);
};

const isLocalPersistenceEnabled = (): boolean => process.env.NODE_ENV !== 'production';

const ensureCheckedKaomojiFile = async (): Promise<void> => {
  await ensureStorageDir();
  try {
    await fs.access(CHECKED_KAOMOJI_FILE);
  } catch {
    await fs.writeFile(CHECKED_KAOMOJI_FILE, '[]', 'utf-8');
  }
};

export const readCheckedKaomojiIds = async (): Promise<string[]> => {
  if (!isLocalPersistenceEnabled()) return [];
  await ensureCheckedKaomojiFile();
  const content = await fs.readFile(CHECKED_KAOMOJI_FILE, 'utf-8');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id): id is string => typeof id === 'string');
};

export const writeCheckedKaomojiIds = async (ids: string[]): Promise<void> => {
  if (!isLocalPersistenceEnabled()) return;
  await ensureCheckedKaomojiFile();
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => typeof id === 'string')));
  await fs.writeFile(CHECKED_KAOMOJI_FILE, JSON.stringify(uniqueIds, null, 2), 'utf-8');
};

export const getAllTags = async (): Promise<Tag[]> => {
  const cacheKey = 'tags:all';
  const cached = getCached<Tag[]>(cacheKey);
  if (cached) return cached;

  const indexData = await readIndexFile();
  const { tags = [] } = indexData as IndexData;
  if (tags.length === 0) return [];

  let result: Tag[];
  if (isTagObjectArray(tags)) {
    result = tags;
  } else {
    result = (tags as unknown as string[]).map((tagId) => ({
      id: tagId,
      name: { en: tagId, 'zh-tw': tagId },
    }));
  }

  setCache(cacheKey, result);
  return result;
};

export const isTagInUse = async (tagId: string): Promise<boolean> => {
  const indexData = await readIndexFile();
  for (const category of indexData.categories) {
    const categoryData = await readCategoryFile(category.id);
    if (categoryData?.items.some((item) => item.tags.includes(tagId))) {
      return true;
    }
  }
  return false;
};

export const getUsedTags = async (): Promise<Set<string>> => {
  const usedTags = new Set<string>();
  const indexData = await readIndexFile();
  for (const categorySummary of indexData.categories) {
    const categoryData = await readCategoryFile(categorySummary.id);
    if (categoryData)
      categoryData.items.forEach((item) => {
        item.tags.forEach((tagId) => {
          usedTags.add(tagId);
        });
      });
  }
  return usedTags;
};

export const rebuildTagsFromCategories = async (): Promise<void> => {
  const allTagIds = new Set<string>();
  const currentIndexData = await readIndexFile();

  for (const categorySummary of currentIndexData.categories) {
    const categoryData = await readCategoryFile(categorySummary.id);
    if (!categoryData) continue;
    categoryData.items.forEach((item) => item.tags.forEach((tagId) => allTagIds.add(tagId)));
  }

  if (isTagObjectArray(currentIndexData.tags)) {
    const existingTagMap = new Map<string, Tag>();
    currentIndexData.tags.forEach((tag) => existingTagMap.set(tag.id, tag));
    currentIndexData.tags = Array.from(allTagIds)
      .sort()
      .map((id) => {
        const existing = existingTagMap.get(id);
        return existing
          ? {
              id,
              name: {
                en: existing.name?.en || existing.id,
                'zh-tw': existing.name?.['zh-tw'] || existing.id,
              },
            }
          : { id, name: { en: id, 'zh-tw': id } };
      }) as any;
  } else currentIndexData.tags = Array.from(allTagIds).sort() as any;

  await updateIndexFile(currentIndexData);
  invalidateCache('tags:');
};
