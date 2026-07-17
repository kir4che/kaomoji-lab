import fs from 'fs';
import path from 'path';

import type { CategoryData, CategorySummary, IndexData, Tag } from '@/types/Kaomoji';
import { getTodayDateString } from '@/utils/date';

function sortItemsById(data: CategoryData): CategoryData {
  data.items.sort((a, b) => {
    const numA = parseInt(a.id.split('_')[1] ?? '0', 10);
    const numB = parseInt(b.id.split('_')[1] ?? '0', 10);
    return numA - numB;
  });
  return data;
}

function sortAndCleanIndex(): void {
  const categoriesDir = path.join('public', 'data', 'categories');
  const indexPath = path.join('public', 'data', 'index.json');

  const categoryFiles = fs.readdirSync(categoriesDir).filter((file) => file.endsWith('.json'));

  const categories: CategorySummary[] = [];
  const allTags: Set<string> = new Set();

  categoryFiles.forEach((file) => {
    const filePath = path.join(categoriesDir, file);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data: CategoryData = JSON.parse(rawData);

    if (!data.items || data.items.length === 0) {
      fs.unlinkSync(filePath);
      console.log(`🗑 已刪除空分類檔案: ${file}`);
      return;
    }

    sortItemsById(data);

    data.items.forEach((item) => {
      item.tags.forEach((tag) => allTags.add(tag));
    });

    categories.push({
      id: data.id,
      name: data.name,
      preview: data.preview,
      lastUpdated: data.lastUpdated,
      itemCount: data.items.length,
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  });

  const tags: Tag[] = Array.from(allTags)
    .map((tagId) => ({
      id: tagId,
      name: { en: tagId, 'zh-tw': tagId },
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const indexData: IndexData = {
    categories,
    tags,
    totalItems: categories.reduce((sum, c) => sum + c.itemCount, 0),
    lastUpdated: getTodayDateString(),
  };

  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2) + '\n', 'utf-8');

  console.log(`目前分類列表：${categories.map((d) => d.id).join(', ')}`);
  console.log(`共收集到 ${indexData.tags.length} 個獨立 tag`);
  console.log(`共 ${indexData.totalItems} 個顏文字項目`);
  console.log('🎉 全部檔案處理完成，已產生 index.json！');
}

sortAndCleanIndex();
