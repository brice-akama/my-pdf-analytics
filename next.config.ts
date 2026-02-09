import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // ✅ Add other image hosts you might use later
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // For GitHub OAuth (future)
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com', // For LinkedIn OAuth (future)
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
