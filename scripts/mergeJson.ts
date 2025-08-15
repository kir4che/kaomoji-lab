import fs from 'fs';
import path from 'path';
import readline from 'readline';

import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';

export interface CategoryJson extends CategoryData {
  category?: string;
}

const baseDir = path.join(__dirname, '..', 'public', 'data', 'categories');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const toISODate = () => new Date().toISOString().split('T')[0];

const categoryFilePath = (fileName: string) => path.join(baseDir, `${fileName}.json`);

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

function safeReadJson<T>(fileName: string): T {
  const filePath = categoryFilePath(fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 檔案不存在: ${filePath}`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`❌ JSON 解析失敗：${filePath}`);
    console.error(err);
    process.exit(1);
  }
}

function safeWriteJson(fileName: string, data: CategoryJson) {
  const filePath = categoryFilePath(fileName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`📁 已輸出合併結果：${filePath}`);
}

function deleteJson(fileName: string): void {
  const filePath = categoryFilePath(fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ 已刪除檔案：${filePath}`);
  }
}

// 從 id 取得後綴 ex. abc_001 -> 001
function getSuffixFromId(id: string): string {
  const parts = id.split('_');
  return parts.length > 1 ? parts[1] : parts[0];
}

function mergeJsons(fileNames: string[]): CategoryJson | null {
  if (fileNames.length < 2) {
    console.error('❌ 至少需要兩個 JSON 檔才能合併');
    return null;
  }

  const baseJson: CategoryJson = safeReadJson<CategoryJson>(fileNames[0]);
  const baseCategory = baseJson.category;
  const mergedItemsMap = new Map<string, KaomojiItem>();

  for (const item of baseJson.items ?? []) mergedItemsMap.set(item.id, item);

  // 逐一合併其他檔案
  for (let i = 1; i < fileNames.length; i++) {
    let curJson: CategoryJson;
    try {
      curJson = safeReadJson<CategoryJson>(fileNames[i]);
    } catch (err) {
      console.error(`❌ 載入失敗：${fileNames[i]}.json`);
      throw err;
    }

    for (const item of curJson.items ?? []) {
      const suffix = getSuffixFromId(item.id);
      const newId = baseCategory ? `${baseCategory}_${suffix}` : suffix;

      // 合併 tags
      const newTags = new Set(item.tags ?? []);
      if (baseCategory) newTags.add(baseCategory);

      if (!mergedItemsMap.has(newId)) {
        mergedItemsMap.set(newId, {
          id: newId,
          text: item.text,
          tags: Array.from(newTags),
        });
      }
    }
  }

  const mergedItems = Array.from(mergedItemsMap.values()).sort((a, b) =>
    a.id.localeCompare(b.id, 'en')
  );

  return { ...baseJson, items: mergedItems };
}

// 顯示檔案資訊
function showFileInfo(fileNames: string[]): void {
  console.log('\n📋 即將合併的檔案資訊：');
  console.log('=====================================');

  fileNames.forEach((fileName, index) => {
    try {
      const data = safeReadJson<CategoryJson>(fileName);
      const status = index === 0 ? '🎯 主要檔案' : '🔄 將被合併';
      const nameReadable =
        typeof data.name === 'string'
          ? data.name
          : data.name?.['zh-tw'] || data.name?.en || '[未命名]';

      console.log(`${status}: ${fileName}.json`);
      console.log(`   名稱: ${nameReadable}`);
      console.log(`   項目數量: ${data.items?.length ?? 0}`);
      console.log(`   最後更新: ${data.lastUpdated}`);
      console.log('');
    } catch {
      console.log(`❌ ${fileName}.json - 檔案載入失敗`);
    }
  });
}

async function interactiveMain(): Promise<void> {
  const fileNames = process.argv.slice(2);

  if (fileNames.length < 2) {
    console.error('請提供至少兩個要合併的 JSON 檔案名稱（不需要 .json 副檔名）');
    console.log('用法: ts-node scripts/mergeJson.ts <file1> <file2> [...files]');
    process.exit(1);
  }

  showFileInfo(fileNames);

  console.log('⚠️  重要提醒：');
  console.log(`   • 所有檔案會合併到 "${fileNames[0]}.json"`);
  console.log(`   • 以下檔案將被永久刪除：`);
  for (let i = 1; i < fileNames.length; i++) {
    console.log(`     - ${fileNames[i]}.json`);
  }
  console.log('   • 建議先備份重要資料！\n');

  const firstConfirm = await askQuestion('🤔 確定要繼續合併嗎？(y/N): ');
  if (!/^y(es)?$/i.test(firstConfirm)) {
    console.log('❌ 取消合併操作');
    rl.close();
    return;
  }

  const secondConfirm = await askQuestion('⚠️  再次確認：此操作無法復原，確定要執行嗎？(y/N): ');
  if (!/^y(es)?$/i.test(secondConfirm)) {
    console.log('❌ 取消合併操作');
    rl.close();
    return;
  }

  console.log('\n🚀 開始合併...');
  const mergedJson = mergeJsons(fileNames);

  if (mergedJson) {
    mergedJson.lastUpdated = toISODate();
    safeWriteJson(fileNames[0], mergedJson);

    for (let i = 1; i < fileNames.length; i++) deleteJson(fileNames[i]);

    console.log('✅ 合併完成！');
    console.log(`📈 合併後共有 ${mergedJson.items?.length ?? 0} 個顏文字項目！`);
  }

  rl.close();
}

interactiveMain().catch((error) => {
  console.error('❌ 執行時發生錯誤:', error);
  rl.close();
  process.exit(1);
});
