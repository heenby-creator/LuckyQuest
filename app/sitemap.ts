import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/share";

/**
 * sitemap.xml — 크롤러에게 알릴 공개 URL만 담는다.
 *
 * - `/` : 서비스의 유일한 진입 화면. 오늘의 운세·퀘스트·카드 해금이 모두 이 한 화면에서 이뤄진다.
 * - `/card/[date]` : 공유 링크로만 열리는 날짜별 카드. 날짜마다 새로 생기는 무한 확장 라우트라
 *   목록을 미리 나열하지 않고(빌드 시점에 굳은 날짜가 금세 낡는다), 공유로 유입된 URL이
 *   링크를 따라 발견되도록 둔다. robots.txt에서도 막지 않는다.
 * - `/api/...` : OG 이미지 생성용 엔드포인트라 제외한다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
