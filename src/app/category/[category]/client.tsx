'use client';

import { useState } from 'react';
import Link from 'next/link';

import type { CategoryData } from '@/types/Kaomoji';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKaomoji } from '@/hooks/useKaomoji';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import Input from '@/components/atoms/Input';
import KaomojiList from '@/components/molecules/KaomojiList';

interface CategoryPageClientProps {
  categoryData: CategoryData;
}

const CategoryPageClient: React.FC<CategoryPageClientProps> = ({ categoryData }) => {
  const { lang } = useLanguage();
  const { getCategoryName } = useKaomoji(lang);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredKaomojis = useFilteredKaomoji({
    sourceKaomojis: categoryData?.items || [],
    searchTerm,
  });

  return (
    <div className="flex-1 flex flex-col">
      <section className="mb-4 space-y-3 sm:space-y-4 text-center">
        <h1>{getCategoryName(categoryData.id)}</h1>
        <p className="text-sm text-gray-500">共 {categoryData.items.length} 個顏文字</p>
      </section>
      <section className="w-full mx-auto xs:max-w-96" role="search">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="請輸入顏文字或標籤..."
          aria-label="搜尋顏文字或標籤"
          focusEffect
        />
      </section>
      <section className="pt-6 pb-12">
        {filteredKaomojis.length > 0 ? (
          <KaomojiList kaomojis={filteredKaomojis} />
        ) : (
          <div className="flex-center flex-1">
            <p className="text-gray-500 text-lg">在此分類中沒有符合條件的顏文字或標籤</p>
          </div>
        )}
      </section>
      <section className="mt-auto text-center mb-8">
        <Link href="/category" className="inline-block back-btn">
          返回分類
        </Link>
      </section>
    </div>
  );
};

export default CategoryPageClient;
