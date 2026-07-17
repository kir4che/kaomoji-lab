import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';
import type { DuplicateCleanupPlan } from '@/utils/kaomojiDuplicates';
import { getTodayDateString } from '@/utils/date';
import { normalizeTag } from '@/utils/tagUtils';

export interface CleanupPlan {
  keeperId: string;
  duplicateIds: string[];
}

// 確保 duplicateIds 不包含 keeper 自己，避免誤刪。
export const normalizePlans = (plans: DuplicateCleanupPlan[]): CleanupPlan[] =>
  plans
    .map((plan) => ({
      keeperId: plan.keeperId,
      duplicateIds: Array.from(new Set(plan.duplicateIds.filter((id) => id !== plan.keeperId))),
    }))
    .filter((plan) => plan.duplicateIds.length > 0);

export interface CleanupResult {
  duplicateIds: Set<string>;
  updatedCategories: CategoryData[];
  updatesByCategory: Map<string, KaomojiItem[]>;
}

interface CategoryItemRemovalResult {
  deletedCount: number;
  updatedCategories: CategoryData[];
  updatesByCategory: Map<string, KaomojiItem[]>;
}

// 依照指定 ID 從分類資料中移除顏文字，回傳完整 next state 與實際需要寫回的分類。
export const computeCategoryItemRemoval = (
  categories: CategoryData[],
  kaomojiIds: Set<string>
): CategoryItemRemovalResult => {
  let deletedCount = 0;
  const today = getTodayDateString();
  const updatesByCategory = new Map<string, KaomojiItem[]>();

  const updatedCategories = categories.map((category) => {
    const updatedItems = category.items.filter((item) => !kaomojiIds.has(item.id));
    const removedCount = category.items.length - updatedItems.length;
    if (removedCount === 0) return category;

    deletedCount += removedCount;
    updatesByCategory.set(category.id, updatedItems);
    return { ...category, items: updatedItems, lastUpdated: today };
  });

  return { deletedCount, updatedCategories, updatesByCategory };
};

interface TagRemovalParams {
  categories: CategoryData[];
  selectedKaomojiIds: Set<string>;
  tagInputs: string[];
  tagSynonymMap?: Map<string, Set<string>>;
}

interface TagRemovalResult {
  updatedItemCount: number;
  updatedCategories: CategoryData[];
  updatesByCategory: Map<string, KaomojiItem[]>;
}

const buildTagRemovalLookup = (
  tagInputs: string[],
  tagSynonymMap: Map<string, Set<string>> = new Map()
) => {
  const lookup = new Set<string>();

  tagInputs.forEach((tagInput) => {
    const normalizedInput = normalizeTag(tagInput);
    if (!normalizedInput) return;
    lookup.add(normalizedInput);

    const synonyms = tagSynonymMap.get(tagInput) ?? tagSynonymMap.get(normalizedInput);
    synonyms?.forEach((synonym) => {
      const normalizedSynonym = normalizeTag(synonym);
      if (normalizedSynonym) lookup.add(normalizedSynonym);
    });
  });

  return lookup;
};

// 從選取顏文字移除指定標籤；比對時會使用 normalizeTag 與已知同義詞。
export const computeTagRemovalFromSelectedKaomoji = ({
  categories,
  selectedKaomojiIds,
  tagInputs,
  tagSynonymMap,
}: TagRemovalParams): TagRemovalResult => {
  const removalLookup = buildTagRemovalLookup(tagInputs, tagSynonymMap);
  const today = getTodayDateString();
  const updatesByCategory = new Map<string, KaomojiItem[]>();
  let updatedItemCount = 0;

  if (selectedKaomojiIds.size === 0 || removalLookup.size === 0)
    return { updatedItemCount, updatedCategories: categories, updatesByCategory };

  const updatedCategories = categories.map((category) => {
    let categoryChanged = false;
    const updatedItems = category.items.map((item) => {
      if (!selectedKaomojiIds.has(item.id)) return item;

      const nextTags = item.tags.filter((tag) => !removalLookup.has(normalizeTag(tag)));
      if (nextTags.length === item.tags.length) return item;

      categoryChanged = true;
      updatedItemCount += 1;
      return { ...item, tags: nextTags };
    });

    if (!categoryChanged) return category;
    updatesByCategory.set(category.id, updatedItems);
    return { ...category, items: updatedItems, lastUpdated: today };
  });

  return { updatedItemCount, updatedCategories, updatesByCategory };
};

// 輸入一組「一對多」清理計畫，每組指定一個 keeper 與多個 duplicate。刪除前會先將 duplicate 的標籤合併至 keeper，並回傳需刪除的顏文字、需更新標籤的 keeper，以及完整的新分類陣列。
export const computeDuplicateCleanup = (
  categories: CategoryData[],
  plans: CleanupPlan[]
): CleanupResult => {
  const duplicateIds = new Set(plans.flatMap((plan) => plan.duplicateIds));
  const itemById = new Map<string, KaomojiItem>();
  categories.forEach((cat) => cat.items.forEach((item) => itemById.set(item.id, item)));

  // 把每組 duplicate 的標籤蒐集起來，合併到對應的 keeper 身上。
  const mergedTagsByKeeperId = new Map<string, string[]>();
  plans.forEach((plan) => {
    const keeper = itemById.get(plan.keeperId);
    if (!keeper) return;
    const merged = new Set(keeper.tags);
    plan.duplicateIds.forEach((dupId) => {
      itemById.get(dupId)?.tags.forEach((tag) => merged.add(tag));
    });
    mergedTagsByKeeperId.set(plan.keeperId, Array.from(merged));
  });

  const today = getTodayDateString();
  const updatesByCategory = new Map<string, KaomojiItem[]>();
  const updatedCategories = categories.map((category) => {
    let hasChanges = false;
    const updatedItems = category.items
      .filter((item) => {
        // duplicateIds 裡的顏文字一律刪除
        if (duplicateIds.has(item.id)) {
          hasChanges = true;
          return false;
        }
        return true;
      })
      .map((item) => {
        // keeper 若 merge 了新標籤，更新它。
        const mergedTags = mergedTagsByKeeperId.get(item.id);
        if (!mergedTags) return item;
        if (
          item.tags.length === mergedTags.length &&
          item.tags.every((tag, i) => tag === mergedTags[i])
        )
          return item;
        hasChanges = true;
        return { ...item, tags: mergedTags };
      });

    if (!hasChanges) return category;
    updatesByCategory.set(category.id, updatedItems);
    return { ...category, items: updatedItems, lastUpdated: today };
  });

  return { duplicateIds, updatesByCategory, updatedCategories };
};
