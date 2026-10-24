import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Hosted deployments use this app's API routes, regardless of local API settings.
  ...(process.env.VERCEL ? { env: { NEXT_PUBLIC_API_URL: '/api' } } : {}),
  // Keep local builds separate from a stale, locked .next directory. Vercel's
  // Next.js builder expects its standard output directory in production.
  distDir: process.env.VERCEL ? '.next' : '.next-dashboard',
};

export default nextConfig;
