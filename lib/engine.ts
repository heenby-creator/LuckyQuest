import {
  CHARMS,
  COMBO_QUESTS,
  ELEMENT_QUESTS,
  ELEMENT_WHY,
  MBTI_QUESTS,
  MBTI_STYLE,
  RELATION_PHRASE,
  TODAY_MOOD,
  TOPIC_ELEMENT_LINES,
  TOPIC_MBTI_ACTIONS,
  TOPIC_TIPS,
  comboKeyOf,
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
  /** 같은 행동이 두 카드에 겹치지 않도록 묶는 키. */
  action: string;
  /** Quest 1이 채우는 오행 — 복합 퀘스트는 두 개. */
  elements: Element[];
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
  /** 오늘의 퀘스트가 겨냥한 오행 — 복합이면 두 개, 단일이면 하나. */
  focus: Element[];
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

/** 두 오행을 항상 목·화·토·금·수 순서로 정돈한다. */
function ordered(a: Element, b: Element): [Element, Element] {
  return ELEMENTS.indexOf(a) <= ELEMENTS.indexOf(b) ? [a, b] : [b, a];
}

export interface Deficiency {
  /** 함께 부족한 두 오행. 복합 퀘스트를 고를 때만 채워진다. */
  pair: [Element, Element] | null;
  /** 오늘 가장 적은 오행 (동률이면 날짜 시드로 하나). */
  lead: Element;
  /** 개수가 0인 오행 전부. */
  zeros: Element[];
  /** 적은 순서로 정렬한 오행. */
  ranked: Element[];
}

/**
 * 오늘 채워야 할 오행을 정한다.
 * - 0인 오행이 둘 이상이면 그중 두 개를 짝지어 복합 퀘스트를 고른다.
 * - 0인 오행이 하나이고 다음으로 적은 오행도 1개 이하이면 둘을 짝짓는다.
 * - 그 외에는 가장 적은 오행 하나만 고른다. (동률이면 날짜 시드로 고른다)
 */
export function deficiencyOf(chart: Chart, seed: string): Deficiency {
  const counts = chart.counts;
  const ranked = [...ELEMENTS].sort(
    (a, b) => counts[a] - counts[b] || ELEMENTS.indexOf(a) - ELEMENTS.indexOf(b),
  );
  const zeros = ranked.filter((el) => counts[el] === 0);

  if (zeros.length >= 2) {
    const pairs: [Element, Element][] = [];
    for (let i = 0; i < zeros.length; i += 1) {
      for (let j = i + 1; j < zeros.length; j += 1) pairs.push(ordered(zeros[i], zeros[j]));
    }
    return { pair: pick(pairs, `${seed}-pair`), lead: zeros[0], zeros, ranked };
  }

  const lowest = ranked[0];
  const secondCount = counts[ranked[1]];
  // 비어 있는 오행이 하나뿐이어도 다음으로 적은 오행이 1개 이하면 둘을 함께 채운다.
  if (counts[lowest] === 0 && secondCount <= 1) {
    const tied = ELEMENTS.filter((el) => el !== lowest && counts[el] === secondCount);
    const second = pick(tied, `${seed}-second`);
    const pair = ordered(lowest, second);
    return { pair, lead: lowest, zeros, ranked };
  }

  const tiedLowest = ELEMENTS.filter((el) => counts[el] === counts[lowest]);
  return { pair: null, lead: pick(tiedLowest, `${seed}-lead`), zeros, ranked };
}

function resolveQuest(quest: Quest, badge: ResolvedQuest["badge"], element: Element, mbti: Mbti, tone: "leaf" | "gold"): ResolvedQuest {
  return {
    id: quest.id,
    badge,
    title: quest.title,
    desc: quest.desc,
    why: quest.why,
    action: quest.action,
    elements: quest.elements,
    element,
    mbti,
    tone,
  };
}

export function buildDaily(profile: Profile, now: Date = new Date()): DailyView {
  const key = dateKey(now);
  const chart = chartOf(profile);
  const today = todayEnergy(now);
  const deficiency = deficiencyOf(chart, key);
  const { pair, lead } = deficiency;

  // Quest 1 — 부족한 오행 하나, 또는 두 오행을 함께 채우는 복합 퀘스트
  const comboKey = pair ? comboKeyOf(pair[0], pair[1]) : null;
  const q1Pool = comboKey ? COMBO_QUESTS[comboKey] : ELEMENT_QUESTS[lead];
  const q1 = pick(q1Pool, `${key}-q1-${comboKey ?? lead}-${profile.mbti}`);

  // Quest 2 — MBTI 성향에 맞춘 행동. Quest 1과 같은 행동은 피한다.
  const q2Pool = MBTI_QUESTS[profile.mbti];
  const q2Candidates = q2Pool.filter((q) => q.action !== q1.action);
  const q2 = pick(q2Candidates.length > 0 ? q2Candidates : q2Pool, `${key}-q2-${profile.mbti}`);

  const score = energyScore(today.element, chart.dayMaster, `${key}-${profile.birth.year}${profile.birth.month}${profile.birth.day}-${profile.mbti}`);

  const relation = relationOf(today.element, chart.dayMaster);
  const balanceLine = (() => {
    if (pair) {
      const [a, b] = pair;
      const pa = elementPercent(chart.counts[a], chart.total);
      const pb = elementPercent(chart.counts[b], chart.total);
      if (pa === 0 && pb === 0) {
        if (deficiency.zeros.length > 2) {
          return `${deficiency.zeros.join("·")} 기운이 0%로 비어 있어요. 오늘은 그중 ${a}와 ${b} 기운을 함께 채워 볼까요?`;
        }
        return `${a} 기운과 ${b} 기운이 0%로 함께 비어 있어요. 오늘은 두 기운을 한 번에 채우는 작은 행동이 잘 맞아요.`;
      }
      if (pa === 0) {
        return `${a} 기운이 0%, ${b} 기운이 ${pb}%로 가장 적어요. 오늘은 두 기운을 함께 살펴볼까요?`;
      }
      return `${a} 기운이 ${pa}%, ${b} 기운이 ${pb}%로 가장 적어요. 두 기운을 함께 채워 보면 좋아요.`;
    }
    const pct = elementPercent(chart.counts[lead], chart.total);
    return `${lead} 기운이 ${pct}%로 가장 적어요. 오늘은 ${ELEMENT_WHY[lead]}`;
  })();

  const reading = [
    TODAY_MOOD[today.element],
    `${chart.dayMaster} 기운을 가진 오늘의 나, ${RELATION_PHRASE[relation]}`,
    balanceLine,
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

  const focus = pair ? [...pair] : [lead];

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
      resolveQuest(q1, "Quest 1", focus[0], profile.mbti, "leaf"),
      resolveQuest(q2, "Quest 2", focus[0], profile.mbti, "gold"),
    ],
    focus,
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
