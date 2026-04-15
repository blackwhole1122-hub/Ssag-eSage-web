// src/app/robots.js
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/', // 수익 링크 변환 경로 등은 제외
    },
    sitemap: 'https://www.ssagesage.com/sitemap.xml',
  }
}