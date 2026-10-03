import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "typeorm",
    "pg",
    "openai",
    "@langchain/core",
    "@langchain/langgraph",
    "@langchain/langgraph-checkpoint",
    "@langchain/langgraph-checkpoint-postgres",
    "@langchain/langgraph-sdk",
    "@langchain/openai",
    "@langchain/protocol",
  ],
};

export default nextConfig;
