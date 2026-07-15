import Footer from "../components/Footer";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "오늘의사주 PRO",
  description: "우주의 궤도에서 읽는 당신의 진짜 운명",
  openGraph: {
    title: "오늘의사주 PRO",
    description: "복잡한 회원가입 없이 단 1초 만에 시작하세요.",
    url: "https://todaysaju-six.vercel.app", // 대표님 실제 배포 주소
    siteName: "오늘의사주",
    images: [
      {
        url: "/og-image.png", // 우리가 띄울 썸네일 이미지 이름
        width: 800,
        height: 400,
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
      {children}
      <Footer />
      </body>
    </html>
  );
}
