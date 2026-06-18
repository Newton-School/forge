import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone server output for the production Docker image (see docker/client.Dockerfile).
  output: "standalone",
  // Pin the workspace root to this app so Turbopack ignores any stray lockfile
  // higher up the tree (e.g. ~/package-lock.json) — silences the "inferred
  // workspace root" warning.
  turbopack: {
    root: __dirname,
  },
  /**
   * Same-origin API proxy. In production the backend (Render) is a different domain, so
   * proxying `/api/*` through the client makes the session cookie first-party — which is
   * what lets the server components read it and enforce the auth gate. Set
   * `API_PROXY_TARGET` to the backend origin (dev: http://localhost:4000). When unset
   * (pure presentation/mock), no rewrite is added.
   */
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    return target ? [{ source: "/api/:path*", destination: `${target}/api/:path*` }] : [];
  },
};

export default nextConfig;
