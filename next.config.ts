import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {}, // deixa vazio (não liga turbo automaticamente)
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingIncludes: {
    "/api/admin/questions/import": ["./scripts/sync-questions-from-xlsx.mjs"],
  },
};

export default nextConfig;
