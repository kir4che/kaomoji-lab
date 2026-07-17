import type { CategoryData } from '@/types/Kaomoji';
import { TEMP_CATEGORY_ID, createDefaultTemporaryCategory } from '@/constants/tempCategory';

// 將後端回傳的「暫存分類」資料正規化，確保所有欄位都有預設值。
export const normalizeTemporaryCategory = (data?: Partial<CategoryData>): CategoryData => {
  const base = createDefaultTemporaryCategory();

  return {
    ...base,
    ...data,
    id: TEMP_CATEGORY_ID,
    name: {
      en: data?.name?.en ?? base.name.en,
      'zh-tw': data?.name?.['zh-tw'] ?? base.name['zh-tw'],
    },
    preview: typeof data?.preview === 'string' ? data.preview : '',
    lastUpdated: data?.lastUpdated ?? base.lastUpdated,
    items: Array.isArray(data?.items) ? data.items : [],
  };
};

// 把分類列表中的「暫存分類」拆出來，跟一般分類分開管理。
export const splitCategoriesByTemp = (list: CategoryData[], fallbackTemp: CategoryData) => {
  let temp: CategoryData | null = null;
  const base: CategoryData[] = [];

  for (const category of list) {
    if (category.id === TEMP_CATEGORY_ID) {
      temp = normalizeTemporaryCategory(category);
    } else base.push(category);
  }

  // 若 list 裡完全沒有暫存分類，就用 fallbackTemp 代替。
  return { base, temp: temp ?? fallbackTemp };
};
