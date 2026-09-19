/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/apps/crisiswatch",
  assetPrefix: "/apps/crisiswatch/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
