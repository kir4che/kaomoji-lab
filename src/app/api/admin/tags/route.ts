import { NextRequest, NextResponse } from 'next/server';

import {
  readIndexFile,
  updateIndexFile,
  readCategoryFile,
  writeCategoryFile,
  getAllTags,
} from '@/services/dataService';

export async function GET() {
  try {
    const tags = await getAllTags();
    return NextResponse.json(tags);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tags.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name } = await request.json();
    if (!id || !name || !name.en || !name['zh-tw'])
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });

    const indexData = await readIndexFile();
    if (indexData.tags.some((tag) => tag.id === id))
      return NextResponse.json({ error: 'Tag ID already exists.' }, { status: 409 });

    indexData.tags.push({ id, name });
    indexData.tags.sort((a, b) => a.id.localeCompare(b.id));
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true, tag: { id, name } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create tag.' }, { status: 500 });
  }
}

// 更新標籤
export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json();
    if (!id || !name || !name.en || !name['zh-tw'])
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });

    const indexData = await readIndexFile();
    const tagIndex = indexData.tags.findIndex((tag) => tag.id === id);

    if (tagIndex === -1) return NextResponse.json({ error: 'Tag not found.' }, { status: 404 });

    indexData.tags[tagIndex].name = name;
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true, tag: indexData.tags[tagIndex] });
  } catch {
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// 刪除標籤（同時刪除顏文字 + 清理其他無用標籤）
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing tag ID.' }, { status: 400 });

    const indexData = await readIndexFile();

    // 確認標籤存在
    if (!indexData.tags.some((t) => t.id === id))
      return NextResponse.json({ error: 'Tag not found.' }, { status: 404 });

    // 1. 讀取所有分類，刪除含該標籤的顏文字，同時收集仍被使用的 tag IDs。
    const usedTags = new Set<string>();
    const writeTasks: Promise<void>[] = [];

    for (const cat of indexData.categories) {
      const categoryData = await readCategoryFile(cat.id);
      if (!categoryData) continue;

      const before = categoryData.items.length;
      const keptItems = categoryData.items.filter((item) => {
        if (item.tags.includes(id)) return false; // 含目標標籤 → 刪除
        item.tags.forEach((t) => usedTags.add(t)); // 記錄仍被使用的標籤
        return true;
      });

      if (keptItems.length < before)
        writeTasks.push(writeCategoryFile({ ...categoryData, items: keptItems }));
      // 沒被刪除的類別也要記錄 tag 使用情況
      else categoryData.items.forEach((item) => item.tags.forEach((t) => usedTags.add(t)));
    }

    await Promise.all(writeTasks);

    // 2. 清理 index：只保留仍有使用的標籤（目標標籤 + 無用標籤一起清）
    indexData.tags = indexData.tags.filter((tag) => usedTags.has(tag.id));
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete tag.' }, { status: 500 });
  }
}
