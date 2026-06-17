import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow production builds to complete even with lint warnings.
    ignoreDuringBuilds: true,
  },
  // Keep server bundles lean for serverless deploys (Vercel).
  serverExternalPackages: ["xlsx"],
};

export default nextConfig;
