import { NextResponse } from 'next/server';

import { getAllTags } from '@/services/dataService';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const tags = await getAllTags();

    return NextResponse.json(tags, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
