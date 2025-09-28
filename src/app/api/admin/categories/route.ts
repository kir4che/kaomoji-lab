import { NextRequest, NextResponse } from 'next/server';

import type { CategoryData } from '@/types/Kaomoji';
import {
  readIndexFile,
  updateIndexFile,
  readCategoryFile,
  writeCategoryFile,
  deleteCategoryFile,
  rebuildTagsFromCategories,
  getTodayDateString,
  isValidCategoryId,
  readTemporaryCategory,
  writeTemporaryCategory,
} from '@/services/dataService';
import { TEMP_CATEGORY_ID } from '@/constants/tempCategory';

export async function GET() {
  try {
    return NextResponse.json(await readIndexFile());
  } catch {
    return NextResponse.json({ error: 'Failed to read category data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category, name, preview } = await request.json();

    if (!isValidCategoryId(category) || !name?.en || !name?.['zh-tw'])
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    if (await readCategoryFile(category))
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });

    const newCategoryData: CategoryData = {
      id: category,
      name,
      preview: preview || '',
      lastUpdated: getTodayDateString(),
      items: [],
    };

    await writeCategoryFile(newCategoryData);

    const indexData = await readIndexFile();
    indexData.categories.push({
      id: category,
      name,
      preview: newCategoryData.preview,
      lastUpdated: newCategoryData.lastUpdated,
      itemCount: 0,
    });
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { category, name, items, preview, originalCategory } = await request.json();

    if (!isValidCategoryId(category))
      return NextResponse.json({ error: 'Invalid category name' }, { status: 400 });

    if (category === TEMP_CATEGORY_ID) {
      if (originalCategory && originalCategory !== TEMP_CATEGORY_ID)
        return NextResponse.json({ error: '暫存分類無法重新命名' }, { status: 400 });

      const current = await readTemporaryCategory();
      await writeTemporaryCategory({
        name: name || current.name,
        items: Array.isArray(items) ? items : current.items,
        preview: typeof preview === 'string' ? preview : current.preview,
        lastUpdated: getTodayDateString(),
      });

      return NextResponse.json({ success: true });
    }

    const indexData = await readIndexFile();

    if (originalCategory && originalCategory !== category) {
      await deleteCategoryFile(originalCategory);
      const cat = indexData.categories.find((c) => c.id === originalCategory);
      if (cat) {
        cat.id = category;
        cat.name = name || cat.name;
        cat.lastUpdated = getTodayDateString();
      }
    }

    const categoryData = (await readCategoryFile(category)) || {
      id: category,
      name: name || { en: category, 'zh-tw': category },
      preview: preview || '',
      lastUpdated: getTodayDateString(),
      items: [],
    };

    if (name) categoryData.name = name;
    if (items) categoryData.items = items;
    if (typeof preview === 'string') categoryData.preview = preview;
    categoryData.lastUpdated = getTodayDateString();

    await writeCategoryFile(categoryData);

    const idx = indexData.categories.findIndex((c) => c.id === category);

    if (idx !== -1) {
      indexData.categories[idx] = {
        id: category,
        name: categoryData.name,
        preview: categoryData.preview,
        lastUpdated: categoryData.lastUpdated,
        itemCount: categoryData.items.length,
      };
    } else {
      indexData.categories.push({
        id: category,
        name: categoryData.name,
        preview: categoryData.preview,
        lastUpdated: categoryData.lastUpdated,
        itemCount: categoryData.items.length,
      });
    }

    await rebuildTagsFromCategories();
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { category } = await request.json();

    if (!isValidCategoryId(category))
      return NextResponse.json({ error: 'Invalid category name' }, { status: 400 });

    if (category === TEMP_CATEGORY_ID)
      return NextResponse.json({ error: '暫存分類無法刪除' }, { status: 400 });

    const categoryData = await readCategoryFile(category);
    if (!categoryData) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    if (categoryData.items.length > 0)
      return NextResponse.json(
        { error: 'Cannot delete category with kaomojis in it' },
        { status: 400 }
      );

    await deleteCategoryFile(category);

    const indexData = await readIndexFile();
    indexData.categories = indexData.categories.filter((c) => c.id !== category);

    await rebuildTagsFromCategories();
    await updateIndexFile(indexData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
