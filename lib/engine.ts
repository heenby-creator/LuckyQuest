import {
  CHARMS,
  ELEMENT_QUESTS,
  ELEMENT_WHY,
  MBTI_QUESTS,
  MBTI_WHY,
  RELATION_PHRASE,
  TODAY_MOOD,
  type Quest,
} from "./content";
import {
  ELEMENTS,
  chartOf,
  elementPercent,
  elementStatus,
  relationOf,
  todayEnergy,
  type Chart,
} from "./saju";
import type { Element, Mbti, Profile } from "./types";
import { clamp, dateKey, hash, pick } from "./utils";

export interface ResolvedQuest {
  id: string;
  badge: "Quest 1" | "Quest 2";
  title: string;
  desc: string;
  why: string;
  element: Element;
  mbti: Mbti;
  tone: "leaf" | "gold";
}

export interface BalanceItem {
  element: Element;
  count: number;
  percent: number;
  status: "좋음" | "보통" | "부족";
}

export interface CharmView {
  id: string;
  element: Element;
  title: string;
  message: string;
  keyword: string;
  colorName: string;
  number: string;
}

export interface DailyView {
  dateKey: string;
  chart: Chart;
  today: { element: Element; pillar: string };
  score: number;
  scoreLabel: string;
  scoreCaption: string;
  balance: BalanceItem[];
  reading: string[];
  quests: [ResolvedQuest, ResolvedQuest];
  charm: CharmView;
}

function energyScore(todayEl: Element, me: Element, seed: string): number {
  let base = 80;
  if (relationOf(todayEl, me) === "도움") base += 8;
  else if (todayEl === me) base += 6;
  else if (relationOf(todayEl, me) === "보탬") base += 3;
  else base += 5;

  const jitter = (hash(seed) % 13) - 6; // -6 ~ +6
  return clamp(base + jitter, 65, 95);
}

function scoreLabel(score: number): string {
  if (score >= 90) return "빛나는 하루예요!";
  if (score >= 83) return "아주 맑은 기운이에요";
  if (score >= 75) return "좋은 기운이 가득해요";
  if (score >= 69) return "차분히 좋은 날이에요";
  return "잔잔히 빛나는 하루예요";
}

function resolveQuest(quest: Quest, badge: ResolvedQuest["badge"], why: string, element: Element, mbti: Mbti, tone: "leaf" | "gold"): ResolvedQuest {
  return { ...quest, badge, why, element, mbti, tone };
}

export function buildDaily(profile: Profile, now: Date = new Date()): DailyView {
  const key = dateKey(now);
  const chart = chartOf(profile);
  const today = todayEnergy(now);
  const weak = chart.weakest;
  const weakPercent = elementPercent(chart.counts[weak], chart.total);

  const q1 = pick(ELEMENT_QUESTS[weak], `${key}-q1-${weak}-${profile.mbti}`);
  const q2 = pick(MBTI_QUESTS[profile.mbti], `${key}-q2-${profile.mbti}`);

  const score = energyScore(today.element, chart.dayMaster, `${key}-${profile.birth.year}${profile.birth.month}${profile.birth.day}-${profile.mbti}`);

  const relation = relationOf(today.element, chart.dayMaster);
  const reading = [
    TODAY_MOOD[today.element],
    `${chart.dayMaster} 기운을 가진 오늘의 나, ${RELATION_PHRASE[relation]}`,
    `${weak} 기운이 ${weakPercent}%로 가장 적어요. 오늘은 ${ELEMENT_WHY[weak]}`,
  ];

  const charmContent = CHARMS[today.element];
  const charmMessage = pick(charmContent.messages, `${key}-charm-${today.element}`);

  const rawPercents = ELEMENTS.map((el) => (chart.counts[el] / Math.max(chart.total, 1)) * 100);
  const floors = rawPercents.map((p) => Math.floor(p));
  let rest = 100 - floors.reduce((a, b) => a + b, 0);
  const order = rawPercents
    .map((p, i) => ({ i, frac: p - Math.floor(p) }))
    .sort((a, b) => b.frac - a.frac);
  for (const item of order) {
    if (rest <= 0) break;
    floors[item.i] += 1;
    rest -= 1;
  }

  const balance: BalanceItem[] = ELEMENTS.map((el, index) => ({
    element: el,
    count: chart.counts[el],
    percent: floors[index],
    status: elementStatus(chart.counts[el], chart.total),
  }));

  return {
    dateKey: key,
    chart,
    today,
    score,
    scoreLabel: scoreLabel(score),
    scoreCaption: scoreLabel(score),
    balance,
    reading,
    quests: [
      resolveQuest(q1, "Quest 1", `${weak} 기운을 채우는 1분이에요. ${ELEMENT_WHY[weak]}`, weak, profile.mbti, "leaf"),
      resolveQuest(q2, "Quest 2", MBTI_WHY[profile.mbti], weak, profile.mbti, "gold"),
    ],
    charm: {
      id: `${key}-${today.element}`,
      element: today.element,
      title: charmContent.title,
      message: charmMessage,
      keyword: charmContent.keyword,
      colorName: charmContent.colorName,
      number: charmContent.number,
    },
  };
}
