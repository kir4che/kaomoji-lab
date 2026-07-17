import type { CategoryData, CategoryName } from '@/types/Kaomoji';
import { getTodayDateString } from '@/utils/date';

export const TEMP_CATEGORY_ID = '__temp';

export const TEMP_CATEGORY_NAME: CategoryName = {
  en: 'Temporary',
  'zh-tw': '暫存',
};

export const createDefaultTemporaryCategory = (): CategoryData => ({
  id: TEMP_CATEGORY_ID,
  name: TEMP_CATEGORY_NAME,
  preview: '',
  lastUpdated: getTodayDateString(),
  items: [],
});
