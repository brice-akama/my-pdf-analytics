import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  //  FIX: Prevents jsdom / html-encoding-sniffer from being bundled.
  // The chain is: signup → emailService → ./email → (nodemailer or similar)
  // → html-encoding-sniffer → @exodus/bytes (ESM-only) → ERR_REQUIRE_ESM crash.
  // Marking these external makes Node load them natively.
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
    'nodemailer',
    'node-html-parser',
  ],

  experimental: {
    // ✅ Same list for Next 13/14 compatibility — harmless in 15/16
    serverComponentsExternalPackages: [
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
      'nodemailer',
      'node-html-parser',
    ],
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
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "media.licdn.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;