import type { NextConfig } from 'next';
import path from 'path';

// NEXT_PUBLIC_API_URL — set in .env or at build time for API base URL
const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
};

export default nextConfig;
