import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["typeorm", "pg", "openai"],
  // Poll so file changes on the bind-mounted host directory reload inside Docker.
  watchOptions: {
    pollIntervalMs: 1000,
  },
};

export default nextConfig;
