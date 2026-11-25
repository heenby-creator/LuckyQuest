import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/share";

/**
 * robots.txt — 전체 공개를 기본으로 두고, 크롤링할 이유가 없는 API 경로만 막는다.
 *
 * `/card/[date]` 같은 공유 라우트는 검색 유입에 쓰이므로 막지 않는다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
