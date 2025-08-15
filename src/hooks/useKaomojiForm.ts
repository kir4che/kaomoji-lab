'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { useToast } from '@/contexts/ToastContext';
import type { KaomojiItem, CategoryData } from '@/types/Kaomoji';

interface UseKaomojiFormParams {
  kaomoji: KaomojiItem;
  categories: CategoryData[];
  currCategory: string;
  onSave: (kaomoji: KaomojiItem) => void;
  onMove: (toCategory: string, updatedData?: KaomojiItem) => void;
}

export function useKaomojiForm({
  kaomoji,
  categories,
  currCategory,
  onSave,
  onMove,
}: UseKaomojiFormParams) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<KaomojiItem>(kaomoji);
  const [newTag, setNewTag] = useState('');
  const [selectedMoveCategory, setSelectedMoveCategory] = useState('');

  const isDirty = useMemo(() => {
    if (!kaomoji.id) return false;
    if (kaomoji.text !== formData.text) return true;
    if (kaomoji.tags.length !== formData.tags.length) return true;

    const originalTags = new Set(kaomoji.tags);
    for (const tag of formData.tags) {
      if (!originalTags.has(tag)) return true;
    }

    return false;
  }, [formData.text, formData.tags, kaomoji]);

  useEffect(() => {
    setFormData(kaomoji);
    setNewTag('');
    setSelectedMoveCategory('');
  }, [kaomoji]);

  const addTags = useCallback(
    (tagsToAdd: string | string[]) => {
      const tags = Array.isArray(tagsToAdd) ? tagsToAdd : [tagsToAdd];
      const newTags = tags
        .flatMap((tag) => tag.split(/[,，、\s]+/))
        .map((tag) => tag.trim())
        .filter((tag) => tag && !formData.tags.includes(tag));

      if (newTags.length > 0) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, ...newTags].sort() }));
        setNewTag('');
      }
    },
    [formData.tags]
  );

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.text.trim()) {
        showToast('請輸入顏文字！', 'error');
        return;
      }
      if (formData.tags.length === 0) {
        showToast('請至少選擇一個標籤！', 'error');
        return;
      }
      onSave(formData);
    },
    [formData, onSave, showToast]
  );

  const handleMove = useCallback(() => {
    if (!selectedMoveCategory) {
      showToast('請選擇要移動到的分類！', 'error');
      return;
    }
    if (selectedMoveCategory === currCategory) {
      showToast('不能移動到相同分類！', 'error');
      return;
    }

    const targetCategory = categories.find((c) => c.id === selectedMoveCategory);
    const targetName = targetCategory?.name['zh-tw'] || '目標分類';

    if (window.confirm(`確定要移動到「${targetName}」嗎？`)) {
      onMove(selectedMoveCategory, isDirty ? formData : undefined);
      if (isDirty) {
        showToast('已自動儲存變更！', 'success');
      }
    }
  }, [categories, currCategory, formData, isDirty, onMove, selectedMoveCategory, showToast]);

  return {
    formData,
    setFormData,
    newTag,
    setNewTag,
    selectedMoveCategory,
    setSelectedMoveCategory,
    addTags,
    removeTag,
    handleSubmit,
    handleMove,
  };
}
