import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  //  FIX #1: Prevent jsdom / html-encoding-sniffer / @exodus/bytes from being
  // bundled by Turbopack. These are ESM-only packages pulled in transitively by
  // mammoth, pdf-parse, etc. Marking them external makes Node load them natively
  // instead of letting Turbopack try to require() them, which breaks with ERR_REQUIRE_ESM.
  serverExternalPackages: [
    'jsdom',
    'canvas',
    'mammoth',
    'pdf-parse',
    'pdf-extraction',
    'tesseract.js',
    'puppeteer',
    'sharp',
    'natural',
    'nspell',
  ],

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