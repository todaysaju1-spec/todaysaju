import Footer from "../components/Footer";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "오늘의사주 PRO - 소름 돋게 정확한 명리학 & 타로",
  description: "30년 경력 명리학자도 인정한 바로 보는 프리미엄 사주! 나의 오늘 운세, 재물운, 연애운부터 정통 명리학 풀이까지 지금 바로 확인해보세요.",
  keywords: ["사주", "오늘의사주", "사주팔자", "명리학", "타로", "운세", "재물운", "연애운", "궁합"],
  openGraph: {
    title: "오늘의사주 PRO - 소름 돋게 정확한 명리학 & 타로",
    description: "30년 경력 명리학자가 인정한 바로 보는 프리미엄 사주 바로 보는 프리미엄 사주! 나의 오늘 운세, 재물운, 연애운을 확인해보세요.",
    url: "https://todaysaju-six.vercel.app", // 대표님 실제 배포 주소
    siteName: "오늘의사주 PRO",
    images: [
      {
        url: "/og-image.png", // public 폴더에 넣어둘 이미지 이름
        width: 1200,
        height: 630,
        alt: "오늘의사주 PRO",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
      <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="afterInteractive" />
      {children}
      <Footer />
      </body>
    </html>
  );
}
