import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google'; 
import Script from 'next/script'; 

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL('https://www.ssagesage.com'), 
  title: {
    default: "싸게사게 🦀 | 실시간 핫딜 모음 & 핫딜온도계",
    template: "%s | 싸게사게 🦀" 
  },
  description: "뽐뿌, 에펨코리아 등 커뮤니티 핫딜을 실시간으로 모아보고, 100g 당 단가 분석으로 진짜 최저가를 찾아드립니다.",
  keywords: ["핫딜", "최저가", "뽐뿌", "에펨코리아", "핫딜온도계", "생필품 시세", "싸게사게", "핫딜모음"],
  icons: { icon: "/favicon.ico" },
  verification: {
    google: "AlYaCKTyHzy8ufh7Fp9WB1vUw53b-SzuLTPxuulrKnE",
    other: { "naver-site-verification": "4e8e9141f9ec9d45577433029e1c20c21d56fd0f" },
  },
  alternates: { canonical: 'https://www.ssagesage.com' },
  openGraph: {
    title: "싸게사게 🦀 | 핫딜 모음 & 역대가 분석",
    description: "지금 이 가격이 진짜 싼 걸까? 핫딜온도계로 확인하세요.",
    url: "https://www.ssagesage.com", siteName: "싸게사게", locale: "ko_KR", type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7220782481108319"
          crossOrigin="anonymous" strategy="afterInteractive" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
