import Footer from "../components/Footer";
import InstallPrompt from "../components/InstallPrompt";
import InAppBrowserBanner from "../components/InAppBrowserBanner";
import Providers from "../components/Providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_KR } from "next/font/google";
import Script from "next/script";
import { getCurrentTenantTheme } from "@/lib/tenant-theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 캐릭터 테마(동양화/한복 분위기) 제목용 한글 세리프 폰트
const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getCurrentTenantTheme();
  const title = theme.tagline ? `${theme.siteName} - ${theme.tagline}` : theme.siteName;

  return {
    title,
    description: theme.metaDescription || undefined,
    keywords: ["사주", "오늘의사주", "사주팔자", "명리학", "타로", "운세", "재물운", "연애운", "궁합"],
    openGraph: {
      title,
      description: theme.metaDescription || undefined,
      url: "https://todaysajupro.com",
      siteName: theme.siteName,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: theme.siteName,
        },
      ],
      locale: "ko_KR",
      type: "website",
    },
    verification: {
      google: "2x_x4FX8Dvqut0yda4goUJ_4pWnVAz8Gvb2RPseR4Nk",
      other: {
        "naver-site-verification": "412eec99de5873c071354350515f6e355c1a011c",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getCurrentTenantTheme();

  return (
    <html
      lang="en"
      data-theme={theme.mode}
      data-hero-image={theme.characterHeroImageUrl || ""}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
      <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="afterInteractive" />
      <Providers>
      <InAppBrowserBanner />
      {children}
      <InstallPrompt />
      <Footer />
      </Providers>
      </body>
    </html>
  );
}
