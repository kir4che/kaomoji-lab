'use client';

import { memo } from 'react';

import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
}

interface TabMenuProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  hasUnsavedChanges: boolean;
  dirtyCount: number;
  isSaving: boolean;
  onSave: () => void;
}

const TabMenu = ({
  tabs,
  activeTab,
  setActiveTab,
  hasUnsavedChanges,
  dirtyCount,
  isSaving,
  onSave,
}: TabMenuProps) => (
  <div className="mb-4 border-b border-gray-200 bg-white rounded-t-lg px-4">
    <nav
      className="-mb-px flex flex-nowrap items-center gap-x-6 overflow-x-auto scrollbar-hide whitespace-nowrap min-w-0"
      role="tablist"
      aria-label="Admin sections"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeTab}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
            tab.id === activeTab
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          <span className="whitespace-nowrap">{tab.label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onSave}
        disabled={!hasUnsavedChanges || isSaving}
        className={cn(
          'ml-auto shrink-0 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
          hasUnsavedChanges
            ? 'border-primary-500 bg-primary-500 text-white hover:bg-primary-600'
            : 'border-gray-200 bg-gray-50 text-gray-400',
          isSaving && 'cursor-wait opacity-75'
        )}
      >
        {isSaving ? '儲存中...' : hasUnsavedChanges ? `儲存本次更新 (${dirtyCount})` : '已儲存'}
      </button>
    </nav>
  </div>
);

export default memo(TabMenu);
