import type { Metadata } from 'next';

import CategoryListPage from './client';

export const metadata: Metadata = {
  title: '分類一覽',
  description: '瀏覽所有顏文字分類，例如開心、悲傷、動物等，快速找到您想要的顏文字表情。',
  keywords: ['顏文字', '表情符號', '分類', 'Kaomoji', 'Categories', 'Japanese Emoticons'],
  openGraph: {
    title: '顏文字分類',
    description: '瀏覽所有顏文字分類，快速找到您想要的顏文字表情。',
    type: 'website',
    url: '/category',
  },
};

const CategoryPageContainer = () => {
  return <CategoryListPage />;
};

export default CategoryPageContainer;
