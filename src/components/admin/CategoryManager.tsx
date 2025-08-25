'use client';

import { useState, useEffect, useCallback } from 'react';

import type { CategoryData } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import * as adminService from '@/services/adminService';
import { cn } from '@/utils/cn';
import CategoryModal, { type FormState, type ModalState } from '@/components/admin/CategoryModal';
import IconBtn from '@/components/atoms/IconBtn';
import EditCard from '@/components/admin/EditCard';
import PlusIcon from '@/assets/icons/plus.svg';

interface CategoryManagerProps {
  categories: CategoryData[];
  onDataChange: (updatedCategories: CategoryData[]) => void;
}

const EMPTY_FORM: FormState = {
  category: '',
  nameEn: '',
  nameZhTw: '',
  preview: '',
};

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories: initialCategories,
  onDataChange,
}) => {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetModal = () => {
    setModalState({ mode: 'closed' });
    setFormData(EMPTY_FORM);
  };

  const handleCreate = () => {
    setModalState({ mode: 'create' });
    setFormData(EMPTY_FORM);
  };

  const handleEdit = (category: CategoryData) => {
    setModalState({ mode: 'edit', category });
    setFormData({
      category: category.id,
      nameEn: category.name.en.toLowerCase(),
      nameZhTw: category.name['zh-tw'],
      preview: category.preview || '',
    });
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value.trim()])
      ) as FormState;

      const { category, nameEn, nameZhTw } = trimmed;
      if (!category || !nameEn || !nameZhTw) {
        showToast('請填寫所有必填欄位！', 'error');
        return;
      }

      if (modalState.mode === 'create' && categories.some((cat) => cat.id === category)) {
        showToast('該分類 ID 已存在！', 'error');
        return;
      }

      const isCreating = modalState.mode === 'create';
      const originalCategories = categories;

      const updatedCategories = isCreating
        ? [
            ...categories,
            {
              id: trimmed.category,
              name: { en: trimmed.nameEn.toLowerCase(), 'zh-tw': trimmed.nameZhTw },
              preview: trimmed.preview,
              items: [],
              lastUpdated: new Date().toISOString().split('T')[0],
            } as CategoryData,
          ].sort((a, b) => a.id.localeCompare(b.id))
        : categories.map((cat) =>
            cat.id === modalState.category?.id
              ? {
                  ...cat,
                  name: { en: trimmed.nameEn.toLowerCase(), 'zh-tw': trimmed.nameZhTw },
                  preview: trimmed.preview,
                  lastUpdated: new Date().toISOString().split('T')[0],
                }
              : cat
          );
      setCategories(updatedCategories);
      onDataChange(updatedCategories);

      try {
        const apiData = {
          category: trimmed.category,
          name: { en: trimmed.nameEn.toLowerCase(), 'zh-tw': trimmed.nameZhTw },
          preview: trimmed.preview,
        };

        if (isCreating) await adminService.createCategory(apiData);
        else {
          await adminService.updateCategoryInfo(modalState.category!.id, apiData);
        }

        resetModal();
        showToast(`分類${isCreating ? '創建' : '更新'}成功！`, 'success');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '操作失敗，請稍後再試。';
        showToast(errMsg, 'error');
        setCategories(originalCategories);
        onDataChange(originalCategories);
      }
    },
    [modalState, formData, categories, showToast, onDataChange]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const category = categories.find((cat) => cat.id === id);
      if (!category) return;

      if (category.items.length > 0) {
        showToast(
          `無法刪除「${category.name['zh-tw']}」分類，裡面還有 ${category.items.length} 個顏文字。`,
          'error'
        );
        return;
      }

      if (!confirm(`確定要刪除「${category.name['zh-tw']}」嗎？`)) return;

      const originalCategories = categories;
      const updatedCategories = categories.filter((cat) => cat.id !== id);

      setCategories(updatedCategories);
      onDataChange(updatedCategories);

      try {
        await adminService.deleteCategory(id);
        showToast('分類刪除成功！', 'success');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '刪除時發生未知錯誤！';
        showToast(errMsg, 'error');
        setCategories(originalCategories);
        onDataChange(originalCategories);
      }
    },
    [categories, showToast, onDataChange]
  );

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div
          className={cn('flex-between', {
            'mb-4': categories.length > 0,
          })}
        >
          <h3 className="text-lg font-semibold">分類列表 ({categories.length})</h3>
          <IconBtn icon={<PlusIcon />} onClick={handleCreate} label="分類" />
        </div>
        <div className="grid gap-3.5 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.length > 0 ? (
            categories.map((category) => (
              <EditCard
                key={category.id}
                type="category"
                title={category.name['zh-tw']}
                titleEn={category.name.en}
                count={category.items.length}
                lastUpdated={category.lastUpdated}
                handleEdit={() => handleEdit(category)}
                handleDelete={() => handleDelete(category.id)}
              />
            ))
          ) : (
            <p className="py-16 col-span-full text-center text-gray-500 text-lg">
              沒有符合搜尋的分類
            </p>
          )}
        </div>
      </div>
      <CategoryModal
        modalState={modalState}
        formData={formData}
        onFormChange={handleFormChange}
        onCancel={resetModal}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default CategoryManager;
