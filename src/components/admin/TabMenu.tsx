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
}

const TabMenu: React.FC<TabMenuProps> = ({ tabs, activeTab, setActiveTab }) => (
  <div className="mb-4 border-b border-gray-200 bg-white rounded-t-lg px-6">
    <nav className="-mb-px flex space-x-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeTab}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm',
            tab.id === activeTab
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  </div>
);

export default memo(TabMenu);
