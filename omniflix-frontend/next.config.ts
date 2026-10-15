import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  allowedDevOrigins: ["192.168.1.7"],
  devIndicators: false,
  images: {
    // Temporary: allows the mock placeholder images on /explore to load.
    // Remove once real cover art is served from the app or an integrated API.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
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
