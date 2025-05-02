import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Keep this from the JS version
  // Removed headers configuration for COEP/COOP
  // async headers() { ... },

  // Removed webpack configuration block for fallbacks
  // webpack: (config: WebpackConfiguration, { isServer }) => { ... },
};

export default nextConfig;
