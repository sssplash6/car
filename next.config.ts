import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // PLACEHOLDER IMAGE SOURCE. Every image on the site is currently a seeded
    // picsum photo standing in for real editorial photography. When the real
    // assets arrive, drop this remotePattern and serve them from /public or a
    // proper CDN — leaving it in production means the homepage depends on a
    // third-party placeholder service staying up.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
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

      // Next rejects a server action whose Origin does not match Host /
      // X-Forwarded-Host, which is a CSRF guard. Demoing the dev server through
      // a tunnel (cloudflared, ngrok) trips it: the browser sends the tunnel
      // origin while the proxy may rewrite Host to localhost, so sign-in and
      // submit silently fail.
      //
      // Read from the environment and ONLY outside production, so a tunnel host
      // can never widen the CSRF guard on the real deployment. Set it to the
      // tunnel hostname without the scheme, e.g.
      //   DEMO_TUNNEL_ORIGINS="hello-world.trycloudflare.com"
      ...(process.env.NODE_ENV !== "production" && process.env.DEMO_TUNNEL_ORIGINS
        ? {
            allowedOrigins: process.env.DEMO_TUNNEL_ORIGINS.split(",")
              .map((origin) => origin.trim())
              .filter(Boolean),
          }
        : {}),
    },
  },
};

export default nextConfig;
