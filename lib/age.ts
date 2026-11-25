import type { Birth } from "./types";

/**
 * 연령대 — 오늘의 운세를 어디에 무게를 두고 풀지 정한다.
 * young: MBTI 성향과 데일리 퀘스트를 앞세운다. (45세 이하)
 * mature: 사주 일진·오행 상생상극 풀이를 앞세우고 MBTI는 보조로 둔다. (46~64세)
 * senior: 사주 일진·오행 풀이 중심. MBTI는 원할 때만 가볍게 참고한다. (65세 이상)
 */
export type AgeGroup = "young" | "mature" | "senior";

/** 이 나이(한국식 나이)부터 사주 깊이 풀이로 넘어간다. */
export const MATURE_AGE = 46;

/** 이 나이(한국식 나이)부터 사주 중심으로 바로 시작하고 MBTI는 선택으로 둔다. */
export const SENIOR_AGE = 65;

/**
 * 한국식 나이 — 2026년 기준 1963년생이 64세(생일 전이라도)라 mature,
 * 1962년생부터 65세로 senior. 온보딩에서 받은 생년만으로 판별한다.
 */
export function koreanAge(birthYear: number, now: Date = new Date()): number {
  return now.getFullYear() - birthYear + 1;
}

export function ageGroupForYear(birthYear: number, now: Date = new Date()): AgeGroup {
  const age = koreanAge(birthYear, now);
  if (age >= SENIOR_AGE) return "senior";
  if (age >= MATURE_AGE) return "mature";
  return "young";
}

export function ageGroupOf(birth: Birth, now: Date = new Date()): AgeGroup {
  return ageGroupForYear(birth.year, now);
}

/** 46세 이후 — 연애 대신 직장·지인·가족·거래처 중심의 관계 풀이를 쓴다. */
export function isMature(group: AgeGroup): boolean {
  return group === "mature";
}

/** 65세 이상 — MBTI를 고르지 않으면 사주만으로 깔끔하게 보여 준다. */
export function isSenior(group: AgeGroup): boolean {
  return group === "senior";
}

/** 사주 일진·오행을 5줄로 깊이 풀어 주는 연령대 (46세 이후 전부). */
export function isSajuDeep(group: AgeGroup): boolean {
  return group === "mature" || group === "senior";
}

export const AGE_GROUP_LABEL: Record<AgeGroup, string> = {
  young: "성향 중심 풀이",
  mature: "사주 중심 풀이",
  senior: "사주 깊이 풀이",
};
