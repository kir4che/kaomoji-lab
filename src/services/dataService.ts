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

const getIndexFilePath = () => path.join(DATA_DIR, 'index.json');
const getCategoryFilePath = (id: string) => path.join(CATEGORIES_DIR, `${id}.json`);

const isTagObject = (val: unknown): val is Tag =>
  typeof val === 'object' && val !== null && 'id' in val;
const isTagObjectArray = (arr: unknown): arr is Tag[] =>
  Array.isArray(arr) && arr.every(isTagObject);

export const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const isValidCategoryId = (id?: string): id is string =>
  typeof id === 'string' && id !== 'undefined' && id.trim() !== '';

const ensureStorageDir = async () => {
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

export async function readTemporaryCategory(): Promise<CategoryData> {
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
}

export async function writeTemporaryCategory(categoryData: Partial<CategoryData>): Promise<void> {
  await ensureStorageDir();
  const sanitized = sanitizeTemporaryCategory(categoryData);
  await fs.writeFile(TEMP_CATEGORY_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
}

export async function readIndexFile(): Promise<IndexData> {
  const content = await fs.readFile(getIndexFilePath(), 'utf-8');
  return JSON.parse(content) as IndexData;
}

export async function updateIndexFile(indexData: IndexData): Promise<void> {
  await fs.writeFile(getIndexFilePath(), JSON.stringify(indexData, null, 2), 'utf-8');
}

export async function readCategoryFile(categoryId: string): Promise<CategoryData | null> {
  if (!isValidCategoryId(categoryId)) return null;
  try {
    const content = await fs.readFile(getCategoryFilePath(categoryId), 'utf-8');
    return JSON.parse(content) as CategoryData;
  } catch {
    return null;
  }
}

export async function writeCategoryFile(categoryData: CategoryData): Promise<void> {
  if (!isValidCategoryId(categoryData.id))
    throw new Error('Invalid category ID, cannot write file.');

  await fs.writeFile(
    getCategoryFilePath(categoryData.id),
    JSON.stringify(categoryData, null, 2),
    'utf-8'
  );
}

export async function deleteCategoryFile(categoryId: string): Promise<void> {
  if (!isValidCategoryId(categoryId)) throw new Error('Invalid category ID, cannot delete file.');
  await fs.unlink(getCategoryFilePath(categoryId));
}

const isLocalPersistenceEnabled = () => process.env.NODE_ENV !== 'production';

const ensureCheckedKaomojiFile = async () => {
  await ensureStorageDir();
  try {
    await fs.access(CHECKED_KAOMOJI_FILE);
  } catch {
    await fs.writeFile(CHECKED_KAOMOJI_FILE, '[]', 'utf-8');
  }
};

export async function readCheckedKaomojiIds(): Promise<string[]> {
  if (!isLocalPersistenceEnabled()) return [];
  await ensureCheckedKaomojiFile();
  const content = await fs.readFile(CHECKED_KAOMOJI_FILE, 'utf-8');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id): id is string => typeof id === 'string');
}

export async function writeCheckedKaomojiIds(ids: string[]): Promise<void> {
  if (!isLocalPersistenceEnabled()) return;
  await ensureCheckedKaomojiFile();
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => typeof id === 'string')));
  await fs.writeFile(CHECKED_KAOMOJI_FILE, JSON.stringify(uniqueIds, null, 2), 'utf-8');
}

export async function getAllTags(): Promise<Tag[]> {
  const indexData = await readIndexFile();
  const { tags = [] } = indexData as IndexData;
  if (tags.length === 0) return [];
  if (isTagObjectArray(tags)) return tags;
  return (tags as unknown as string[]).map((tagId) => ({
    id: tagId,
    name: { en: tagId, 'zh-tw': tagId },
  }));
}

export async function isTagInUse(tagId: string): Promise<boolean> {
  const indexData = await readIndexFile();
  for (const category of indexData.categories) {
    const categoryData = await readCategoryFile(category.id);
    if (categoryData?.items.some((item) => item.tags.includes(tagId))) {
      return true;
    }
  }
  return false;
}

export async function getUsedTags(): Promise<Set<string>> {
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
}

export async function rebuildTagsFromCategories(): Promise<void> {
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
}
