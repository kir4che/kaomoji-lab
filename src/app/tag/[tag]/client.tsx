'use client';

import { useState } from 'react';
import Link from 'next/link';

import type { KaomojiItem } from '@/types/Kaomoji';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFilteredKaomoji } from '@/hooks/useFilteredKaomoji';
import { t } from '@/lib/i18n';
import Input from '@/components/atoms/Input';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import KaomojiList from '@/components/molecules/KaomojiList';

interface TagPageClientProps {
  kaomojis: KaomojiItem[];
  tagName: string;
}

const TagPageClient = ({ kaomojis, tagName }: TagPageClientProps) => {
  const { lang } = useLanguage();
  const { copiedId, copyToClipboard } = useCopyToClipboard();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredKaomojis = useFilteredKaomoji({
    sourceKaomojis: kaomojis,
    searchTerm,
  });

  return (
    <div className="flex-1 flex flex-col">
      <section className="mb-4 space-y-3 sm:space-y-4 text-center">
        <h1>{tagName}</h1>
        <p className="text-sm text-gray-500">
          {t('tagPageDescription', lang, { count: kaomojis.length })}
        </p>
      </section>
      <section className="w-full mx-auto xs:max-w-96" role="search">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchInputPlaceholderInCategory', lang)}
          aria-label={t('searchInputAriaLabelInCategory', lang)}
          className="text-sm"
        />
      </section>
      <section className="pt-6 pb-12">
        {filteredKaomojis.length > 0 ? (
          <KaomojiList
            kaomojis={filteredKaomojis}
            onKaomojiCopy={copyToClipboard}
            copiedId={copiedId}
          />
        ) : (
          <div className="flex-center flex-1">
            <p className="text-gray-500 text-lg">
              {t('noKaomojisFoundWithTerm', lang, { term: searchTerm })}
            </p>
          </div>
        )}
      </section>
      <section className="mt-auto text-center mb-8">
        <Link href="/tag" className="inline-block back-btn">
          {t('tagPageBackToAllTags', lang)}
        </Link>
      </section>
    </div>
  );
};

export default TagPageClient;
