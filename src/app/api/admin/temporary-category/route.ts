import { NextRequest, NextResponse } from 'next/server';

import {
  readTemporaryCategory,
  writeTemporaryCategory,
  getTodayDateString,
} from '@/services/dataService';
import { TEMP_CATEGORY_ID, TEMP_CATEGORY_NAME } from '@/constants/tempCategory';

export async function GET() {
  try {
    const category = await readTemporaryCategory();
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: 'Failed to read temporary category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { items, name, preview } = await request.json();

    await writeTemporaryCategory({
      id: TEMP_CATEGORY_ID,
      name: {
        en: name?.en || TEMP_CATEGORY_NAME.en,
        'zh-tw': name?.['zh-tw'] || TEMP_CATEGORY_NAME['zh-tw'],
      },
      preview: typeof preview === 'string' ? preview : '',
      items: Array.isArray(items) ? items : undefined,
      lastUpdated: getTodayDateString(),
    });

    const updated = await readTemporaryCategory();
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update temporary category' }, { status: 500 });
  }
}
