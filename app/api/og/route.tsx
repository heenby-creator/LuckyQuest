import { ImageResponse } from "next/og";
import { cardForDate, isShareableDate, parseCardDate } from "@/lib/share";
import { OgCard, OgDefault } from "./design";
import { loadOgFonts } from "./fonts";

export const runtime = "nodejs";

export const size = { width: 1200, height: 630 };

/**
 * OG 이미지 엔드포인트.
 *  - /api/og                → 대표 브랜드 이미지
 *  - /api/og?card=2026-11-24 → 그날 '오늘의 카드'
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = parseCardDate(url.searchParams.get("card"));
  const key = requested && isShareableDate(requested) ? requested : null;

  const fonts = await loadOgFonts(url.origin);

  return new ImageResponse(key ? <OgCard card={cardForDate(key)} /> : <OgDefault />, {
    ...size,
    fonts: fonts.map((font) => ({
      name: "Noto Serif KR",
      data: font.data,
      weight: font.weight,
      style: "normal" as const,
    })),
    headers: {
      "Content-Type": "image/png",
      // 카드 이미지는 날짜로만 정해지므로 오래 캐시해도 안전하다.
      "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
      "X-OG-Card": key ?? "default",
    },
  });
}
