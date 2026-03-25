import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleTagManager } from '@next/third-parties/google'; 
import Script from 'next/script'; 

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL('https://www.ssagesage.com'), 
  title: {
    default: "싸게사게 🦀 | 실시간 핫딜 모음 & 핫딜온도계",
    template: "%s | 싸게사게 🦀" // 다른 페이지들 제목 뒤에 자동으로 붙게 설정
  },
  description: "뽐뿌, 에펨코리아 등 커뮤니티 핫딜을 실시간으로 모아보고, 100g당 단가 분석으로 진짜 최저가를 찾아드립니다.",
  
  keywords: ["핫딜", "최저가", "뽐뿌", "에펨코리아", "핫딜온도계", "생필품 시세", "싸게사게", "핫딜모음"],

  icons: {
    icon: "/favicon.ico",
  },

  // ✅ 1. 구글과 네이버 인증 통합
  verification: {
    naver: "4e8e9141f9ec9d45577433029e1c20c21d56fd0f",
    google: "AlYaCKTyHzy8ufh7Fp9WB1vUw53b-SzuLTPxuulrKnE", // 👈 Google Search Console에서 받은 코드
  },

  // ✅ 2. 네이버가 좋아하는 표준 주소 설정 (중복 방지)
  alternates: {
    canonical: 'https://www.ssagesage.com',
  },

  openGraph: {
    title: "싸게사게 🦀 | 핫딜 모음 & 역대가 분석",
    description: "지금 이 가격이 진짜 싼 걸까? 핫딜온도계로 확인하세요.",
    url: "https://www.ssagesage.com",
    siteName: "싸게사게",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },

  // ✅ 3. 로봇 설정 추가
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7220782481108319"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <GoogleTagManager gtmId="GTM-KBHSXJ3T" />
      </body>
    </html>
  );
}