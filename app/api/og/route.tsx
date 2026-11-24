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
      // 카드 내용은 날짜로만 정해진다. 다만 디자인을 고칠 수 있으니 CDN 캐시는 길게, 브라우저는 짧게 둔다.
      // 디자인을 바꾸면 lib/share.ts의 OG_CARD_VERSION을 올려 주소를 바꾼다.
      "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
      "X-OG-Card": key ?? "default",
    },
  });
}
