import { promises as fs } from 'fs';
import path from 'path';

import type { IndexData, CategoryData } from '@/types/Kaomoji';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CATEGORIES_DIR = path.join(DATA_DIR, 'categories');

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

export async function getAllTags(): Promise<string[]> {
  const indexData = await readIndexFile();
  if (Array.isArray(indexData.tags) && indexData.tags.length > 0) {
    if (typeof indexData.tags[0] === 'object' && 'id' in indexData.tags[0])
      return (indexData.tags as any[]).map((tag) => tag.id);
  }
  return (indexData.tags as unknown as string[]) || [];
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
  const allTags = new Set<string>();
  const currentIndexData = await readIndexFile(); // 重新命名避免衝突

  for (const categorySummary of currentIndexData.categories) {
    const categoryData = await readCategoryFile(categorySummary.id);
    if (categoryData) {
      categoryData.items.forEach((item) => {
        item.tags.forEach((tagId) => {
          allTags.add(tagId);
        });
      });
    }
  }

  if (typeof currentIndexData.tags[0] === 'object') {
    currentIndexData.tags = Array.from(allTags)
      .sort()
      .map((id) => ({ id })) as any;
  } else currentIndexData.tags = Array.from(allTags).sort() as any;

  await updateIndexFile(currentIndexData);
}
