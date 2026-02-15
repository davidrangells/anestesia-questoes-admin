import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {}, // deixa vazio (não liga turbo automaticamente)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;