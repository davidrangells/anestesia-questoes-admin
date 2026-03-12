import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {}, // deixa vazio (não liga turbo automaticamente)
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingIncludes: {
    "/api/admin/questions/import": [
      "./scripts/sync-questions-from-xlsx.mjs",
      "./node_modules/xlsx/**/*",
      "./node_modules/adler-32/**/*",
      "./node_modules/cfb/**/*",
      "./node_modules/codepage/**/*",
      "./node_modules/crc-32/**/*",
      "./node_modules/ssf/**/*",
      "./node_modules/wmf/**/*",
      "./node_modules/word/**/*",
    ],
  },
};

export default nextConfig;
