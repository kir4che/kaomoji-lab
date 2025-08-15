import { NextRequest, NextResponse } from 'next/server';

import type { CategoryData } from '@/types/Kaomoji';
import {
  readIndexFile,
  updateIndexFile,
  readCategoryFile,
  writeCategoryFile,
  isTagInUse,
  getTodayDateString,
} from '@/services/dataService';

function updateTagInCategory(
  categoryData: CategoryData,
  tagsToRemove: Set<string>,
  newTag: string
): boolean {
  let categoryModified = false;

  categoryData.items.forEach((item) => {
    const tagSet = new Set(item.tags);
    let itemModified = false;

    tagsToRemove.forEach((tag) => {
      if (tagSet.has(tag)) {
        tagSet.delete(tag);
        itemModified = true;
      }
    });

    if (itemModified) {
      tagSet.add(newTag);
      item.tags = [...tagSet].sort();
      categoryModified = true;
    }
  });

  return categoryModified;
}

// 更新標籤
export async function PUT(request: NextRequest) {
  try {
    const { oldTag, oldTags, newTag } = await request.json();

    if (!newTag || !(oldTag || (Array.isArray(oldTags) && oldTags.length > 0)))
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });

    const indexData = await readIndexFile();
    if ((indexData.tags ?? []).includes(newTag) && !(oldTags || []).includes(newTag))
      return NextResponse.json({ error: 'New tag name already exists' }, { status: 400 });

    const rawTags: unknown[] = oldTags || [oldTag];
    const tagsToUpdate = rawTags.filter((t): t is string => typeof t === 'string');
    const tagsToRemove = new Set<string>(tagsToUpdate.filter((t) => t !== newTag));

    for (const categoryInfo of indexData.categories) {
      const categoryData = await readCategoryFile(categoryInfo.id);
      if (!categoryData) continue;

      const modified = updateTagInCategory(categoryData, tagsToRemove, newTag);
      if (modified) {
        categoryData.lastUpdated = getTodayDateString();
        await writeCategoryFile(categoryData);
      }
    }

    const finalTags = new Set(indexData.tags ?? []);
    tagsToRemove.forEach((tag: string) => finalTags.delete(tag));
    finalTags.add(newTag);
    indexData.tags = [...finalTags].sort();
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// 刪除標籤
export async function DELETE(request: NextRequest) {
  try {
    const { tag } = await request.json();
    if (!tag) return NextResponse.json({ error: 'Missing tag name.' }, { status: 400 });

    if (await isTagInUse(tag))
      return NextResponse.json(
        { error: 'Tag is still in use and cannot be deleted.' },
        { status: 400 }
      );

    const indexData = await readIndexFile();
    indexData.tags = (indexData.tags ?? []).filter((t) => t !== tag);
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete tag.' }, { status: 500 });
  }
}
