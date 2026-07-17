import fs from 'fs';
import path from 'path';

import type { CategoryData, IndexData, KaomojiItem } from '@/types/Kaomoji';
import { getTodayDateString } from '@/utils/date';

interface ScrapedItem {
  category: string;
  text: string;
  tags: string[];
}

// 先盡量清理頁面中與顏文字無關的內容
const stripHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#\d+;/gi, ' ')
    .replace(/\s{3,}/g, '\n\n')
    .trim();

async function fetchWithFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KaomojiScraper/1.0)' },
      signal: AbortSignal.timeout(10_000), // 10 秒超時
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = stripHtml(html);
    return text.length > 200 ? text : null;
  } catch {
    return null;
  }
}

async function fetchPageContent(url: string): Promise<string> {
  const text = await fetchWithFetch(url);
  if (text) return text;
  throw new Error('無法取得頁面內容');
}

// 給 AI 處理的最大文字長度，避免超過 API 限制。
const MAX_TEXT_CHARS = 100_000;

// 把 CSV 文字解析成 ScrapedItem[]，同時依照 validCategories 篩掉不合法資料。
function parseCsvResponse(csvText: string, validCategories: Set<string>): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  const lines = csvText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.toLowerCase().startsWith('category,')) continue;

    // 切割三個欄位
    const firstComma = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    if (firstComma === -1 || secondComma === -1) continue;

    const category = line.slice(0, firstComma).trim().toLowerCase();
    const text = line.slice(firstComma + 1, secondComma).trim();
    const tagsRaw = line.slice(secondComma + 1).trim();
    const tags = tagsRaw
      .split(';')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!validCategories.has(category)) continue;
    if (!text) continue;

    items.push({ category, text, tags });
  }

  return items;
}

// 使用 Gemini AI 來分析頁面文字，找出顏文字並分類及加上 tag。
async function categorizeWithAI(
  pageText: string,
  categories: string[],
  existingTags: string[]
): Promise<ScrapedItem[]> {
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  if (!apiKey) throw new Error('缺少 GEMINI_API_KEY 環境變數！');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
  });

  const truncated = pageText.slice(0, MAX_TEXT_CHARS);
  const categoryList = categories.join(', ');
  const tagList = existingTags.join(', ');

  const prompt = `你是顏文字資料庫的整理員。

從以下網頁文字中，找出所有顏文字（Kaomoji）。
- 顏文字是由各種 Unicode 字元組成的文字表情，例如：(´• ω •\`), ヽ(°〇°)ﾉ, ╰( ^o^)╮
- 只輸出真正的顏文字，不要輸出一般文字、標題、說明文字
- 每個顏文字分配到以下其中一個分類：${categoryList}
- 每個顏文字生成 1~4 個英文 tag（用分號分隔），**優先從以下現有 tag 中選擇**，找不到合適的才新造：${tagList}

**只輸出 CSV 格式，不要加任何說明文字或 code fence：**
category,text,tags

範例：
happy,(´▽\`),happy;smile
action,ヽ(°〇°)ﾉ,excited;arms-up
sad,(´；ω；\`),sad;crying

---
網頁文字：
${truncated}`;

  console.log('分析中...');

  let lastError: Error | null = null;
  const maxRetries = 3; // 最多失敗重試次數

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      const csvText = raw
        .replace(/^```[a-z]*\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      // 將允許的分類轉成 Set (集合)，可以加速搜尋比對
      const validCategories = new Set(categories);
      return parseCsvResponse(csvText, validCategories);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRetryable =
        lastError.message.includes('500') ||
        lastError.message.includes('429') ||
        lastError.message.includes('timeout');

      if (!isRetryable || attempt === maxRetries) throw lastError;

      const delay = attempt * 1000;
      console.log(`⚠️ AI 發生暫時錯誤，${delay}ms 後重試（${attempt}/${maxRetries - 1}）...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError || new Error('AI categorization failed');
}

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8'); // 同步讀取檔案內容
  return JSON.parse(raw) as T; // 解析 JSON 字串
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 讀取本地現有的所有顏文字，防止存入重複的。
function loadAllExistingTexts(dataDir: string): Set<string> {
  const existing = new Set<string>();
  const categoriesDir = path.join(dataDir, 'categories');
  if (!fs.existsSync(categoriesDir)) return existing;

  for (const file of fs.readdirSync(categoriesDir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = readJson<CategoryData>(path.join(categoriesDir, file));
      for (const item of data.items) existing.add(item.text);
    } catch {}
  }
  return existing;
}

function writeItems(items: ScrapedItem[], dataDir: string, indexData: IndexData): number {
  const categoriesDir = path.join(dataDir, 'categories');
  const categoriesData: Record<string, CategoryData> = {};
  const touchedCategories = new Set(items.map((i) => i.category));

  for (const catId of touchedCategories) {
    const filePath = path.join(categoriesDir, `${catId}.json`);
    if (fs.existsSync(filePath)) categoriesData[catId] = readJson<CategoryData>(filePath);
    else {
      const firstText = items.find((i) => i.category === catId)?.text ?? '';
      categoriesData[catId] = {
        id: catId,
        name: { en: catId, 'zh-tw': catId },
        preview: firstText,
        lastUpdated: getTodayDateString(),
        items: [],
      };
      if (!indexData.categories.some((c) => c.id === catId)) {
        indexData.categories.push({
          id: catId,
          name: { en: catId, 'zh-tw': catId },
          preview: firstText,
          lastUpdated: getTodayDateString(),
          itemCount: 0,
        });
      }
    }
  }

  let addedCount = 0;

  for (const { category, text, tags } of items) {
    const catData = categoriesData[category];
    if (catData.items.some((i: KaomojiItem) => i.text === text)) continue;

    const maxSeq = Math.max(
      0,
      ...catData.items
        .map((i: KaomojiItem) => parseInt(i.id.split('_')[1] ?? '0', 10))
        .filter((n: number) => !Number.isNaN(n))
    );
    const newId = `${category}_${String(maxSeq + 1).padStart(3, '0')}`;

    catData.items.push({ id: newId, text, tags });
    catData.lastUpdated = getTodayDateString();
    addedCount++;
  }

  for (const catId of touchedCategories)
    writeJson(path.join(categoriesDir, `${catId}.json`), categoriesData[catId]);

  for (const cat of indexData.categories) {
    if (categoriesData[cat.id]) {
      cat.itemCount = categoriesData[cat.id].items.length;
      cat.lastUpdated = categoriesData[cat.id].lastUpdated;
    }
  }
  indexData.lastUpdated = getTodayDateString();
  (indexData as IndexData & { totalItems?: number }).totalItems = indexData.categories.reduce(
    (s, c) => s + (c.itemCount ?? 0),
    0
  );

  return addedCount;
}

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error('❌ 請提供至少一個 URL 作為參數！');
    process.exit(1);
  }

  for (const url of urls) {
    if (!/^https?:\/\/.+/.test(url)) {
      console.error(`❌ 無效的 URL：${url}`);
      process.exit(1);
    }
  }

  const dataDir = path.join(process.cwd(), 'public', 'data');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) {
    console.error(`❌ 找不到 ${indexPath}`);
    process.exit(1);
  }

  const indexData = readJson<IndexData>(indexPath);
  const categories = indexData.categories.map((c) => c.id);
  const existingTags = (indexData.tags ?? []).map((t) => t.id);

  let totalAdded = 0;

  for (const url of urls) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`處理：${url}`);
    console.log('='.repeat(50));

    try {
      const pageText = await fetchPageContent(url);

      const rawItems = await categorizeWithAI(pageText, categories, existingTags);
      console.log(`📦 AI 找到 ${rawItems.length} 個顏文字`);

      if (rawItems.length === 0) {
        console.log('沒有找到任何的顏文字！');
        continue;
      }

      const existing = loadAllExistingTexts(dataDir);
      const newItems = rawItems.filter((item) => !existing.has(item.text));
      const dupCount = rawItems.length - newItems.length;
      if (dupCount > 0) console.log(`⏭️ 略過 ${dupCount} 個已存在的顏文字`);
      console.log(`🆕 準備新增 ${newItems.length} 個`);

      if (newItems.length === 0) {
        console.log('全部都已存在！');
        continue;
      }

      const addedCount = writeItems(newItems, dataDir, indexData);
      console.log(`✍️ 新增了 ${addedCount} 個顏文字`);
      totalAdded += addedCount;
    } catch (err) {
      console.error(`❌ 處理 ${url} 時出錯：`, err instanceof Error ? err.message : err);
      continue;
    }
  }

  writeJson(indexPath, indexData);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`總共新增 ${totalAdded} 個顏文字`);
  console.log('='.repeat(50));
}

main().catch((err) => {
  console.error('❌ 發生錯誤：', err instanceof Error ? err.message : err);
  process.exit(1);
});
