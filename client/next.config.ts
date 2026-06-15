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
};

export default nextConfig;
