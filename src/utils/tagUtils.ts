import type { Tag } from '@/types/Kaomoji';

// 清理標籤前後的非必要符號與空白
export const sanitizeTagToken = (value: string): string =>
  value
    .normalize('NFKC')
    .replace(/^[\s"'`“”‘’「」『』《》〈〉﹁﹂﹃﹄()（）\[\]{}【】<>]+/, '')
    .replace(/[\s"'`“”‘’「」『』《》〈〉﹁﹂﹃﹄()（）\[\]{}【】<>]+$/, '')
    .trim();

// 正規化 tag：NFKC 標準化、去頭尾空白、轉小寫
export const normalizeTag = (tag: string): string =>
  tag.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

// 建立 tag「名稱 → ID」的查詢表
export const buildTagLookup = (tags: Tag[]): Map<string, string> => {
  const map = new Map<string, string>();
  tags.forEach((tag) => {
    const candidates = [tag.id, tag.name?.en, tag.name?.['zh-tw']].filter(
      (value): value is string => Boolean(value)
    );
    candidates.forEach((value) => {
      const normalized = normalizeTag(value);
      if (!normalized) return;
      if (!map.has(normalized)) map.set(normalized, tag.id);
    });
  });
  return map;
};

// 建立「tag ID → 同義詞集合」的對照表
export const buildTagSynonymMap = (tags: Tag[]): Map<string, Set<string>> => {
  const map = new Map<string, Set<string>>();
  tags.forEach((tag) => {
    if (!tag?.id) return;
    const synonyms = new Set<string>();
    synonyms.add(tag.id.trim());
    if (tag.name?.en) synonyms.add(tag.name.en.trim());
    if (tag.name?.['zh-tw']) synonyms.add(tag.name['zh-tw'].trim());
    map.set(tag.id, synonyms);
  });
  return map;
};

// 透過查詢表將輸入字串解析為 tag ID，找不到則回傳原字串。
export const resolveTagId = (tagInput: string, tagLookup: Map<string, string>): string => {
  const normalized = normalizeTag(tagInput);
  if (!normalized) return '';
  return tagLookup.get(normalized) ?? tagInput.trim();
};
