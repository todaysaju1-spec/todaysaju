import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 2. TypeScript (타입 검사기) 에러 무시!
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;