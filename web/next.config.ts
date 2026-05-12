import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/ai',
  trailingSlash: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4500/api/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
