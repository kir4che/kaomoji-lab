import { NextResponse } from 'next/server';

import { readIndexFile } from '@/services/dataService';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kaomojilab.vercel.app';
const normalizedSiteUrl = siteUrl.replace(/\/$/, '');

const escapeXml = (unsafe: string): string =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function GET() {
  const indexData = await readIndexFile();

  const items = indexData.categories
    .slice()
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 30)
    .map((category) => {
      const title = category.name['zh-tw'] || category.name.en || category.id;
      const link = `${normalizedSiteUrl}/category/${category.id}`;
      const pubDate = new Date(`${category.lastUpdated}T00:00:00.000Z`).toUTCString();

      return `<item>
  <title>${escapeXml(title)}</title>
  <link>${escapeXml(link)}</link>
  <guid>${escapeXml(link)}</guid>
  <pubDate>${pubDate}</pubDate>
  <description>${escapeXml(`${title} 類別顏文字，共 ${String(category.itemCount)} 筆`)}</description>
</item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Kaomoji Lab</title>
  <link>${escapeXml(normalizedSiteUrl)}</link>
  <description>Kaomoji Lab 最新分類更新</description>
  <language>zh-tw</language>
  ${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
