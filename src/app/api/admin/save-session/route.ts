import { NextRequest, NextResponse } from 'next/server';

import type { CategoryData, Tag } from '@/types/Kaomoji';
import { saveAdminSnapshot } from '@/services/dataService';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isLocalizedName = (value: unknown): value is CategoryData['name'] =>
  isRecord(value) && typeof value.en === 'string' && typeof value['zh-tw'] === 'string';

const isTag = (value: unknown): value is Tag =>
  isRecord(value) && typeof value.id === 'string' && isLocalizedName(value.name);

const isCategoryData = (value: unknown): value is CategoryData =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  isLocalizedName(value.name) &&
  typeof value.preview === 'string' &&
  typeof value.lastUpdated === 'string' &&
  Array.isArray(value.items) &&
  value.items.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === 'string' &&
      typeof item.text === 'string' &&
      Array.isArray(item.tags) &&
      item.tags.every((tag) => typeof tag === 'string')
  );

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    if (!isRecord(body) || !Array.isArray(body.categories) || !Array.isArray(body.tags)) {
      return NextResponse.json({ error: 'Invalid admin snapshot payload' }, { status: 400 });
    }

    const checkedKaomojiIds =
      Array.isArray(body.checkedKaomojiIds) &&
      body.checkedKaomojiIds.every((id) => typeof id === 'string')
        ? body.checkedKaomojiIds
        : undefined;

    if (
      !body.categories.every(isCategoryData) ||
      !body.tags.every(isTag) ||
      ('checkedKaomojiIds' in body && checkedKaomojiIds === undefined)
    ) {
      return NextResponse.json({ error: 'Invalid admin snapshot data' }, { status: 400 });
    }

    const result = await saveAdminSnapshot({
      categories: body.categories,
      tags: body.tags,
      checkedKaomojiIds,
    });

    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ error: 'Failed to save admin session' }, { status: 500 });
  }
}
