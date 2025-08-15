import type { Language } from '@/types/Language';

export type CategoryName = Record<Language, string>;

export interface KaomojiItem {
  id: string;
  text: string;
  tags: string[];
}

export interface CategoryData {
  id: string; // 分類 ID
  name: CategoryName; // 分類名稱
  preview: string; // 預覽顏文字
  lastUpdated: string; // 最後更新日期
  items: KaomojiItem[]; // 顏文字項目
}

export interface CategorySummary {
  id: string;
  name: CategoryName;
  preview: string;
  lastUpdated: string;
  itemCount: number;
  filePath?: string;
}

export interface IndexData {
  categories: CategorySummary[];
  totalItems?: number;
  lastUpdated?: string;
  tags?: string[];
}
