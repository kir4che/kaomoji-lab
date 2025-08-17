import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { useToast } from '@/contexts/ToastContext';
import type { KaomojiItem } from '@/types/Kaomoji';

interface UseKaomojiFormParams {
  kaomoji: KaomojiItem;
  currCategory: string;
  onSave: (kaomoji: KaomojiItem) => Promise<void>;
  onMove: (toCategory: string, updatedData?: KaomojiItem) => void;
}

export function useKaomojiForm({ kaomoji, currCategory, onSave, onMove }: UseKaomojiFormParams) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<KaomojiItem>(kaomoji);
  const [newTag, setNewTag] = useState('');
  const [selectedMoveCategory, setSelectedMoveCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  // 新增標籤
  const addTags = useCallback(
    async (tagsToAdd: string | string[]) => {
      const tags = Array.isArray(tagsToAdd) ? tagsToAdd : [tagsToAdd];
      const newTags = tags
        .flatMap((tag) => tag.split(/[,;、\s]+/))
        .map((tag) => tag.trim())
        .filter((tag) => tag && !formData.tags.includes(tag));

      if (newTags.length > 0) {
        const updatedFormData = { ...formData, tags: [...formData.tags, ...newTags].sort() };
        setFormData(updatedFormData);
        setNewTag('');

        if (updatedFormData.id) await immediateSave(updatedFormData);
      }
    },
    [formData, immediateSave]
  );

  // 移除標籤
  const removeTag = useCallback(
    async (tagToRemove: string) => {
      const updatedFormData = {
        ...formData,
        tags: formData.tags.filter((t) => t !== tagToRemove),
      };
      setFormData(updatedFormData);

      if (updatedFormData.id) {
        await immediateSave(updatedFormData);
      }
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
  };
}
