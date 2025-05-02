import type { NextConfig } from "next";
// Import Webpack types for configuration
import type { Configuration as WebpackConfiguration } from "webpack";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Keep this from the JS version
  // Configure headers for WebContainer compatibility
  async headers() {
    return [
      {
        // Apply headers to all routes (ensure source covers everything)
        source: '/:path*',
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
  // Add the webpack configuration block
  webpack: (config: WebpackConfiguration, { isServer }) => {
    // Fixes npm packages that depend on Node.js modules
    if (!isServer) {
      // Resolve fallbacks for Node.js built-ins used by web-tree-sitter
      config.resolve = config.resolve || {}; // Ensure resolve object exists
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        module: false, // Provide a fallback for the 'module' package
        fs: false,     // Provide a fallback for 'fs' if needed by other deps
        path: require.resolve('path-browserify'), // Use browser-friendly path
      };
    }

    // Optional: Rule to handle .wasm files if needed
    // config.module = config.module || { rules: [] }; // Ensure module and rules exist
    // config.module.rules.push({
    //   test: /\.wasm$/,
    //   type: "asset/resource",
    // });

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
