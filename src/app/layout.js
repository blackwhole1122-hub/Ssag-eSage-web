import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleTagManager } from '@next/third-parties/google'; 
import Script from 'next/script'; 

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL('https://www.ssagesage.com'), 
  title: "싸게사게 | 핫딜 모음 & 역대가 분석",
  description: "놓치면 후회하는 실시간 핫딜 정보 & 역대가 분석",
  
  icons: {
    icon: "/favicon.ico",
  },

  verification: {
    naver: "4e8e9141f9ec9d45577433029e1c20c21d56fd0f",
  },

  openGraph: {
    title: "싸게사게 | 핫딜 모음 & 역대가 분석",
    description: "놓치면 후회하는 실시간 핫딜 정보 & 역대가 분석",
    url: "https://www.ssagesage.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
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
    </html> // ✨ 1. html 태그를 닫아주었습니다.
  );
} // ✨ 2. RootLayout 함수를 닫아주었습니다.