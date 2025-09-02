import { NextResponse } from 'next/server';

import { getAllTags } from '@/services/dataService';

export async function GET() {
  try {
    const tags = await getAllTags();
    return NextResponse.json(tags);
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
