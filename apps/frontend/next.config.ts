import type { NextConfig } from 'next';
import path from 'path';

// NEXT_PUBLIC_API_URL — set in .env or at build time for API base URL
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.pollinations.ai', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
};

export default nextConfig;
