import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    typedRoutes: false,
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  images: {
    qualities: [100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;