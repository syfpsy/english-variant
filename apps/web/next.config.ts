import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@english-variant/shared", "@english-variant/content"],
  typedRoutes: true,
};

export default config;
