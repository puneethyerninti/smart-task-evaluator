import type { NextConfig } from "next";

// Disabled globally to avoid Supabase source-map crashes in Turbopack dev server.
if (process.env.NODE_ENV !== "production") {
  process.env.NEXT_DISABLE_TURBOPACK = "1";
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
