import type { CategoryData, CategoryName } from '@/types/Kaomoji';

export const TEMP_CATEGORY_ID = '__temp';

export const TEMP_CATEGORY_NAME: CategoryName = {
  en: 'Temporary',
  'zh-tw': '暫存',
};

export const createDefaultTemporaryCategory = (): CategoryData => ({
  id: TEMP_CATEGORY_ID,
  name: TEMP_CATEGORY_NAME,
  preview: '',
  lastUpdated: new Date().toISOString().split('T')[0],
  items: [],
});
