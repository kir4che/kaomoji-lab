import { promises as fs } from 'fs';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

import type { IndexData, CategoryData, KaomojiItem } from '@/types/Kaomoji';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CATEGORIES_DIR = path.join(DATA_DIR, 'categories');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

async function readIndexFile(): Promise<IndexData> {
  const content = await fs.readFile(INDEX_FILE, 'utf-8');
  return JSON.parse(content);
}

async function readCategoryFile(categoryId: string): Promise<CategoryData | null> {
  try {
    const content = await fs.readFile(path.join(CATEGORIES_DIR, `${categoryId}.json`), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function writeCategoryFile(categoryData: CategoryData): Promise<void> {
  await fs.writeFile(
    path.join(CATEGORIES_DIR, `${categoryData.id}.json`),
    JSON.stringify(categoryData, null, 2),
    'utf-8'
  );
}

export async function POST(request: NextRequest) {
  try {
    const { tagIdsToRemove } = await request.json();

    if (!Array.isArray(tagIdsToRemove) || tagIdsToRemove.length === 0)
      return NextResponse.json(
        { error: 'Missing required parameters or no tags to remove' },
        { status: 400 }
      );

    const indexData = await readIndexFile();
    const allKaomojis: KaomojiItem[] = [];
    const categoryMap = new Map<string, CategoryData>();

    for (const categoryInfo of indexData.categories) {
      const categoryData = await readCategoryFile(categoryInfo.id);
      if (categoryData) {
        categoryMap.set(categoryInfo.id, categoryData);
        allKaomojis.push(...(categoryData.items || []));
      }
    }

    const tagsToRemoveSet = new Set(tagIdsToRemove);
    let kaomojisModifiedCount = 0;

    const updatedKaomojisByCat = new Map<string, KaomojiItem[]>();

    for (const kaomoji of allKaomojis) {
      const originalTags = new Set(kaomoji.tags);
      const newTags = kaomoji.tags.filter((tag) => !tagsToRemoveSet.has(tag));

      if (newTags.length !== originalTags.size) {
        kaomoji.tags = newTags.sort();
        kaomojisModifiedCount++;

        const categoryId = kaomoji.id.split('_')[0];
        if (!updatedKaomojisByCat.has(categoryId)) {
          updatedKaomojisByCat.set(categoryId, []);
        }
        updatedKaomojisByCat.get(categoryId)?.push(kaomoji);
      }
    }

    const writePromises: Promise<void>[] = [];
    updatedKaomojisByCat.forEach((items, categoryId) => {
      const originalCategoryData = categoryMap.get(categoryId);
      if (originalCategoryData) {
        const updatedItemsMap = new Map(items.map((item) => [item.id, item]));
        originalCategoryData.items = originalCategoryData.items.map((item) =>
          updatedItemsMap.has(item.id) ? updatedItemsMap.get(item.id)! : item
        );
        writePromises.push(writeCategoryFile(originalCategoryData));
      }
    });
    await Promise.all(writePromises);

    return NextResponse.json({ success: true, kaomojisModifiedCount });
  } catch {
    return NextResponse.json({ error: 'Failed to bulk remove tags' }, { status: 500 });
  }
}
