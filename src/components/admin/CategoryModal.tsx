import type { CategoryData } from '@/types/Kaomoji';
import Modal from '@/components/molecules/Modal';
import Input from '@/components/atoms/Input';

export type FormState = {
  category: string;
  nameEn: string;
  nameZhTw: string;
  preview: string;
};

export type ModalState = {
  mode: 'create' | 'edit' | 'closed';
  category?: CategoryData;
};

interface CategoryModalProps {
  modalState: ModalState;
  formData: FormState;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CategoryModal = ({
  modalState,
  formData,
  onFormChange,
  onCancel,
  onSubmit,
}: CategoryModalProps) => {
  const isCreateMode = modalState.mode === 'create';
  const isOpen = modalState.mode !== 'closed';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={isCreateMode ? '新增分類' : '編輯分類'}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          title="分類 ID"
          name="category"
          value={formData.category}
          onChange={onFormChange}
          placeholder="如: happy, sad, excited..."
          required
          disabled={!isCreateMode}
          className="rounded-md"
          helperText="僅能使用小寫英文字母、底線，建立後無法修改。"
        />
        <Input
          title="代表顏文字"
          name="preview"
          value={formData.preview}
          onChange={onFormChange}
          className="rounded-md"
        />
        <div className="flex gap-4">
          <Input
            title="英文名稱"
            name="nameEn"
            value={formData.nameEn}
            onChange={onFormChange}
            required
            className="rounded-md"
          />
          <Input
            title="中文名稱"
            name="nameZhTw"
            value={formData.nameZhTw}
            onChange={onFormChange}
            required
            className="rounded-md"
          />
        </div>
        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md transition-colors bg-primary-500 text-white hover:bg-primary-600"
          >
            {isCreateMode ? '建立' : '更新'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryModal;
