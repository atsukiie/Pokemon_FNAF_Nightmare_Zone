import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep local builds separate from a stale, locked .next directory. Vercel's
  // Next.js builder expects its standard output directory in production.
  distDir: process.env.VERCEL ? '.next' : '.next-dashboard',
};

export default nextConfig;
