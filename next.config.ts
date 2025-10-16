import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule: { test: { test: (arg0: string) => any } }) => rule?.test?.test?.('.svg')
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule?.issuer,
        resourceQuery: fileLoaderRule?.resourceQuery?.not
          ? { not: [...fileLoaderRule.resourceQuery.not, /url/] }
          : { not: /url/ },
        use: ['@svgr/webpack'],
      }
    );

    if (fileLoaderRule) fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },

  experimental: {
    optimizeCss: true,
  },
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
