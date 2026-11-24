import { charmForDate } from "./content";
import { todayEnergy } from "./saju";
import type { Element } from "./types";
import { dateKey } from "./utils";

/** 공유 링크와 OG 메타의 기준 주소 — apex(luckyquest.app)는 www로 308 리다이렉트되므로 www를 쓴다. */
export const SITE_URL = "https://www.luckyquest.app";

/** OG 카드 디자인을 바꿔 크롤러·CDN 캐시를 넘길 때 올리는 번호 */
export const OG_CARD_VERSION = "2";

const WEEKDAY_LONG = ["일", "월", "화", "수", "목", "금", "토"];

export interface ShareCard {
  dateKey: string;
  /** 오늘의 일진 오행 */
  element: Element;
  /** 일진 간지 (예: 임술) */
  pillar: string;
  title: string;
  /** 오늘의 기운과 맞닿은 명언 */
  quote: string;
  author: string;
  colorName: string;
  number: string;
  /** 행운의 아이템 */
  item: string;
  /** 카드 id (예: c-수-01) */
  cardId: string;
  /** 예: 11월 24일 화요일 */
  dateLabel: string;
}

/** `YYYY-MM-DD` 문자열을 검증해 정규화한다. 형식이 어긋나면 null. */
export function parseCardDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (year < 2024 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return dateKey(date);
}

/**
 * 그날의 '오늘의 행운 카드'를 그대로 복원한다.
 * 카드는 (날짜, 일진 오행)으로만 정해지므로 생년월일·MBTI 없이도 같은 카드가 나온다 —
 * 공유 링크에 개인 정보가 담기지 않는 이유이기도 하다.
 */
export function cardForDate(key: string): ShareCard {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  const today = todayEnergy(date);
  const content = charmForDate(key, today.element);
  return {
    dateKey: key,
    element: today.element,
    pillar: today.pillar,
    title: content.title,
    quote: content.quote,
    author: content.author,
    colorName: content.colorName,
    number: content.number,
    item: content.item,
    cardId: content.id,
    dateLabel: `${month}월 ${day}일 ${WEEKDAY_LONG[date.getDay()]}요일`,
  };
}

/** 아직 오지 않은 날의 카드는 공유할 수 없다. */
export function isShareableDate(key: string, now: Date = new Date()): boolean {
  return key <= dateKey(now);
}

export function shareUrl(key: string): string {
  return `${SITE_URL}/card/${key}`;
}

/** 그날 카드의 OG 이미지 주소 — 디자인을 고치면 OG_CARD_VERSION을 올린다. */
export function ogImageUrl(key: string): string {
  return `${SITE_URL}/api/og?card=${key}&v=${OG_CARD_VERSION}`;
}

/** 공유 문구 — 카톡·링크 복사·Web Share에 함께 쓰는 한 벌. */
export function shareText(card: Pick<ShareCard, "title" | "quote" | "author">): string {
  return `오늘의 행운 카드 — ${card.title}\n"${card.quote}" — ${card.author}`;
}
