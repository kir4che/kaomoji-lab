'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';

import type { CategoryData } from '@/types/Kaomoji';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useKaomoji } from '@/hooks/useKaomoji';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import Input from '@/components/atoms/Input';
import KaomojiBtn from '@/components/atoms/KaomojiBtn';
import Loading from '@/components/atoms/Loading';

const CategoryPage: React.FC = () => {
  const { category: categoryId } = useParams<{ category: string }>();
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const { getCategoryName, isLoading: kaomojiLoading } = useKaomoji(lang);
  const { copiedId, copyToClipboard } = useCopyToClipboard();

  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const filteredKaomojis = useFilteredKaomoji({
    sourceKaomojis: categoryData?.items || [],
    searchTerm,
  });

  useEffect(() => {
    if (!categoryId) return;

    setIsLoading(true);
    fetch(`/data/categories/${categoryId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('無法載入分類資料！');
        return res.json();
      })
      .then((data) => setCategoryData(data))
      .catch((err) => {
        const errMsg = err instanceof Error ? err.message : '載入時發生未知錯誤！';
        showToast(errMsg, 'error');
        notFound();
      })
      .finally(() => setIsLoading(false));
  }, [categoryId, showToast]);

  if (isLoading || kaomojiLoading) return <Loading />;
  if (!categoryData) return notFound();

  return (
    <div className="flex-1 flex flex-col">
      <section className="mb-4 space-y-3 sm:space-y-4 text-center">
        <h1>{getCategoryName(categoryData.id)}</h1>
        <p className="text-sm text-gray-500">共 {categoryData.items.length} 個顏文字</p>
      </section>
      <div className="w-full mx-auto xs:max-w-96" role="search">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="請輸入顏文字或標籤..."
          aria-label="搜尋顏文字或標籤"
          focusEffect
        />
      </div>
      {filteredKaomojis.length > 0 ? (
        <ul role="list" className="flex-center flex-wrap gap-2 md:gap-3 pt-6 pb-12">
          {filteredKaomojis.map((kaomoji) => (
            <li key={kaomoji.id}>
              <KaomojiBtn
                text={kaomoji.text}
                onCopy={() => copyToClipboard(kaomoji.text, kaomoji.id)}
                isCopied={copiedId === kaomoji.id}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-center flex-1">
          <p className="text-gray-500 text-lg">在此分類中沒有符合條件的顏文字或標籤</p>
        </div>
      )}
      <div className="mt-auto text-center mb-8">
        <Link href="/category" className="inline-block back-btn">
          返回分類
        </Link>
      </div>
    </div>
  );
};

export default CategoryPage;
