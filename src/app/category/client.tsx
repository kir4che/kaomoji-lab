'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

import { useLanguage } from '@/contexts/LanguageContext';
import { normalize } from '@/utils/normalize';
import { sortList } from '@/utils/sortList';
import { t } from '@/lib/i18n';
import SortingDropdown from '@/components/molecules/SortingDropdown';
import type { CategorySummary } from '@/types/Kaomoji';

interface CategoryListPageProps {
  categories: CategorySummary[];
  totalKaomojis: number;
}

const CategoryListPage: React.FC<CategoryListPageProps> = ({ categories, totalKaomojis }) => {
  const { lang } = useLanguage();

  const [sortBy, setSortBy] = useState<'name' | 'count'>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedCategories = useMemo(() => {
    if (sortBy === 'name')
      return sortList(categories, 'name', sortOrder, (item) =>
        normalize(item.name[lang] || item.name.en || t('unnamedCategory', lang))
      );
    if (sortBy === 'count') return sortList(categories, 'itemCount', sortOrder);
    return categories;
  }, [categories, sortBy, sortOrder, lang]);

  return (
    <div className="flex-1 flex flex-col">
      <section className="mb-2 xs:mb-0 space-y-4 text-center">
        <h1>{t('categoryListTitle', lang)}</h1>
        <p className="text-sm text-gray-500">
          {t('categoryListDescription', lang, {
            categoryCount: categories.length,
            kaomojiCount: totalKaomojis,
          })}
        </p>
      </section>
      <SortingDropdown
        sortBy={sortBy}
        sortOrder={sortOrder}
        options={[
          { value: 'count', label: t('sortByCount', lang) },
          { value: 'name', label: t('sortByName', lang) },
        ]}
        onSortByChange={(val: string) => setSortBy(val as 'name' | 'count')}
        onSortOrderChange={setSortOrder}
        className="ml-auto"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 py-2 md:pt-4 pb-8">
        {sortedCategories.map(({ id, preview, name, itemCount }) => (
          <Link
            key={id}
            href={`/category/${id}`}
            className="relative p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 group hover:shadow-primary-800/15"
          >
            <p className="mb-3 text-xl text-nowrap group-hover:scale-110 transition-transform text-center">
              {preview}
            </p>
            <h3 className="text-xl font-semibold capitalize text-center">
              {name[lang] || name.en || t('unnamedCategory', lang)}
            </h3>
            <span className="absolute -top-2 -right-2 z-30 flex-center bg-primary-100 text-primary-700 size-9 rounded-full text-base font-bold">
              {itemCount}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryListPage;
