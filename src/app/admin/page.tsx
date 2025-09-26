'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

import type { CategoryData, IndexData } from '@/types/Kaomoji';
import { useToast } from '@/contexts/ToastContext';
import TabMenu from '@/components/admin/TabMenu';
import Loading from '@/components/atoms/Loading';

const KaomojiManager = dynamic(() => import('@/components/admin/KaomojiManager'), {
  loading: () => <Loading />,
});
const CategoryManager = dynamic(() => import('@/components/admin/CategoryManager'), {
  loading: () => <Loading />,
});
const TagManager = dynamic(() => import('@/components/admin/TagManager'), {
  loading: () => <Loading />,
});

const TABS = [
  { id: 'kaomoji', label: '顏文字管理' },
  { id: 'category', label: '分類管理' },
  { id: 'tag', label: '標籤管理' },
];

const AdminPage: React.FC = () => {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('kaomoji');

  const allKaomoji = categories.flatMap((c) => c.items);

  const loadData = useCallback(
    async (forceReload = false) => {
      if (!forceReload && categories.length > 0 && indexData) return;

      try {
        setIsLoading(true);

        const cacheBuster = Date.now().toString();

        const idxRes = await fetch(`/data/index.json?cb=${cacheBuster}`, {
          cache: 'no-store',
        });
        if (!idxRes.ok) throw new Error('無法載入索引資料！');
        const indexDataFromServer: IndexData = await idxRes.json();
        setIndexData(indexDataFromServer);

        const categoryData = await Promise.all(
          indexDataFromServer.categories.map(async (cat) => {
            const res = await fetch(`/data/categories/${cat.id}.json?cb=${cacheBuster}`, {
              cache: 'no-store',
            });
            if (!res.ok) throw new Error(`無法載入分類：${cat.id}！`);
            return res.json() as Promise<CategoryData>;
          })
        );

        setCategories(categoryData);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '載入時發生未知錯誤！';
        showToast(errMsg, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, categories.length, indexData]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <Loading />;

  return (
    <div id="admin" className="container mx-auto py-4">
      <h1 className="mb-8 text-center">管理後台</h1>
      {indexData && (
        <div className="max-w-6xl mx-auto space-y-4">
          <TabMenu tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === 'kaomoji' && (
            <KaomojiManager
              categories={categories}
              indexData={indexData}
              onDataChange={setCategories}
              onRefreshIndexData={() => loadData(true)}
            />
          )}
          {activeTab === 'category' && (
            <CategoryManager categories={categories} onDataChange={setCategories} />
          )}
          {activeTab === 'tag' && (
            <TagManager allKaomoji={allKaomoji} onDataChange={() => loadData(true)} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
