// Public media + option images are served by the API; proxy the browser-facing
// /api/v1/{media,options}/* paths to it so relative asset URLs (video blobs,
// option images) load from the web origin.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@msl/types', '@msl/ui'],
  typedRoutes: true,
  async rewrites() {
    const base = API_BASE_URL.replace(/\/$/, '');
    return [
      { source: '/api/v1/media/:path*', destination: `${base}/media/:path*` },
      { source: '/api/v1/options/:path*', destination: `${base}/options/:path*` },
    ];
  },
};

export default nextConfig;
