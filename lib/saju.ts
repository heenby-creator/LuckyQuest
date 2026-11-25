import { calculateFourPillars } from "manseryeok";
import type { Birth, BirthTime, Element, Profile } from "./types";

export const ELEMENTS: Element[] = ["목", "화", "토", "금", "수"];

/** 상생: 목 → 화 → 토 → 금 → 수 → 목 */
export const GENERATES: Record<Element, Element> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

/** 상극: 목 → 토 → 수 → 화 → 금 → 목 */
export const CONTROLS: Record<Element, Element> = {
  목: "토",
  토: "수",
  수: "화",
  화: "금",
  금: "목",
};

/** 12시진 — 자시(23:00~01:00)부터 해시(21:00~23:00)까지 */
export const JIN: { name: string; range: string; hour: number }[] = [
  { name: "자시", range: "23~01시", hour: 0 },
  { name: "축시", range: "01~03시", hour: 2 },
  { name: "인시", range: "03~05시", hour: 4 },
  { name: "묘시", range: "05~07시", hour: 6 },
  { name: "진시", range: "07~09시", hour: 8 },
  { name: "사시", range: "09~11시", hour: 10 },
  { name: "오시", range: "11~13시", hour: 12 },
  { name: "미시", range: "13~15시", hour: 14 },
  { name: "신시", range: "15~17시", hour: 16 },
  { name: "유시", range: "17~19시", hour: 18 },
  { name: "술시", range: "19~21시", hour: 20 },
  { name: "해시", range: "21~23시", hour: 22 },
];

export interface PillarView {
  label: string;
  value: string;
  hanja: string;
  known: boolean;
}

export interface Chart {
  pillars: PillarView[];
  counts: Record<Element, number>;
  total: number;
  dayMaster: Element;
  strongest: Element;
  weakest: Element;
  hourKnown: boolean;
  birthLabel: string;
}

function timeToHourMinute(time: BirthTime): { hour: number; minute: number } {
  if (time.kind === "unknown") return { hour: 12, minute: 0 };
  if (time.kind === "jin") return { hour: JIN[time.index]?.hour ?? 12, minute: 30 };
  return { hour: time.hour, minute: time.minute };
}

export function computeChart(birth: Birth, time: BirthTime): Chart {
  const { hour, minute } = timeToHourMinute(time);
  const result = calculateFourPillars({
    year: birth.year,
    month: birth.month,
    day: birth.day,
    hour,
    minute,
    isLunar: birth.isLunar,
    isLeapMonth: birth.isLunar ? birth.isLeapMonth : false,
  });

  const hourKnown = time.kind !== "unknown";

  const pairs: { label: string; pair: { stem: string; branch: string }; korean: string; hanja: string; known: boolean }[] = [
    { label: "연주", pair: result.yearElement, korean: result.yearString, hanja: result.yearHanja, known: true },
    { label: "월주", pair: result.monthElement, korean: result.monthString, hanja: result.monthHanja, known: true },
    { label: "일주", pair: result.dayElement, korean: result.dayString, hanja: result.dayHanja, known: true },
    { label: "시주", pair: result.hourElement, korean: result.hourString, hanja: result.hourHanja, known: hourKnown },
  ];

  const counts: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of pairs) {
    if (!p.known) continue;
    counts[p.pair.stem as Element] += 1;
    counts[p.pair.branch as Element] += 1;
  }

  const total = hourKnown ? 8 : 6;

  let strongest: Element = "목";
  let weakest: Element = "목";
  for (const el of ELEMENTS) {
    if (counts[el] > counts[strongest]) strongest = el;
    if (counts[el] < counts[weakest]) weakest = el;
  }

  const dayMaster = result.dayElement.stem as Element;

  const birthLabel = birth.isLunar
    ? `음력 ${birth.year}.${birth.month}.${birth.day}${birth.isLeapMonth ? " (윤달)" : ""}`
    : `양력 ${birth.year}.${birth.month}.${birth.day}`;

  return {
    pillars: pairs.map((p) => ({
      label: p.label,
      value: p.known ? p.korean : "모름",
      hanja: p.known ? p.hanja : "—",
      known: p.known,
    })),
    counts,
    total,
    dayMaster,
    strongest,
    weakest,
    hourKnown,
    birthLabel,
  };
}

/** 60갑자의 천간·지지 한 글자 — 일진의 순번을 되짚을 때 쓴다. */
const STEM_CHARS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCH_CHARS = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

/** 간지(예: 임인)를 60갑자 순번 0~59로 옮긴다. 날마다 다른 문장·점수를 고르는 씨앗이 된다. */
export function sexagenaryIndex(pillar: string): number {
  const stem = STEM_CHARS.indexOf(pillar.charAt(0));
  const branch = BRANCH_CHARS.indexOf(pillar.charAt(1));
  if (stem < 0 || branch < 0) return 0;
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === stem && i % 12 === branch) return i;
  }
  return 0;
}

export interface DayEnergy {
  /** 일진 천간 오행 — 오늘 겉으로 드러나는 기운 */
  element: Element;
  /** 일진 지지 오행 — 오늘 발밑을 받쳐 주는 바탕 기운 */
  branchElement: Element;
  /** 천간 한 글자 (예: 계) */
  stem: string;
  /** 지지 한 글자 (예: 묘) */
  branch: string;
  /** 일진 간지 (예: 계묘) */
  pillar: string;
  /** 일진 간지 한자 (예: 癸卯) */
  pillarHanja: string;
  /** 60갑자 순번 0~59 */
  cycleIndex: number;
}

/**
 * 오늘 날짜의 일진(日辰) — 천간(겉기운)과 지지(바탕 기운)를 함께 돌려준다.
 * 천간만 보면 열흘 중 이틀이 같은 오행으로 겹치고, 지지까지 보면 60갑자마다 결이 달라진다.
 */
export function todayEnergy(now: Date = new Date()): DayEnergy {
  const result = calculateFourPillars({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: 12,
    minute: 0,
  });
  const pillar = result.dayString;
  return {
    element: result.dayElement.stem as Element,
    branchElement: result.dayElement.branch as Element,
    stem: pillar.charAt(0),
    branch: pillar.charAt(1),
    pillar,
    pillarHanja: result.dayHanja,
    cycleIndex: sexagenaryIndex(pillar),
  };
}

export function elementStatus(count: number, total: number): "좋음" | "보통" | "부족" {
  const ratio = total === 0 ? 0 : count / total;
  if (ratio >= 0.24) return "좋음";
  if (ratio >= 0.12) return "보통";
  return "부족";
}

export function elementPercent(count: number, total: number): number {
  return Math.round((count / Math.max(total, 1)) * 100);
}

/** 오늘 들어온 기운과 내 일간의 관계 — 상생은 도움·보탬, 상극은 버팀·누름으로 나눈다. */
export type Relation = "도움" | "같음" | "보탬" | "버팀" | "누름";

export function relationOf(today: Element, me: Element): Relation {
  if (GENERATES[today] === me) return "도움";
  if (today === me) return "같음";
  if (GENERATES[me] === today) return "보탬";
  if (CONTROLS[today] === me) return "버팀";
  return "누름";
}

export function chartOf(profile: Profile): Chart {
  return computeChart(profile.birth, profile.time);
}

export function timeLabel(time: BirthTime): string {
  if (time.kind === "unknown") return "태어난 시간 모름";
  if (time.kind === "jin") {
    const j = JIN[time.index] ?? JIN[6];
    return `${j.name} (${j.range})`;
  }
  const h = `${time.hour}`.padStart(2, "0");
  const m = `${time.minute}`.padStart(2, "0");
  return `${h}:${m}`;
}
