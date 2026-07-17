import { NextRequest, NextResponse } from 'next/server';

import type { CategoryData, KaomojiItem } from '@/types/Kaomoji';
import {
  readIndexFile,
  updateIndexFile,
  readCategoryFile,
  writeCategoryFile,
} from '@/services/dataService';

export async function POST(request: NextRequest) {
  try {
    const { tagIdsToMerge, finalTagId }: { tagIdsToMerge: string[]; finalTagId: string } =
      await request.json();

    if (!Array.isArray(tagIdsToMerge) || tagIdsToMerge.length < 2 || !finalTagId)
      return NextResponse.json(
        { error: 'Missing required parameters or not enough tags to merge.' },
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

    const tagsToMergeSet = new Set(tagIdsToMerge);
    let kaomojisModifiedCount = 0;

    const updatedKaomojisByCat = new Map<string, KaomojiItem[]>();

    for (const kaomoji of allKaomojis) {
      let kaomojiTagsModified = false;

      const newTags = kaomoji.tags
        .map((tag) => {
          if (tagsToMergeSet.has(tag)) {
            kaomojiTagsModified = true;
            return finalTagId;
          }
          return tag;
        })
        .filter((value, index, self) => self.indexOf(value) === index);

      if (kaomojiTagsModified) {
        kaomoji.tags = newTags.sort();
        kaomojisModifiedCount++;

        const categoryId = kaomoji.id.split('_')[0];
        if (!updatedKaomojisByCat.has(categoryId)) updatedKaomojisByCat.set(categoryId, []);
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

    const newTagsInIndex = indexData.tags.filter((tag) => !tagsToMergeSet.has(tag.id));
    if (!newTagsInIndex.some((tag) => tag.id === finalTagId)) {
      const existingFinalTag = indexData.tags.find((tag) => tag.id === finalTagId);
      if (existingFinalTag) newTagsInIndex.push(existingFinalTag);
      else newTagsInIndex.push({ id: finalTagId, name: { en: finalTagId, 'zh-tw': finalTagId } });
    }
    indexData.tags = newTagsInIndex.sort((a, b) => a.id.localeCompare(b.id));
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true, kaomojisModifiedCount });
  } catch {
    return NextResponse.json({ error: 'Failed to merge tags.' }, { status: 500 });
  }
}
