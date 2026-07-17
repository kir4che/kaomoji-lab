'use client';

import dynamic from 'next/dynamic';

import { useAdminData } from '@/hooks/useAdminData';
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
const DuplicateKaomojiManager = dynamic(
  () => import('@/components/admin/DuplicateKaomojiManager'),
  { loading: () => <Loading /> }
);

const TABS = [
  { id: 'kaomoji', label: '顏文字管理' },
  { id: 'category', label: '分類管理' },
  { id: 'tag', label: '標籤管理' },
  { id: 'duplicates', label: '重複排查' },
];

const AdminPage = () => {
  const {
    isLoading,
    categories,
    setCategories,
    indexData,
    activeTab,
    setActiveTab,
    allKaomoji,
    loadData,
    handleBulkDelete,
    handleSmartDuplicateCleanup,
  } = useAdminData();

  if (isLoading) return <Loading />;

  return (
    <div id="admin" className="w-full mx-auto py-4">
      <h1 className="mb-8 text-center">管理後台</h1>
      {indexData && (
        <div className="max-w-6xl w-full min-w-0 mx-auto space-y-4">
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
            <TagManager
              categories={categories}
              allKaomoji={allKaomoji}
              onDataChange={() => loadData(true)}
            />
          )}
          {activeTab === 'duplicates' && (
            <DuplicateKaomojiManager
              categories={categories}
              onBulkDelete={handleBulkDelete}
              onSmartCleanup={handleSmartDuplicateCleanup}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
