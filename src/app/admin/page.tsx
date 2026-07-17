'use client';

import dynamic from 'next/dynamic';

import { useAdminData } from '@/hooks/useAdminData';
import { useCheckedKaomoji } from '@/hooks/useCheckedKaomoji';
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
    tags,
    setTags,
    indexData,
    activeTab,
    setActiveTab,
    allKaomoji,
    handleBulkDelete,
    handleSmartDuplicateCleanup,
    hasUnsavedChanges,
    dirtyCount,
    isSaving,
    saveSession,
    markDirty,
  } = useAdminData();
  const { checkedKaomojiIds, toggleKaomojiChecked, updateCheckedIdsWithMapping } =
    useCheckedKaomoji({ onChange: markDirty });

  if (isLoading) return <Loading />;

  const draftIndexData = indexData ? { ...indexData, tags } : null;

  return (
    <div id="admin" className="w-full mx-auto py-4">
      <h1 className="mb-8 text-center">管理後台</h1>
      {draftIndexData && (
        <div className="max-w-6xl w-full min-w-0 mx-auto space-y-4">
          <TabMenu
            tabs={TABS}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            hasUnsavedChanges={hasUnsavedChanges}
            dirtyCount={dirtyCount}
            isSaving={isSaving}
            onSave={() => saveSession(Array.from(checkedKaomojiIds))}
          />
          {activeTab === 'kaomoji' && (
            <KaomojiManager
              categories={categories}
              indexData={draftIndexData}
              onDataChange={setCategories}
              onTagsChange={setTags}
              checkedKaomojiIds={checkedKaomojiIds}
              onToggleKaomojiChecked={toggleKaomojiChecked}
              onUpdateCheckedIdsWithMapping={updateCheckedIdsWithMapping}
            />
          )}
          {activeTab === 'category' && (
            <CategoryManager categories={categories} onDataChange={setCategories} />
          )}
          {activeTab === 'tag' && (
            <TagManager
              categories={categories}
              allKaomoji={allKaomoji}
              tags={tags}
              onTagsChange={setTags}
              onCategoriesChange={setCategories}
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
