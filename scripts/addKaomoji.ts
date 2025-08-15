import fs from 'fs';
import path from 'path';

import csv from 'csv-parser';

import type { KaomojiItem, CategoryData, CategorySummary, IndexData } from '@/types/Kaomoji';

interface CsvRow {
  category: string;
  text: string;
  tags: string;
}

const toISODate = () => new Date().toISOString().split('T')[0];

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const readJson = <T>(filePath: string): T => {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 檔案不存在：${filePath}`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`❌ 讀取或解析 JSON 失敗：${filePath}`);
    console.error(err);
    process.exit(1);
  }
};

const writeJson = (filePath: string, data: CategoryData | IndexData): void => {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// 新增顏文字到分類
const addKaomojiToCategory = (
  categoryData: CategoryData,
  categoryId: string,
  text: string,
  tags: string[]
): boolean => {
  if (!text) return false;

  const exists = categoryData.items.some((item: KaomojiItem) => item.text === text);
  if (exists) {
    console.log(`⚠️ 忽略重複顏文字：${text}（${categoryId}）!`);
    return false;
  }

  // 找到最大的序號 + 1
  const maxSeq = Math.max(
    0,
    ...categoryData.items
      .map((item) => parseInt(item.id.split('_')[1] || '0', 10))
      .filter((n) => !Number.isNaN(n))
  );
  const newId = `${categoryId}_${String(maxSeq + 1).padStart(3, '0')}`;

  if (categoryData.items.some((item) => item.id === newId)) {
    console.error(`❌ ${newId} 已存在於分類 ${categoryId} 中！`);
    return false;
  }

  categoryData.items.push({ id: newId, text, tags });
  categoryData.lastUpdated = toISODate();
  return true;
};

// 更新 index.json
const updateIndex = (indexData: IndexData, categoriesData: Record<string, CategoryData>): void => {
  let total = 0;

  indexData.categories.forEach((cat) => {
    const data = categoriesData[cat.id];
    if (!data) return;
    cat.itemCount = data.items.length;
    cat.name = data.name;
    cat.preview = cat.preview ?? data.preview ?? '';
    cat.lastUpdated = data.lastUpdated ?? toISODate();
    total += data.items.length;
  });

  indexData.totalItems = total;
  indexData.lastUpdated = toISODate();
};

// 確保所有分類檔案存在（按 index.json）
const ensureCategoryFilesExist = (indexData: IndexData): void => {
  const dataDir = path.join('public', 'data');

  for (const cat of indexData.categories) {
    const categoryFilePath = path.join(dataDir, 'categories', `${cat.id}.json`);
    if (!fs.existsSync(categoryFilePath)) {
      console.log(`🆕 ${categoryFilePath} 不存在，建立空分類檔案。`);

      const newCategoryData: CategoryData = {
        id: cat.id,
        name: cat.name,
        preview: cat.preview || '',
        lastUpdated: toISODate(),
        items: [],
      };

      writeJson(categoryFilePath, newCategoryData);
    }
  }
};

const normalizeCsvRow = (row: CsvRow) => {
  const rawCategory = (row.category ?? '').trim();
  const categoryId = rawCategory.split(' ')[0];
  const text = (row.text ?? '').trim();
  const tags = row.tags
    ? row.tags
        .split(';')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  if (!categoryId || !text) return null;
  return { categoryId, text, tags };
};

const processCsv = (csvFilePath: string): void => {
  const dataDir = path.join('public', 'data');
  const idxFilePath = path.join(dataDir, 'index.json');
  const indexData = readJson<IndexData>(idxFilePath);

  ensureDir(path.join(dataDir, 'categories'));
  ensureCategoryFilesExist(indexData);

  const categoriesData: Record<string, CategoryData> = {};
  for (const cat of indexData.categories) {
    const filePath = path.join(dataDir, 'categories', `${cat.id}.json`);
    categoriesData[cat.id] = readJson<CategoryData>(filePath);
  }

  let addedCount = 0;

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row: CsvRow) => {
      const normalized = normalizeCsvRow(row);
      if (!normalized) return;

      const { categoryId, text, tags } = normalized;

      if (!categoriesData[categoryId]) {
        console.log(`🆕 找不到分類：${categoryId}，自動建立中...`);

        const newCategoryData: CategoryData = {
          id: categoryId,
          name: { en: categoryId, 'zh-tw': categoryId },
          preview: '',
          lastUpdated: toISODate(),
          items: [],
        };
        const newCatFilePath = path.join(dataDir, `categories/${categoryId}.json`);
        writeJson(newCatFilePath, newCategoryData);
        categoriesData[categoryId] = newCategoryData;

        const newIndexCategory: CategorySummary = {
          id: categoryId,
          name: { en: categoryId, 'zh-tw': categoryId },
          preview: '',
          filePath: `categories/${categoryId}.json`,
          itemCount: 0,
          lastUpdated: toISODate(),
        };
        indexData.categories.push(newIndexCategory);
      }

      const added = addKaomojiToCategory(categoriesData[categoryId], categoryId, text, tags);
      if (added) addedCount += 1;
    })
    .on('error', (err) => {
      console.error('❌ 讀取 CSV 發生錯誤：', err);
      process.exit(1);
    })
    .on('end', () => {
      for (const catId of Object.keys(categoriesData)) {
        const catFilePath = path.join(dataDir, `categories/${catId}.json`);
        writeJson(catFilePath, categoriesData[catId]);
      }

      updateIndex(indexData, categoriesData);
      writeJson(idxFilePath, indexData);

      console.log(`🚀 總共新增了 ${addedCount} 條顏文字！`);

      try {
        fs.writeFileSync(csvFilePath, 'category,text,tags\n', 'utf-8');
        console.log(`🗑 已清空 CSV 檔案：${csvFilePath}`);
      } catch (err) {
        console.error('⚠️ 清空 CSV 檔案失敗：', err);
      }
    });
};

const csvFile = process.argv[2];
if (!csvFile) {
  console.error('請輸入 CSV 檔案路徑，例如：node scripts/addFromCsv.js kaomoji.csv！');
  process.exit(1);
}

if (!/\.csv$/i.test(csvFile)) console.warn('⚠️ 看起來不是 .csv 副檔名，請確認檔案格式是否正確。');

processCsv(csvFile);
