import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_TC, Noto_Color_Emoji } from 'next/font/google';
import Script from 'next/script';

import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Header from '@/components/organisms/Header';
import ExploreMoreSection from '@/components/organisms/ExploreMoreSection';
import Footer from '@/components/organisms/Footer';
import ScrollToTopBtn from '@/components/atoms/ScrollToTopBtn';

import './globals.css';

const notoSans = Noto_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const notoSansTC = Noto_Sans_TC({
  variable: '--font-sans-tc',
  subsets: ['latin'],
  display: 'swap',
});

const notoColorEmoji = Noto_Color_Emoji({
  variable: '--font-emoji',
  subsets: ['emoji'],
  weight: '400',
});

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kaomojilab.vercel.app/');

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: '顏文字實驗室 *｡٩(ˊᗜˋ*)و✦\*｡',
  description:
    '收藏超過 6000+ 可愛顏文字，支援一鍵複製，按分類和標籤瀏覽，快來找你最喜歡的顏文字 (｡◕‿◕｡)',
  authors: [{ name: '顏文字實驗室', url: siteUrl }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#FA70A4',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: '顏文字實驗室 *｡٩(ˊᗜˋ*)و✦\*｡',
    description: '收藏超過 6000+ 可愛顏文字，一鍵複製，快來找你最喜歡的 (｡◕‿◕｡)',
    url: '/',
    siteName: '顏文字實驗室',
    images: '/images/og-image.png',
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '顏文字實驗室 *｡٩(ˊᗜˋ*)و✦\*｡',
    description: '收藏超過 6000+ 可愛顏文字，一鍵複製，快來找你最喜歡的 (｡◕‿◕｡)',
    images: '/images/og-image.png',
  },
  robots: 'index, follow',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const fontClasses = [notoSans.variable, notoSansTC.variable, notoColorEmoji.variable].join(' ');

  return (
    <html lang="zh-tw" className="scroll-smooth">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9209549258046593"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${fontClasses} relative antialiased flex flex-col min-h-screen no-select`}>
        <LanguageProvider>
          <ToastProvider>
            <Header />
            <main className="flex flex-col flex-1 container mx-auto px-4 pt-6">{children}</main>
            <ExploreMoreSection />
            <Footer />
            <ScrollToTopBtn />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
