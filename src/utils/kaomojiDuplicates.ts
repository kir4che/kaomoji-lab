import type { CategoryData } from '@/types/Kaomoji';

interface DuplicateOptions {
  threshold?: number;
  strict?: boolean;
  fingerprint?: boolean;
  keepStrategy?: 'file' | 'id' | 'priorities';
  categoryPriority?: string[];
}

export interface DuplicateItem {
  text: string;
  id: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
}

export type DuplicateConfidence = 'safe' | 'review';

export interface DuplicateCleanupPlan {
  keeperId: string;
  duplicateIds: string[];
}

export interface DuplicateGroup {
  id: string;
  key: string;
  items: DuplicateItem[];
  keeper: DuplicateItem;
  duplicates: DuplicateItem[];
  confidence: DuplicateConfidence;
  reasons: string[];
  suggestedDeleteIds: string[];
}

const DEFAULT_PRIORITY = ['happy', 'love', 'greeting', 'confident', 'excited', 'other'];

const DEFAULT_OPTIONS: Required<DuplicateOptions> = {
  threshold: 1,
  strict: false,
  fingerprint: true,
  keepStrategy: 'file',
  categoryPriority: DEFAULT_PRIORITY,
};

const normalize = (text: string, preserveSymbols: boolean) => {
  const base = text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[（［｛〈《]/g, '(')
    .replace(/[）］｝〉》]/g, ')')
    .replace(/[“”‘’«»‹›]/g, '"');

  if (preserveSymbols) return base;

  return base
    .replace(/[・･•·｡゚゛ゞゝゞゝﾞﾟ*]/g, '')
    .replace(/[_^~｀´΄᷄᷅᷆᷇᷄᷈᷉ˊˋ˘˙]/g, '')
    .replace(/[^(){}\[\]a-z0-9ぁ-んァ-ン一-龥]/g, '');
};

const collapseConsecutiveChars = (text: string) =>
  Array.from(text)
    .filter((char, index, chars) => index === 0 || char !== chars[index - 1])
    .join('');

const buildFingerprint = (text: string) => {
  const normalized = normalize(text, true);

  const parens = normalized.replace(/[^(){}\[\]]/g, '');
  const coreShape = collapseConsecutiveChars(normalized.replace(/[(){}\[\]]/g, ''));
  const hands = /(?:゛|ゞ|ゝ|゜|✋|ﾉ|ง|╯|ヾ|ㄟ|ლ)/.test(normalized) ? 'hand' : 'nohand';
  const stars = /[*✱✲✧☆★✶✷✴✵✺✹✳✿❀❁❂❃❊❋❉❈❇❆❅]/.test(normalized) ? 'star' : 'nostar';

  return `${parens}|${hands}|${stars}|${coreShape}`;
};

const levenshtein = (a: string, b: string, max: number): number => {
  if (a === b) return 0;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > max) return max + 1;
  if (lenA > lenB) return levenshtein(b, a, max);

  let previous = new Array(lenA + 1);
  for (let i = 0; i <= lenA; i++) previous[i] = i;

  for (let j = 1; j <= lenB; j++) {
    const bj = b[j - 1];
    const current = new Array(lenA + 1);
    current[0] = j;
    let rowMin = current[0];
    for (let i = 1; i <= lenA; i++) {
      const cost = a[i - 1] === bj ? 0 : 1;
      const del = previous[i] + 1;
      const ins = current[i - 1] + 1;
      const sub = previous[i - 1] + cost;
      const val = Math.min(del, ins, sub);
      current[i] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  const dist = previous[lenA];
  return dist > max ? max + 1 : dist;
};

interface Entry {
  index: number;
  key: string;
  items: DuplicateItem[];
  fingerprint: string;
}

const compareByPriority = (
  a: DuplicateItem,
  b: DuplicateItem,
  strategy: 'file' | 'id' | 'priorities',
  priorities: string[]
) => {
  if (strategy === 'id') return a.id.localeCompare(b.id, 'zh-TW');
  if (strategy === 'priorities') {
    const indexA = priorities.indexOf(a.categoryId);
    const indexB = priorities.indexOf(b.categoryId);
    const safeA = indexA === -1 ? priorities.length : indexA;
    const safeB = indexB === -1 ? priorities.length : indexB;
    if (safeA !== safeB) return safeA - safeB;
    return a.id.localeCompare(b.id, 'zh-TW');
  }
  return a.categoryId.localeCompare(b.categoryId, 'zh-TW') || a.id.localeCompare(b.id, 'zh-TW');
};

const assessDuplicateConfidence = (
  items: DuplicateItem[],
  entryGroup: Entry[],
  fingerprint: boolean
): { confidence: DuplicateConfidence; reasons: string[] } => {
  const reasons: string[] = [];
  const symbolPreservedKeys = new Set(items.map((item) => normalize(item.text, true)));

  if (symbolPreservedKeys.size === 1) {
    reasons.push('符號保留後仍完全相同');
    return { confidence: 'safe', reasons };
  }

  if (entryGroup.length > 1) reasons.push('相似但不是完全相同');
  if (!fingerprint) reasons.push('未比較手勢與星號特徵');

  return {
    confidence: 'review',
    reasons: reasons.length > 0 ? reasons : ['符號或文字細節不同'],
  };
};

export const findDuplicateGroups = (
  categories: CategoryData[],
  options: DuplicateOptions = {}
): DuplicateGroup[] => {
  const { threshold, strict, fingerprint, keepStrategy, categoryPriority } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const keyMap = new Map<string, Entry>();
  let entryIndex = 0;

  categories.forEach((category) => {
    const categoryId = category.id;
    const categoryName = category.name?.['zh-tw'] || category.name?.en || categoryId;
    category.items.forEach((item) => {
      const key = normalize(item.text, strict);
      if (!key) return;
      const duplicateItem: DuplicateItem = {
        text: item.text,
        id: item.id,
        categoryId,
        categoryName,
        tags: item.tags,
      };
      if (!keyMap.has(key))
        keyMap.set(key, {
          index: entryIndex++,
          key,
          items: [duplicateItem],
          fingerprint: fingerprint ? buildFingerprint(item.text) : '',
        });
      else keyMap.get(key)!.items.push(duplicateItem);
    });
  });

  const entries = Array.from(keyMap.values());

  const parent = entries.map((_, idx) => idx);
  const find = (x: number): number => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return;
    parent[rootB] = rootA;
  };

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const entryA = entries[i];
      const entryB = entries[j];
      const lengthDiff = Math.abs(entryA.key.length - entryB.key.length);
      if (lengthDiff > threshold) continue;
      if (fingerprint && entryA.fingerprint !== entryB.fingerprint) continue;
      const distance = levenshtein(entryA.key, entryB.key, threshold);
      if (distance === 0 || distance > threshold) continue;
      union(i, j);
    }
  }

  const grouped = new Map<number, Entry[]>();
  entries.forEach((entry, idx) => {
    const root = find(idx);
    if (!grouped.has(root)) grouped.set(root, []);
    grouped.get(root)!.push(entry);
  });

  const groups: DuplicateGroup[] = [];

  Array.from(grouped.values()).forEach((entryGroup, idx) => {
    const items = entryGroup.flatMap((entry) => entry.items);
    if (items.length <= 1) return;
    const sorted = [...items].sort((a, b) =>
      compareByPriority(a, b, keepStrategy, categoryPriority)
    );
    const keeper = sorted[0];
    const duplicates = sorted.slice(1);
    const { confidence, reasons } = assessDuplicateConfidence(sorted, entryGroup, fingerprint);
    groups.push({
      id: `dup-${idx}`,
      key: entryGroup[0].key,
      items: sorted,
      keeper,
      duplicates,
      confidence,
      reasons,
      suggestedDeleteIds: confidence === 'safe' ? duplicates.map((duplicate) => duplicate.id) : [],
    });
  });

  return groups.sort((a, b) => b.items.length - a.items.length);
};

export type { DuplicateOptions };
