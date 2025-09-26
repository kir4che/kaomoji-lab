import { promises as fs } from 'fs';
import path from 'path';

import type { IndexData, CategoryData, Tag } from '@/types/Kaomoji';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CATEGORIES_DIR = path.join(DATA_DIR, 'categories');
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const CHECKED_KAOMOJI_FILE = path.join(STORAGE_DIR, 'checked-kaomoji.json');

const getIndexFilePath = () => path.join(DATA_DIR, 'index.json');
const getCategoryFilePath = (id: string) => path.join(CATEGORIES_DIR, `${id}.json`);

export const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const isValidCategoryId = (id?: string): id is string =>
  typeof id === 'string' && id !== 'undefined' && id.trim() !== '';

export async function readIndexFile(): Promise<IndexData> {
  const content = await fs.readFile(getIndexFilePath(), 'utf-8');
  return JSON.parse(content);
}

export async function updateIndexFile(indexData: IndexData): Promise<void> {
  await fs.writeFile(getIndexFilePath(), JSON.stringify(indexData, null, 2), 'utf-8');
}

export async function readCategoryFile(categoryId: string): Promise<CategoryData | null> {
  if (!isValidCategoryId(categoryId)) return null;
  try {
    const content = await fs.readFile(getCategoryFilePath(categoryId), 'utf-8');
    return JSON.parse(content);
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
  await fs.mkdir(STORAGE_DIR, { recursive: true });
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
  const { tags = [] } = indexData;

  if (tags.length === 0) return [];

  if (typeof tags[0] === 'object' && tags[0] !== null && 'id' in tags[0]) return tags as Tag[];

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
    if (categoryData) {
      categoryData.items.forEach((item) => {
        item.tags.forEach((tagId) => {
          usedTags.add(tagId);
        });
      });
    }
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

  if (typeof currentIndexData.tags[0] === 'object' && currentIndexData.tags[0] !== null) {
    const existingTagMap = new Map<string, Tag>();
    (currentIndexData.tags as Tag[]).forEach((tag) => {
      if (tag?.id) existingTagMap.set(tag.id, tag);
    });

    currentIndexData.tags = Array.from(allTagIds)
      .sort()
      .map((id) => {
        const existing = existingTagMap.get(id);
        if (existing)
          return {
            id,
            name: {
              en: existing.name?.en || existing.id,
              'zh-tw': existing.name?.['zh-tw'] || existing.id,
            },
          };

        return {
          id,
          name: { en: id, 'zh-tw': id },
        };
      }) as any;
  } else {
    currentIndexData.tags = Array.from(allTagIds).sort() as any;
  }

  await updateIndexFile(currentIndexData);
}
