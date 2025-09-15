import { promises as fs } from 'fs';
import path from 'path';

import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { CategoryData } from '@/types/Kaomoji';

import CategoryPageClient from './client';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryData = await getCategoryData(category);
  const categoryName = categoryData.name['zh-tw'] || categoryData.name.en || category;
  const description = `探索「${categoryName}」分類下的所有顏文字！我們精心整理了 ${categoryData.items.length} 個獨特的「${categoryName}」顏文字，方便您複製貼上。`;
  const keywords = [
    categoryName,
    `${categoryName} 顏文字`,
    `${categoryName} Kaomoji`,
    '顏文字',
    '表情符號',
    '分類',
    'Kaomoji',
    'Categories',
    'Japanese Emoticons',
  ];

  return {
    title: `${categoryName}`,
    description,
    keywords,
    openGraph: {
      title: `${categoryName}`,
      description,
      type: 'website',
      url: `/category/${category}`,
    },
  };
}

const getCategoryData = cache(async (categoryId: string): Promise<CategoryData> => {
  const dataDirectory = path.join(process.cwd(), 'public/data/categories');
  const filePath = path.join(dataDirectory, `${categoryId}.json`);
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch {
    notFound();
  }
});

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { category } = await params;
  const categoryData = await getCategoryData(category);

  return <CategoryPageClient categoryData={categoryData} />;
};

export default CategoryPage;
