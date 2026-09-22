import type { NextConfig } from "next";
import path from "path";

const isGHPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isGHPages ? 'export' : undefined,
  basePath: isGHPages ? '/Personal-Workspace' : '',
  assetPrefix: isGHPages ? '/Personal-Workspace/' : undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
