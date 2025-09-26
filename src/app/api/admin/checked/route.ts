import { NextRequest, NextResponse } from 'next/server';

import { readCheckedKaomojiIds, writeCheckedKaomojiIds } from '@/services/dataService';

const isLocalPersistenceEnabled = () => process.env.NODE_ENV !== 'production';

export async function GET() {
  if (!isLocalPersistenceEnabled())
    return NextResponse.json({ error: 'Checked kaomoji persistence disabled' }, { status: 501 });

  try {
    const ids = await readCheckedKaomojiIds();
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ error: 'Failed to load checked kaomoji ids' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isLocalPersistenceEnabled())
    return NextResponse.json({ error: 'Checked kaomoji persistence disabled' }, { status: 501 });

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
