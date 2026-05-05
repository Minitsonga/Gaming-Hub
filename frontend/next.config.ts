import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Limit Turbopack file watching to the frontend workspace.
    root: __dirname,
  },
};

export default nextConfig;
