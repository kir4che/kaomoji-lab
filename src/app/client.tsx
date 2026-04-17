'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Input from '@/components/atoms/Input';
import KaomojiList from '@/components/molecules/KaomojiList';
import Hexo from '@/components/organisms/Hexo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { t } from '@/lib/i18n';
import type { CategorySummary, KaomojiItem } from '@/types/Kaomoji';

interface HomeClientProps {
  categories: CategorySummary[];
  allKaomojis: KaomojiItem[];
}

const Home = ({ categories, allKaomojis: initialAllKaomojis }: HomeClientProps) => {
  const { lang } = useLanguage();
  const { copiedId, copyToClipboard } = useCopyToClipboard();

  const [allKaomojis, _setAllKaomojis] = useState<KaomojiItem[]>(initialAllKaomojis);
  const [randomKaomojis, setRandomKaomojis] = useState<KaomojiItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const shuffled = [...initialAllKaomojis].sort(() => Math.random() - 0.5);
    setRandomKaomojis(shuffled.slice(0, 80));
  }, [initialAllKaomojis]);

  const handleRefresh = () => {
    const shuffled = [...initialAllKaomojis].sort(() => Math.random() - 0.5);
    setRandomKaomojis(shuffled.slice(0, 85));
  };

  const filteredInput = searchTerm ? allKaomojis : randomKaomojis;
  const filteredKaomojis = useFilteredKaomoji({ sourceKaomojis: filteredInput, searchTerm });

  return (
    <>
      <Hexo totalKaomojis={allKaomojis.length} />
      <div className="w-full max-w-96 mx-auto my-6 flex items-center gap-2" role="search">
        <button
          onClick={() => !searchTerm && handleRefresh()}
          disabled={!!searchTerm}
          className="size-8 rounded-full bg-primary-400 text-white font-medium hover:bg-primary-500 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh random kaomojis"
        >
          ↻
        </button>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchInputPlaceholder', lang)}
          aria-label={t('searchInputAriaLabel', lang)}
          focusEffect
        />
      </div>
      {filteredKaomojis.length > 0 ? (
        <KaomojiList
          kaomojis={filteredKaomojis}
          onKaomojiCopy={copyToClipboard}
          copiedId={copiedId}
          itemClassName="md:text-base"
          aria-live="polite"
          aria-label={
            searchTerm
              ? t('searchResultsAriaLabel', lang, { count: filteredKaomojis.length })
              : t('recommendedKaomojis', lang)
          }
        />
      ) : (
        <p className="text-gray-500 text-lg text-center py-8">
          {searchTerm
            ? t('noKaomojisFoundWithTerm', lang, { term: searchTerm })
            : t('noKaomojisFound', lang)}
        </p>
      )}
      <section className="py-8 text-center space-y-6">
        <h2>{t('exploreByCategory', lang)}</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category: CategorySummary) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="w-[calc(32%-6px)] sm:w-[calc(24%-6px)] md:w-[calc(16%-6px)] lg:w-[calc(12%-6px)] rounded-xl bg-white p-2 text-center shadow shadow-primary-800/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              aria-label={t('categoryAriaLabel', lang, {
                categoryName: category.name[lang],
                count: category.itemCount,
              })}
            >
              <h3 className="text-base font-semibold capitalize text-gray-800">
                {category.name[lang]}
              </h3>
              <p className="text-xs text-gray-500">
                {t('kaomojisCount', lang, { count: category.itemCount })}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
