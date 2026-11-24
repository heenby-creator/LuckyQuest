import type { Metadata, Viewport } from "next";
import "./globals.css";

// apex(luckyquest.app)는 www로 308 리다이렉트되므로, 크롤러가 곧장 200을 받도록 www를 기준 주소로 쓴다.
const SITE_URL = "https://www.luckyquest.app";
const OG_DESCRIPTION =
  "사주 오행으로 읽는 오늘의 기운과 MBTI로 고른 작은 퀘스트. 하루 두 걸음이면 오늘의 행운 카드가 열려요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Lucky Quest — 오늘의 운세와 럭키 퀘스트",
    template: "%s · Lucky Quest",
  },
  description: OG_DESCRIPTION,
  applicationName: "Lucky Quest",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  keywords: ["운세", "사주", "오행", "MBTI", "행운", "럭키 카드", "퀘스트", "Lucky Quest"],
  authors: [{ name: "Lucky Quest", url: "https://luckyquest.app" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "Lucky Quest",
    title: "Lucky Quest — 오늘의 운세와 럭키 퀘스트",
    description: OG_DESCRIPTION,
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Lucky Quest — 오늘의 행운을 한 걸음씩",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Quest — 오늘의 운세와 럭키 퀘스트",
    description: "사주 오행과 MBTI로 만나는 오늘의 행운 퀘스트.",
    images: [{ url: "/og-default.png", alt: "Lucky Quest — 오늘의 행운을 한 걸음씩" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lucky Quest",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFBF0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
