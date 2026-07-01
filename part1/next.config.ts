import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Avoid stale persisted dev artifacts after moving projects across machines.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
