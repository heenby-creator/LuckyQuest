import {
  CHARMS,
  ELEMENT_QUESTS,
  ELEMENT_WHY,
  MBTI_QUESTS,
  MBTI_STYLE,
  MBTI_WHY,
  RELATION_PHRASE,
  TODAY_MOOD,
  TOPIC_ELEMENT_LINES,
  TOPIC_MBTI_ACTIONS,
  TOPIC_TIPS,
  type FortuneTopic,
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

export interface TopicFortune {
  /** 주제별 1~2줄 풀이 — 오행 기운 + MBTI 성향 */
  lines: string[];
  /** 오늘 바로 해볼 한 줄 팁 */
  tip: string;
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
  /** 재물 · 연애·대인 · 일·학업 한마디 */
  topics: Record<FortuneTopic, TopicFortune>;
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

const TOPIC_KEYS: FortuneTopic[] = ["money", "love", "work"];

function buildTopicFortunes(mbti: Mbti, element: Element, seed: string): Record<FortuneTopic, TopicFortune> {
  const result = {} as Record<FortuneTopic, TopicFortune>;

  for (const topic of TOPIC_KEYS) {
    // 앞 두 글자(E/I·S/N) 중 하나, 뒤 두 글자(T/F·J/P) 중 하나를 골라 성향 문장을 만든다.
    const styleLetter = (hash(`${seed}-${topic}-style`) % 2 === 0 ? mbti[0] : mbti[1]) as keyof typeof MBTI_STYLE;
    const actionLetter = (hash(`${seed}-${topic}-action`) % 2 === 0 ? mbti[2] : mbti[3]) as keyof (typeof TOPIC_MBTI_ACTIONS)[FortuneTopic];

    result[topic] = {
      lines: [
        pick(TOPIC_ELEMENT_LINES[topic][element], `${seed}-${topic}-element`),
        `${MBTI_STYLE[styleLetter]}, ${TOPIC_MBTI_ACTIONS[topic][actionLetter]}`,
      ],
      tip: TOPIC_TIPS[topic][element],
    };
  }

  return result;
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
    topics: buildTopicFortunes(profile.mbti, today.element, `${key}-${profile.mbti}`),
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
