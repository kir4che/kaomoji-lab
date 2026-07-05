import type { Metadata, Viewport } from 'next';
import { Noto_Color_Emoji, Noto_Sans_TC } from 'next/font/google';
import Script from 'next/script';

import ScrollToTopBtn from '@/components/atoms/ScrollToTopBtn';
import ExploreMoreSection from '@/components/organisms/ExploreMoreSection';
import Footer from '@/components/organisms/Footer';
import Header from '@/components/organisms/Header';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { t } from '@/lib/i18n';
import type { Language } from '@/types/Language';
import { HtmlLangSync } from '@/components/atoms/HtmlLangSync';

import './globals.css';

const notoSansTC = Noto_Sans_TC({
  variable: '--font-sans-tc',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const notoColorEmoji = Noto_Color_Emoji({
  variable: '--font-emoji',
  subsets: ['emoji'],
  weight: '400',
  display: 'swap',
});

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kaomojilab.vercel.app/');
const ogImageUrl = new URL('/images/og-image.png', siteUrl).toString();

export async function generateMetadata(): Promise<Metadata> {
  const lang: Language = 'zh-tw';

  const keywords = t('metaKeywords', lang) || '';

  return {
    metadataBase: siteUrl,
    title: {
      default: t('metaDefaultTitle', lang),
      template: `%s - ${t('metaDefaultTitle', lang)}`,
    },
    description: t('metaDescription', lang),
    keywords: keywords.split(','),
    creator: t('metaDefaultTitle', lang),
    authors: [{ name: t('metaDefaultTitle', lang) }],
    publisher: t('metaDefaultTitle', lang),
    robots: 'index, follow',
    icons: {
      icon: [{ url: '/favicon.png', type: 'image/png' }],
      apple: [{ url: '/icons/icon-192x192.png' }],
    },
    manifest: '/manifest.json',
    openGraph: {
      title: t('metaDefaultTitle', lang),
      description: t('metaOgDescription', lang),
      url: '/',
      siteName: t('metaDefaultTitle', lang),
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Kaomoji Lab',
        },
      ],
      locale: lang === 'zh-tw' ? 'zh_TW' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaDefaultTitle', lang),
      description: t('metaTwitterDescription', lang),
      images: [ogImageUrl],
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const fontClasses = [notoSansTC.variable, notoColorEmoji.variable].join(' ');
  const lang: Language = 'zh-tw';

  return (
    <html lang={lang} className="scroll-smooth">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9209549258046593"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${fontClasses} font-sans mx-auto lg:container relative antialiased flex flex-col min-h-screen [&:not(#admin)]:no-select`}
      >
        <LanguageProvider>
          <HtmlLangSync />
          <ToastProvider>
            <Header />
            <main className="flex flex-col flex-1 px-4 pt-6">{children}</main>
            <ExploreMoreSection />
            <Footer />
            <ScrollToTopBtn />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
