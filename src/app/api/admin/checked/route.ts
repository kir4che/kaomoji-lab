import { NextRequest, NextResponse } from 'next/server';

import { readCheckedKaomojiIds, writeCheckedKaomojiIds } from '@/services/dataService';

export async function GET() {
  try {
    const ids = await readCheckedKaomojiIds();
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ error: 'Failed to load checked kaomoji ids' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string'))
      return NextResponse.json({ error: 'Invalid ids payload' }, { status: 400 });

    await writeCheckedKaomojiIds(ids);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save checked kaomoji ids' }, { status: 500 });
  }
}
