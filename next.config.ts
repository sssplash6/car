import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
