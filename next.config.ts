import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root. Without this Next walks up looking for a lockfile
    // and finds a stray one in the home directory, then traces that entire tree
    // into the build — which is what produced the "whole project was traced
    // unintentionally" warning. DO NOT remove unless that lockfile is gone.
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // Server action bodies are capped at 1 MB by default, which rejects almost
      // every real paper. Must stay >= MAX_UPLOAD_BYTES in src/lib/storage.ts —
      // the headroom covers the multipart encoding overhead around the file, so
      // a file exactly at the 10 MB limit still fits inside the request.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
