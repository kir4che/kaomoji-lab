import type { Metadata } from 'next';

import GeneratorPage from './client';

export const metadata: Metadata = {
  title: 'AI 顏文字產生器',
  description:
    '輸入你的靈感或心情，讓 AI 為你生成獨一無二的客製化顏文字！簡單、快速，立即複製使用。',
  keywords: [
    '顏文字',
    'AI產生器',
    '表情符號',
    'Kaomoji',
    '客製化表情',
    '客製化顏文字',
    'Japanese Emoticons',
  ],
  openGraph: {
    title: 'AI 顏文字產生器',
    description:
      '輸入你的靈感或心情，讓 AI 為你生成獨一無二的客製化顏文字！簡單、快速，立即複製使用。',
    type: 'website',
    url: '/generator',
  },
};

const GeneratorPageContainer = () => {
  return <GeneratorPage />;
};

export default GeneratorPageContainer;
