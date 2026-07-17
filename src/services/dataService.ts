import { promises as fs } from 'fs';
import path from 'path';

import type { IndexData, CategoryData, Tag } from '@/types/Kaomoji';
import {
  TEMP_CATEGORY_ID,
  TEMP_CATEGORY_NAME,
  createDefaultTemporaryCategory,
} from '@/constants/tempCategory';
import { getTodayDateString } from '@/utils/date';
import {
  deleteGitHubFile,
  isGitHubContentsEnabled,
  readGitHubTextFile,
  writeGitHubTextFiles,
  writeGitHubTextFile,
} from '@/services/githubContentsService';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CATEGORIES_DIR = path.join(DATA_DIR, 'categories');
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const TEMP_CATEGORY_FILE = path.join(STORAGE_DIR, 'temporary-category.json');
const CHECKED_KAOMOJI_FILE = path.join(STORAGE_DIR, 'checked-kaomoji.json');
const INDEX_REPO_PATH = 'public/data/index.json';
const getCategoryRepoPath = (id: string) => `public/data/categories/${id}.json`;
const TEMP_CATEGORY_REPO_PATH = 'storage/temporary-category.json';
const CHECKED_KAOMOJI_REPO_PATH = 'storage/checked-kaomoji.json';

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
const serializeJson = (data: unknown) => JSON.stringify(data, null, 2);
const isProductionRuntime = () => process.env.NODE_ENV === 'production';

export interface AdminSnapshotInput {
  categories: CategoryData[];
  tags: Tag[];
  checkedKaomojiIds?: string[];
  previousCategoryIds?: string[];
}

export interface AdminSnapshotFile {
  localPath: string;
  repoPath: string;
  content: string | null;
}

const assertWritablePersistence = () => {
  if (isProductionRuntime() && !isGitHubContentsEnabled())
    throw new Error('GitHub contents persistence is not configured');
};

const readJsonFile = async <T>(localPath: string, repoPath: string): Promise<T> => {
  if (isGitHubContentsEnabled()) {
    const content = await readGitHubTextFile(repoPath);
    if (content !== null) return JSON.parse(content) as T;
  }

  const content = await fs.readFile(localPath, 'utf-8');
  return JSON.parse(content) as T;
};

const writeJsonFile = async (
  localPath: string,
  repoPath: string,
  data: unknown,
  message: string
): Promise<void> => {
  const content = serializeJson(data);
  if (isGitHubContentsEnabled()) {
    await writeGitHubTextFile(repoPath, content, message);
    return;
  }

  assertWritablePersistence();
  await fs.writeFile(localPath, content, 'utf-8');
};

export const buildAdminSnapshotFiles = ({
  categories,
  tags,
  checkedKaomojiIds,
  previousCategoryIds = [],
}: AdminSnapshotInput): AdminSnapshotFile[] => {
  const regularCategories = categories.filter((category) => category.id !== TEMP_CATEGORY_ID);
  const temporaryCategory = categories.find((category) => category.id === TEMP_CATEGORY_ID);
  const currentCategoryIds = new Set(regularCategories.map((category) => category.id));
  const deletedCategoryIds = previousCategoryIds.filter((id) => !currentCategoryIds.has(id));

  const indexData: IndexData = {
    categories: regularCategories.map((category) => ({
      id: category.id,
      name: category.name,
      preview: category.preview,
      lastUpdated: category.lastUpdated,
      itemCount: category.items.length,
    })),
    totalItems: regularCategories.reduce((count, category) => count + category.items.length, 0),
    lastUpdated: getTodayDateString(),
    tags,
  };

  return [
    {
      localPath: getIndexFilePath(),
      repoPath: INDEX_REPO_PATH,
      content: serializeJson(indexData),
    },
    ...regularCategories.map((category) => ({
      localPath: getCategoryFilePath(category.id),
      repoPath: getCategoryRepoPath(category.id),
      content: serializeJson(category),
    })),
    ...deletedCategoryIds.map((id) => ({
      localPath: getCategoryFilePath(id),
      repoPath: getCategoryRepoPath(id),
      content: null,
    })),
    ...(temporaryCategory
      ? [
          {
            localPath: TEMP_CATEGORY_FILE,
            repoPath: TEMP_CATEGORY_REPO_PATH,
            content: serializeJson(sanitizeTemporaryCategory(temporaryCategory)),
          },
        ]
      : []),
    ...(checkedKaomojiIds
      ? [
          {
            localPath: CHECKED_KAOMOJI_FILE,
            repoPath: CHECKED_KAOMOJI_REPO_PATH,
            content: serializeJson(Array.from(new Set(checkedKaomojiIds)).sort()),
          },
        ]
      : []),
  ];
};

export const saveAdminSnapshot = async ({
  categories,
  tags,
  checkedKaomojiIds,
}: AdminSnapshotInput) => {
  await ensureStorageDir();
  const currentIndex = await readIndexFile();
  const files = buildAdminSnapshotFiles({
    categories,
    tags,
    checkedKaomojiIds,
    previousCategoryIds: currentIndex.categories.map((category) => category.id),
  });

  if (isGitHubContentsEnabled()) {
    await writeGitHubTextFiles(
      files.map((file) => ({ path: file.repoPath, content: file.content })),
      'chore(admin): save admin session'
    );
  } else {
    assertWritablePersistence();
    await fs.mkdir(CATEGORIES_DIR, { recursive: true });
    await ensureStorageDir();
    await Promise.all(
      files.map(async (file) => {
        if (file.content === null) {
          await fs.rm(file.localPath, { force: true });
          return;
        }
        await fs.mkdir(path.dirname(file.localPath), { recursive: true });
        await fs.writeFile(file.localPath, file.content, 'utf-8');
      })
    );
  }

  invalidateCache();
  return {
    changedFileCount: files.length,
    indexData: JSON.parse(files[0].content ?? '{}') as IndexData,
  };
};

const isTagObject = (val: unknown): val is Tag =>
  typeof val === 'object' && val !== null && 'id' in val;
const isTagObjectArray = (arr: unknown): arr is Tag[] =>
  Array.isArray(arr) && arr.every(isTagObject);

export const isValidCategoryId = (id?: string): id is string =>
  typeof id === 'string' && id !== 'undefined' && id.trim() !== '';

const ensureStorageDir = async (): Promise<void> => {
  if (isGitHubContentsEnabled()) return;
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
    const parsed = await readJsonFile<Partial<CategoryData>>(
      TEMP_CATEGORY_FILE,
      TEMP_CATEGORY_REPO_PATH
    );
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
  await writeJsonFile(
    TEMP_CATEGORY_FILE,
    TEMP_CATEGORY_REPO_PATH,
    sanitized,
    'chore(admin): update temporary category'
  );
};

export const readIndexFile = async (): Promise<IndexData> => {
  const cacheKey = 'index.json';
  const cached = getCached<IndexData>(cacheKey);
  if (cached) return cached;

  const data = await readJsonFile<IndexData>(getIndexFilePath(), INDEX_REPO_PATH);
  setCache(cacheKey, data);
  return data;
};

export const updateIndexFile = async (indexData: IndexData): Promise<void> => {
  await writeJsonFile(
    getIndexFilePath(),
    INDEX_REPO_PATH,
    indexData,
    'chore(admin): update data index'
  );
  invalidateCache('index.json');
  invalidateCache('tags:');
};

export const readCategoryFile = async (categoryId: string): Promise<CategoryData | null> => {
  if (!isValidCategoryId(categoryId)) return null;

  const cacheKey = `category:${categoryId}`;
  const cached = getCached<CategoryData>(cacheKey);
  if (cached) return cached;

  try {
    const data = await readJsonFile<CategoryData>(
      getCategoryFilePath(categoryId),
      getCategoryRepoPath(categoryId)
    );
    setCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
};

export const writeCategoryFile = async (categoryData: CategoryData): Promise<void> => {
  if (!isValidCategoryId(categoryData.id))
    throw new Error('Invalid category ID, cannot write file.');

  await writeJsonFile(
    getCategoryFilePath(categoryData.id),
    getCategoryRepoPath(categoryData.id),
    categoryData,
    `chore(admin): update ${categoryData.id} category`
  );
  invalidateCache(`category:${categoryData.id}`);
};

export const deleteCategoryFile = async (categoryId: string): Promise<void> => {
  if (!isValidCategoryId(categoryId)) throw new Error('Invalid category ID, cannot delete file.');
  if (isGitHubContentsEnabled()) {
    await deleteGitHubFile(
      getCategoryRepoPath(categoryId),
      `chore(admin): delete ${categoryId} category`
    );
    invalidateCache(`category:${categoryId}`);
    return;
  }

  assertWritablePersistence();
  await fs.unlink(getCategoryFilePath(categoryId));
  invalidateCache(`category:${categoryId}`);
};

const ensureCheckedKaomojiFile = async (): Promise<void> => {
  if (isGitHubContentsEnabled()) return;
  await ensureStorageDir();
  try {
    await fs.access(CHECKED_KAOMOJI_FILE);
  } catch {
    await fs.writeFile(CHECKED_KAOMOJI_FILE, '[]', 'utf-8');
  }
};

export const readCheckedKaomojiIds = async (): Promise<string[]> => {
  await ensureCheckedKaomojiFile();
  const parsed = await readJsonFile<unknown>(CHECKED_KAOMOJI_FILE, CHECKED_KAOMOJI_REPO_PATH);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id): id is string => typeof id === 'string');
};

export const writeCheckedKaomojiIds = async (ids: string[]): Promise<void> => {
  await ensureCheckedKaomojiFile();
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => typeof id === 'string')));
  await writeJsonFile(
    CHECKED_KAOMOJI_FILE,
    CHECKED_KAOMOJI_REPO_PATH,
    uniqueIds,
    'chore(admin): update checked kaomoji'
  );
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
