import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://luckyquest.app"),
  title: {
    default: "Lucky Quest — 오늘의 운세와 럭키 퀘스트",
    template: "%s · Lucky Quest",
  },
  description:
    "사주 오행으로 읽는 오늘의 기운과 MBTI로 고른 작은 퀘스트. 하루 두 걸음이면 오늘의 카드가 열려요.",
  applicationName: "Lucky Quest",
  manifest: "/manifest.webmanifest",
  keywords: ["운세", "사주", "오행", "MBTI", "행운", "럭키 카드", "퀘스트", "Lucky Quest"],
  authors: [{ name: "Lucky Quest", url: "https://luckyquest.app" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://luckyquest.app",
    siteName: "Lucky Quest",
    title: "Lucky Quest — 오늘의 운세와 럭키 퀘스트",
    description:
      "사주 오행으로 읽는 오늘의 기운과 MBTI로 고른 작은 퀘스트. 하루 두 걸음이면 오늘의 카드가 열려요.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Quest — 오늘의 운세와 럭키 퀘스트",
    description: "사주 오행과 MBTI로 만나는 오늘의 행운 퀘스트.",
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
