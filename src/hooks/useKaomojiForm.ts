import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { useToast } from '@/contexts/ToastContext';
import type { KaomojiItem, Tag } from '@/types/Kaomoji';

const isEnglish = (text: string) => /^[\x20-\x7E]+$/.test(text);

const slugifyId = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || `tag-${Date.now()}`;
};

interface UseKaomojiFormParams {
  kaomoji: KaomojiItem;
  currCategory: string;
  onSave: (kaomoji: KaomojiItem) => Promise<void>;
  onMove: (toCategory: string, updatedData?: KaomojiItem) => void;
  availableTags?: Tag[];
  onTagCreated?: (tag: Tag) => void | Promise<void>;
}

// 管理單一顏文字的編輯表單，包含自動儲存、標籤正規化與即時建立新標籤。
export const useKaomojiForm = ({
  kaomoji,
  currCategory,
  onSave,
  onMove,
  availableTags = [],
  onTagCreated,
}: UseKaomojiFormParams) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<KaomojiItem>(kaomoji);
  const [newTag, setNewTag] = useState('');
  const [selectedMoveCategory, setSelectedMoveCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [customTags, setCustomTags] = useState<Tag[]>([]);

  const normalizeTag = useCallback((tag: string) => {
    return tag.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  }, []);

  useEffect(() => {
    setCustomTags((prev) =>
      prev.filter((tag) => !availableTags.some((origin) => origin.id === tag.id))
    );
  }, [availableTags]);

  const combinedTags = useMemo(() => {
    const map = new Map<string, Tag>();
    availableTags.forEach((tag) => map.set(tag.id, tag));
    customTags.forEach((tag) => map.set(tag.id, tag));
    return Array.from(map.values());
  }, [availableTags, customTags]);

  const tagLookup = useMemo(() => {
    const map = new Map<string, string>();

    // 表單內接受標籤 ID、英文名、中文名三種輸入方式，都對應到同一個標籤。
    combinedTags.forEach((tag) => {
      const candidates = [tag.id, tag.name?.en, tag.name?.['zh-tw']].filter(
        (value): value is string => Boolean(value)
      );

      candidates.forEach((value) => {
        const normalized = normalizeTag(value);
        if (!normalized) return;
        map.set(normalized, tag.id);
      });
    });

    return map;
  }, [combinedTags, normalizeTag]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>('');
  useEffect(() => {
    setFormData(kaomoji);
    setNewTag('');
    setSelectedMoveCategory('');
    setIsSaving(false);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    lastSavedDataRef.current = kaomoji.id
      ? JSON.stringify({ text: kaomoji.text, tags: kaomoji.tags })
      : '';
  }, [kaomoji]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const immediateSave = useCallback(
    async (dataToSave: KaomojiItem, showSuccessToast = false) => {
      if (!dataToSave.id) return;

      // 若資料沒變就跳過，避免打字過程中一直重複寫入同一筆資料。
      const dataString = JSON.stringify({ text: dataToSave.text, tags: dataToSave.tags });
      if (dataString === lastSavedDataRef.current) return;

      try {
        setIsSaving(true);
        await onSave(dataToSave);
        lastSavedDataRef.current = dataString;
        if (showSuccessToast) showToast('已儲存！', 'success');
      } catch {
        showToast('儲存失敗，請重試！', 'error');
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, showToast]
  );

  const requestNewTag = useCallback(
    async (rawTag: string): Promise<Tag | null> => {
      const zhName = rawTag.trim();
      if (!zhName) return null;

      if (typeof window === 'undefined') {
        showToast('目前環境無法建立新標籤。', 'error');
        return null;
      }

      let englishName = '';
      while (true) {
        // 新標籤是使用者建立的資料，寫入前先用互動對話框驗證。
        const input = window.prompt(`請為新標籤「${zhName}」輸入英文名稱`, englishName);
        if (input === null) return null;
        const trimmed = input.trim();
        if (!trimmed) {
          window.alert('英文名稱不可為空。');
          continue;
        }
        if (!isEnglish(trimmed)) {
          window.alert('英文名稱請使用英文或半形符號。');
          continue;
        }
        englishName = trimmed;
        break;
      }

      const defaultId = slugifyId(englishName || zhName);
      let finalId = '';

      while (true) {
        const input = window.prompt(
          '請輸入標籤 ID（僅限小寫英文、數字與連字號）',
          finalId || defaultId
        );
        if (input === null) return null;
        const candidate = slugifyId(input);
        if (!candidate) {
          window.alert('標籤 ID 不可為空。');
          continue;
        }
        if (combinedTags.some((tag) => tag.id === candidate)) {
          window.alert('標籤 ID 已存在，請重新輸入。');
          continue;
        }
        finalId = candidate;
        break;
      }

      const newTag: Tag = {
        id: finalId,
        name: {
          en: englishName,
          'zh-tw': zhName,
        },
      };

      setCustomTags((prev) => [...prev, newTag]);
      if (onTagCreated) await onTagCreated(newTag);
      showToast(`標籤「${zhName}」已加入本次更新`, 'success');
      return newTag;
    },
    [combinedTags, onTagCreated, showToast]
  );

  // 新增標籤
  const addTags = useCallback(
    async (tagsToAdd: string | string[]) => {
      const inputs = Array.isArray(tagsToAdd) ? tagsToAdd : [tagsToAdd];
      const existingNormalized = new Set(formData.tags.map((tag) => normalizeTag(tag)));
      const processedInputs = new Set<string>();
      const tagsToAppend: string[] = [];

      for (const raw of inputs) {
        const parts = raw.split(/[,;、\s]+/);
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;

          const normalizedInput = normalizeTag(trimmed);
          if (!normalizedInput || processedInputs.has(normalizedInput)) continue;
          processedInputs.add(normalizedInput);

          const existingId = tagLookup.get(normalizedInput);
          if (existingId) {
            const normalizedId = normalizeTag(existingId);
            if (!existingNormalized.has(normalizedId)) {
              existingNormalized.add(normalizedId);
              tagsToAppend.push(existingId);
            }
            continue;
          }

          // 無法辨識的輸入視為「要求建立新標籤」，不會當成暫時性的自由文字標籤。
          const createdTag = await requestNewTag(trimmed);
          if (!createdTag) continue;

          const normalizedId = normalizeTag(createdTag.id);
          if (!existingNormalized.has(normalizedId)) {
            existingNormalized.add(normalizedId);
            tagsToAppend.push(createdTag.id);
          }
        }
      }

      if (tagsToAppend.length > 0) {
        const updatedFormData = {
          ...formData,
          tags: [...formData.tags, ...tagsToAppend].sort(),
        };
        setFormData(updatedFormData);
        setNewTag('');

        if (updatedFormData.id) await immediateSave(updatedFormData);
      }
    },
    [formData, immediateSave, normalizeTag, requestNewTag, tagLookup]
  );

  // 移除標籤
  const removeTag = useCallback(
    async (tagToRemove: string) => {
      const updatedFormData = {
        ...formData,
        tags: formData.tags.filter((t) => t !== tagToRemove),
      };
      setFormData(updatedFormData);

      if (updatedFormData.id) await immediateSave(updatedFormData);
    },
    [formData, immediateSave]
  );

  // 強制儲存
  const forceSave = useCallback(async () => {
    const currentDataString = JSON.stringify({ text: formData.text, tags: formData.tags });
    const hasChanges = currentDataString !== lastSavedDataRef.current && !isSaving;

    if (!formData.id || !hasChanges) return;

    try {
      setIsSaving(true);
      await onSave(formData);
      lastSavedDataRef.current = currentDataString;
    } catch {
      showToast('儲存失敗！', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSave, showToast, isSaving]);

  const hasUnsavedChanges = useMemo(() => {
    if (!kaomoji.id) return false;
    const currentDataString = JSON.stringify({ text: formData.text, tags: formData.tags });
    return currentDataString !== lastSavedDataRef.current && !isSaving;
  }, [formData.text, formData.tags, kaomoji.id, isSaving]);

  const handleMove = useCallback(
    async (targetCategory?: string) => {
      const moveCategory = targetCategory || selectedMoveCategory;

      if (!moveCategory) {
        showToast('請選擇一個目標分類！', 'error');
        return;
      }

      if (moveCategory === currCategory) {
        showToast('不能移動到相同分類！', 'error');
        return;
      }

      const currDataString = JSON.stringify({ text: formData.text, tags: formData.tags });
      const hasChanges = currDataString !== lastSavedDataRef.current && !isSaving;

      if (hasChanges) {
        try {
          await forceSave();
        } catch {
          showToast('儲存變更失敗，無法移動！', 'error');
          return;
        }
      }

      onMove(moveCategory, formData);
      setSelectedMoveCategory('');
    },
    [currCategory, formData, onMove, selectedMoveCategory, showToast, forceSave, isSaving]
  );

  const handleTextChange = useCallback(
    (newText: string) => {
      const updatedFormData = { ...formData, text: newText };
      setFormData(updatedFormData);

      if (updatedFormData.id) immediateSave(updatedFormData);
    },
    [formData, immediateSave]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.id && formData.text.trim()) onSave(formData);
    },
    [formData, onSave]
  );

  return {
    formData,
    newTag,
    setNewTag,
    selectedMoveCategory,
    setSelectedMoveCategory,
    isSaving,
    hasUnsavedChanges,
    addTags,
    removeTag,
    handleSubmit,
    handleTextChange,
    forceSave,
    immediateSave,
    handleMove,
    availableTagOptions: combinedTags,
  };
};
