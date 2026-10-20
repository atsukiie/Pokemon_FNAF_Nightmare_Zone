import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep this app's build cache separate from the stale, locked .next directory.
  distDir: '.next-dashboard',
};

export default nextConfig;
