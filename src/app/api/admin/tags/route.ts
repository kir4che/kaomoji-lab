import { NextRequest, NextResponse } from 'next/server';

import { readIndexFile, updateIndexFile, isTagInUse, getAllTags } from '@/services/dataService';

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

// 刪除標籤
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing tag ID.' }, { status: 400 });

    if (await isTagInUse(id))
      return NextResponse.json(
        { error: 'Tag is still in use and cannot be deleted.' },
        { status: 400 }
      );

    const indexData = await readIndexFile();
    const initialLength = indexData.tags.length;
    indexData.tags = indexData.tags.filter((t) => t.id !== id);

    if (indexData.tags.length === initialLength)
      return NextResponse.json({ error: 'Tag not found.' }, { status: 404 });

    await updateIndexFile(indexData);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete tag.' }, { status: 500 });
  }
}
