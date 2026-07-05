'use client';

import { useMemo, useState, useDeferredValue } from 'react';

import KaomojiBtn from '@/components/atoms/KaomojiBtn';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { t } from '@/lib/i18n';
import { generatorKaomojis } from '@/data/generator-kaomojis';

const EMOTION_CHIPS = [
  { key: 'happy', icon: '😊' },
  { key: 'love', icon: '💕' },
  { key: 'cute', icon: '🐱' },
  { key: 'sad', icon: '😢' },
  { key: 'angry', icon: '😤' },
  { key: 'surprised', icon: '😲' },
  { key: 'shy', icon: '😳' },
  { key: 'tired', icon: '😴' },
  { key: 'thinking', icon: '🤔' },
  { key: 'cool', icon: '😎' },
  { key: 'food', icon: '🍔' },
  { key: 'greeting', icon: '👋' },
  { key: 'sparkly', icon: '✨' },
  { key: 'peeking', icon: '👀' },
  { key: 'praying', icon: '🙏' },
  { key: 'scared', icon: '😱' },
  { key: 'fighting', icon: '💪' },
  { key: 'guilty', icon: '😅' },
  { key: 'cat', icon: '🐈' },
  { key: 'dog', icon: '🐕' },
] as const;

const matchKaomojis = (query: string) => {
  if (!query.trim()) return [];
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return [];

  const scored = generatorKaomojis.map((item) => {
    let score = 0;
    const allKeywords = [...item.keywords['zh-tw'], ...item.keywords.en].map((k) =>
      k.toLowerCase()
    );

    for (const word of words) {
      for (const kw of allKeywords) if (kw.includes(word) || word.includes(kw)) score += 1;
    }

    return { item, score };
  });

  const matched = scored.filter((s) => s.score > 0);

  // 無匹配 → 隨機回傳，任何輸入都有東西。
  if (matched.length === 0) {
    const shuffled = [...scored].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8).map((s) => s.item);
  }

  return matched
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((s) => s.item);
};

const GeneratorPage = () => {
  const { lang } = useLanguage();
  const { copiedId, copyToClipboard } = useCopyToClipboard();

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => matchKaomojis(deferredQuery), [deferredQuery]);

  const handleChipClick = (emotionKey: string) => {
    setQuery(t(`emotionChip_${emotionKey}` as any, lang));
  };

  const handleClear = () => setQuery('');

  return (
    <div className="flex-1 flex flex-col px-4">
      <section className="mb-6 md:mb-8 text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-800">{t('generatorTitle', lang)}</h1>
        <p className="text-base text-gray-500 max-w-md mx-auto">{t('generatorSubtitle', lang)}</p>
      </section>
      <section className="mx-auto w-full max-w-screen-sm space-y-3">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('generatorFallbackPlaceholder', lang)}
            aria-label={t('generatorPromptLabel', lang)}
            className="w-full p-3.5 pl-4 pr-12 rounded-full bg-white border-2 border-gray-200 text-lg
                       focus:outline-none focus:border-primary-400 transition-all duration-300"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-600"
              aria-label={t('generatorClear', lang)}
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {EMOTION_CHIPS.map(({ key, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleChipClick(key)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm
                         bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-600
                         transition-colors duration-200"
            >
              <span>{icon}</span>
              <span>{t(`emotionChip_${key}` as any, lang)}</span>
            </button>
          ))}
        </div>
      </section>
      {results.length > 0 && (
        <section className="pt-8 pb-12 space-y-5">
          <h3 className="text-center text-xl font-semibold text-gray-700">
            {t('yourKaomojis', lang)}
          </h3>
          <div className="flex-center flex-wrap gap-3">
            {results.map((kaomoji, idx) => {
              const id = `g-${idx}`;
              return (
                <KaomojiBtn
                  key={id}
                  text={kaomoji.text}
                  onCopy={() => copyToClipboard(kaomoji.text, id)}
                  isCopied={copiedId === id}
                  className="text-lg"
                />
              );
            })}
          </div>
        </section>
      )}
      {!query.trim() && (
        <section className="pt-8 text-center">
          <p className="text-gray-400 text-sm">{t('generatorInitialHint', lang)}</p>
        </section>
      )}
    </div>
  );
};

export default GeneratorPage;
