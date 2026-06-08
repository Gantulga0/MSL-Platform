/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@msl/types', '@msl/ui'],
  typedRoutes: true,
};

export default nextConfig;
