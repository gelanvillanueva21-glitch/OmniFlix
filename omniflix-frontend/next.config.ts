import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    agentUpgrade: "security",
  },
  allowedDevOrigins: ["192.168.1.7"],
  devIndicators: false,
    images: {
        unoptimized: true,
        remotePatterns: [
            { protocol: "https", hostname: "image.tmdb.org" },
            { protocol: "https", hostname: "cdn.myanimelist.net" },
            { protocol: "https", hostname: "images1.mangafreak.net" },
            { protocol: "http", hostname: "suwayomi" },
            { protocol: "http", hostname: "kavita" },
            { protocol: "http", hostname: "localhost" },
        ],
    },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
