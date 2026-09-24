import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: process.env.GITHUB_PAGES === 'true' ? 'export' : undefined,
  assetPrefix: basePath,
};

export default nextConfig;
