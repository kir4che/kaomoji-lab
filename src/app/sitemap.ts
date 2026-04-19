import type { MetadataRoute } from 'next';

import { readIndexFile } from '@/services/dataService';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaomojilab.vercel.app';
const normalizedSiteUrl = siteUrl.replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const indexData = await readIndexFile();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${normalizedSiteUrl}/`,
    },
    {
      url: `${normalizedSiteUrl}/category`,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = indexData.categories.map((category) => ({
    url: `${normalizedSiteUrl}/category/${category.id}`,
    lastModified: category.lastUpdated,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
