import type { Metadata } from 'next';

import TagPage from './client';

export const metadata: Metadata = {
  title: '標籤一覽',
  description: '探索所有顏文字標籤，發現各種風格的顏文字，讓您的訊息更生動有趣。',
  keywords: ['顏文字', '表情符號', '標籤', 'Kaomoji', 'Tags', 'Japanese Emoticons'],
  openGraph: {
    title: '顏文字標籤',
    description: '探索所有顏文字標籤，發現各種風格的顏文字。',
    type: 'website',
    url: '/tag',
  },
};

const TagPageContainer = () => {
  return <TagPage />;
};

export default TagPageContainer;
