'use client';

import { FC, useState, useEffect } from 'react';

import type { Tag } from '@/types/Kaomoji';
import Modal from '@/components/molecules/Modal';
import Input from '@/components/atoms/Input';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: Tag) => void;
  tag: Tag | null;
}

const TagModal: FC<TagModalProps> = ({ isOpen, onClose, onSave, tag }) => {
  const [formData, setFormData] = useState<Tag>({ id: '', name: { en: '', 'zh-tw': '' } });

  useEffect(() => {
    if (tag) setFormData(tag);
    else setFormData({ id: '', name: { en: '', 'zh-tw': '' } });
  }, [tag, isOpen]);

  const handleChange = (field: keyof Tag['name'], value: string) => {
    setFormData((prev) => ({ ...prev, name: { ...prev.name, [field]: value } }));
  };

  const handleIdChange = (value: string) => {
    setFormData((prev) => ({ ...prev, id: value.toLowerCase().replace(/\s+/g, '-') }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name.en || !formData.name['zh-tw']) {
      alert('All fields are required.');
      return;
    }
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tag ? '編輯標籤' : '新增標籤'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">標籤 ID</label>
          <Input
            type="text"
            value={formData.id}
            onChange={(e) => handleIdChange(e.target.value)}
            disabled={!!tag}
            className="w-full rounded-md border border-gray-300 px-2.5 py-2 bg-gray-50 disabled:opacity-70"
            placeholder="如：new-tag-name"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">英文名稱</label>
          <Input
            type="text"
            value={formData.name.en}
            onChange={(e) => handleChange('en', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2.5 py-2"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">中文名稱</label>
          <Input
            type="text"
            value={formData.name['zh-tw']}
            onChange={(e) => handleChange('zh-tw', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2.5 py-2"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary-500 px-4 py-2 text-white hover:bg-primary-600"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TagModal;
