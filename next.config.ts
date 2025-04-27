import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure headers for WebContainer compatibility
  async headers() {
    return [
      {
        source: '/:path*(.*)', // Apply headers to all routes
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
