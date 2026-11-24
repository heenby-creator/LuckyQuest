/**
 * GA4 이벤트 헬퍼 — 측정 ID와 맞춤 이벤트 이름·파라미터를 이 파일 한 곳에서 관리한다.
 * gtag 스크립트는 app/layout.tsx에서 afterInteractive로 불러온다.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-WDYQWNKBHW";

type GtagCommand = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagCommand;
    dataLayer?: unknown[];
  }
}

/** 공유 경로 — 카카오톡 인앱 브라우저, OS 공유 시트, 링크 복사 */
type ShareMethod = "kakaotalk" | "native_share" | "clipboard";

/** 앱이 보내는 맞춤 이벤트와 그 파라미터. 이름과 값의 모양을 여기서만 정의한다. */
export interface AnalyticsEvents {
  /** 프로필 입력(온보딩) 완료 — first_time=false는 '내 정보 수정' 저장 */
  onboarding_complete: { first_time: boolean; mbti: string; time_known: boolean; lunar: boolean };
  /** 운세 카드의 주제 탭 클릭 */
  fortune_tab_click: { tab: "all" | "money" | "love" | "work"; label: string };
  /** 퀘스트 완료 체크 */
  quest_complete: { quest_index: 1 | 2; quest_badge: string };
  /** 완료한 퀘스트에 인증샷 첨부 */
  photo_attach: { quest_index: 1 | 2 };
  /** 두 퀘스트를 마쳐 오늘의 행운 카드가 열림 */
  card_unlock: { date: string; streak: number };
  /** 카카오톡 안에서 공유 시트 열기 */
  share_kakao: { date: string; method: ShareMethod };
  /** 그 밖의 공유(OS 공유 시트·링크 복사) */
  share_link: { date: string; method: ShareMethod };
  /** 인증샷 포함 카드 이미지 저장/공유 */
  card_download: { date: string; photo_count: number; method: "shared" | "downloaded" };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

/**
 * GA4로 맞춤 이벤트를 보낸다.
 * 이벤트 이름과 파라미터 모양이 어긋나면 컴파일 단계에서 걸린다.
 * gtag가 아직 없거나(스크립트 로드 전) 서버 렌더 중이면 조용히 넘어가 앱 동작을 막지 않는다.
 */
export function trackEvent<T extends AnalyticsEventName>(name: T, params: AnalyticsEvents[T]): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

/** 카카오톡 인앱 브라우저인지 — 안드로이드 KAKAOTALK, iOS KAKAOTALK ... 문자열을 함께 본다. */
export function isKakaoTalkBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /kakaotalk/i.test(navigator.userAgent);
}
