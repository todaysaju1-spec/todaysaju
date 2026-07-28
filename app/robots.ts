import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin', // 관리자 페이지 검색 노출 완벽 차단
    },
    sitemap: 'https://todaysajupro.com/sitemap.xml',
  };
}