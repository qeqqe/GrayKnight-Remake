/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "*.spotifycdn.com",
      },
    ],
  },
  experimental: {
    typedRoutes: true,
    serverActions: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  skipTypeChecking: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
