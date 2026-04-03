import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google'; 
import Script from 'next/script'; 

// 1. 폰트 설정
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// 2. 구글 & 네이버 SEO 메타데이터 (유저님 설정 완벽해요!)
export const metadata = {
  metadataBase: new URL('https://www.ssagesage.com'), 
  title: {
    default: "싸게사게 🦀 | 실시간 핫딜 모음 & 핫딜온도계",
    template: "%s | 싸게사게 🦀" 
  },
  description: "뽐뿌, 에펨코리아 등 커뮤니티 핫딜을 실시간으로 모아보고, 100g당 단가 분석으로 진짜 최저가를 찾아드립니다.",
  keywords: ["핫딜", "최저가", "뽐뿌", "에펨코리아", "핫딜온도계", "생필품 시세", "싸게사게", "핫딜모음"],
  icons: { icon: "/favicon.ico" },
  verification: {
    google: "AlYaCKTyHzy8ufh7Fp9WB1vUw53b-SzuLTPxuulrKnE",
    other: {
      "naver-site-verification": "4e8e9141f9ec9d45577433029e1c20c21d56fd0f",
    },
  },
  alternates: { canonical: 'https://www.ssagesage.com' },
  openGraph: {
    title: "싸게사게 🦀 | 핫딜 모음 & 역대가 분석",
    description: "지금 이 가격이 진짜 싼 걸까? 핫딜온도계로 확인하세요.",
    url: "https://www.ssagesage.com",
    siteName: "싸게사게",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // ✅ 방법 1: 터미널(서버 로그)에서 확인하기
  console.log("서버에서 확인한 GA ID:", gaId);

  return (
    <html lang="ko">
      <head>
        {/* 구글 애드센스 스크립트 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7220782481108319"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* ✅ 방법 2: 브라우저(F12) 콘솔에서 바로 확인하기 (스크립트 태그 사용) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log("브라우저에서 확인한 GA ID:", "${gaId}");`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
       
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}