import type { NextConfig } from "next";

/** Unity WebGL Brotli : le navigateur doit recevoir Content-Encoding: br sur les .br */
function unityBrotliHeaders(contentType: string) {
  return [
    { key: "Content-Encoding", value: "br" },
    { key: "Content-Type", value: contentType },
  ];
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "https", hostname: "localhost", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
      { protocol: "https", hostname: "127.0.0.1", pathname: "/**" },
    ],
  },
  turbopack: {
    // Limit Turbopack file watching to the frontend workspace.
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/games/:slug/Build/:name.framework.js.br",
        headers: unityBrotliHeaders("application/javascript; charset=utf-8"),
      },
      {
        source: "/games/:slug/Build/:name.wasm.br",
        headers: unityBrotliHeaders("application/wasm"),
      },
      {
        source: "/games/:slug/Build/:name.data.br",
        headers: unityBrotliHeaders("application/octet-stream"),
      },
    ];
  },
};

export default nextConfig;
