import { NextResponse, NextRequest } from 'next/server';

import { readIndexFile, updateIndexFile, getUsedTags } from '@/services/dataService';

// 清理未使用的標籤
export async function DELETE(req: NextRequest) {
  try {
    const indexData = await readIndexFile();
    let tagsToRemove: string[] = [];

    try {
      const body = await req.json();
      if (Array.isArray(body.tags) && body.tags.every((t: unknown) => typeof t === 'string'))
        tagsToRemove = body.tags;
      else throw new Error('Invalid request body: tags must be an array of strings.');
    } catch {
      const usedTags = await getUsedTags();

      const allTags = indexData.tags ?? [];
      if (allTags.length > 0) {
        if (typeof allTags[0] === 'object' && 'id' in allTags[0])
          tagsToRemove = (allTags as any[])
            .map((tag) => tag.id)
            .filter((tagId: string) => !usedTags.has(tagId));
        else tagsToRemove = (allTags as unknown as string[]).filter((tag) => !usedTags.has(tag));
      }
    }

    if (tagsToRemove.length === 0)
      return NextResponse.json({
        success: true,
        message: 'No unused tags to clean up.',
        removedCount: 0,
      });

    const currentTags = indexData.tags ?? [];
    if (currentTags.length > 0) {
      if (typeof currentTags[0] === 'object' && 'id' in currentTags[0])
        indexData.tags = (currentTags as any[])
          .filter((tag) => !tagsToRemove.includes(tag.id))
          .sort((a, b) => a.id.localeCompare(b.id)) as any;
      else
        indexData.tags = (currentTags as unknown as string[])
          .filter((tag) => !tagsToRemove.includes(tag))
          .sort() as any;
    }

    await updateIndexFile(indexData);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${tagsToRemove.length} tags.`,
      removedCount: tagsToRemove.length,
      removedTags: tagsToRemove,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to clean up unused tags.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
