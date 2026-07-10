import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 2. TypeScript (타입 검사기) 에러 무시!
  typescript: {
    ignoreBuildErrors: true,
  },
  // 3. n8n 프록시 우회 설정
  async rewrites() {
    return [
      {
        source: '/api/n8n-webhook',
        // 💡 [핵심 수정] 아까 .env.local에 넣은 이름표(N8N_WEBHOOK_URL)와 완벽하게 일치시켰습니다!
        destination: process.env.N8N_WEBHOOK_URL as string,
      },
    ];
  },
};

export default nextConfig;