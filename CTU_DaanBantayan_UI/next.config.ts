import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Optimize production build
  compress: true,
  poweredByHeader: false,
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
