'use client';

import { useState } from 'react';
import Link from 'next/link';

import type { CategoryData } from '@/types/Kaomoji';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { t } from '@/lib/i18n';
import Input from '@/components/atoms/Input';
import KaomojiList from '@/components/molecules/KaomojiList';

interface CategoryPageClientProps {
  categoryData: CategoryData;
}

const CategoryPageClient: React.FC<CategoryPageClientProps> = ({ categoryData }) => {
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredKaomojis = useFilteredKaomoji({
    sourceKaomojis: categoryData?.items || [],
    searchTerm,
  });

  const categoryName = categoryData.name[lang] || categoryData.name.en || categoryData.id;

  return (
    <div className="flex-1 flex flex-col">
      <section className="mb-4 space-y-3 sm:space-y-4 text-center">
        <h1>{categoryName}</h1>
        <p className="text-sm text-gray-500">
          {t('kaomojiCountInCategory', lang, { count: categoryData.items.length })}
        </p>
      </section>
      <section className="w-full mx-auto xs:max-w-96" role="search">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchInputPlaceholderInCategory', lang)}
          aria-label={t('searchInputAriaLabelInCategory', lang)}
          focusEffect
        />
      </section>
      <section className="pt-6 pb-12">
        {filteredKaomojis.length > 0 ? (
          <KaomojiList kaomojis={filteredKaomojis} />
        ) : (
          <div className="flex-center flex-1">
            <p className="text-gray-500 text-lg">{t('noKaomojisFoundInCategory', lang)}</p>
          </div>
        )}
      </section>
      <section className="mt-auto text-center mb-8">
        <Link href="/category" className="inline-block back-btn">
          {t('backToCategories', lang)}
        </Link>
      </section>
    </div>
  );
};

export default CategoryPageClient;
