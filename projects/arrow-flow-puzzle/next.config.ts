import type { NextConfig } from "next";
import path from "path";

const isGHPages = process.env.GITHUB_PAGES === 'true';
const isCapacitor = process.env.CAPACITOR_BUILD === 'true';
const isStaticExport = isGHPages || isCapacitor;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isStaticExport ? 'export' : undefined,
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
