// Portfolio build of the DarkSentinel UI: a static export served from
// /apps/darksentinel/ inside dhruvOS. API routes are gone (see lib/api.ts).
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/apps/darksentinel",
  assetPrefix: "/apps/darksentinel",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
