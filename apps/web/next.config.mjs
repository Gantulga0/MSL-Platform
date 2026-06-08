/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@msl/types'],
  typedRoutes: true,
};

export default nextConfig;
