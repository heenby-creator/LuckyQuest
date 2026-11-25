import {
  BRANCH_DEPTH,
  BRANCH_MOOD,
  CAUTION_BOX,
  COMBO_QUESTS,
  ELEMENT_HANJA,
  ELEMENT_QUESTS,
  ELEMENT_WHY,
  MBTI_DAY_HINT,
  MBTI_DAY_TIP,
  MBTI_QUESTS,
  MBTI_STYLE,
  RELATION_PHRASE,
  STEM_DEPTH,
  TODAY_MOOD,
  TOPIC_ADVICE,
  TOPIC_ADVICE_MATURE_LOVE,
  TOPIC_CAUTION,
  TOPIC_CAUTION_MATURE_LOVE,
  TOPIC_FLOW,
  TOPIC_FLOW_MATURE_LOVE,
  TOPIC_MBTI_ACTIONS,
  TOPIC_MBTI_ACTIONS_MATURE,
  WEAK_DAY_TIP,
  charmForDate,
  comboKeyOf,
  elName,
  type CautionAxis,
  type FortuneTopic,
  type Quest,
} from "./content";
import { ageGroupOf, isSajuDeep, isSenior, type AgeGroup } from "./age";
import {
  CONTROLS,
  ELEMENTS,
  GENERATES,
  chartOf,
  elementPercent,
  elementStatus,
  relationOf,
  todayEnergy,
  type Chart,
  type DayEnergy,
  type Relation,
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
  mbti: Mbti | null;
  tone: "leaf" | "gold";
}

export interface BalanceItem {
  element: Element;
  count: number;
  percent: number;
  status: "좋음" | "보통" | "부족";
}

export interface TopicFortune {
  /** 오늘 이 분야의 지수(%) — 일진 오행과 내 일간의 관계로 계산한다. */
  score: number;
  /** 지수에 맞춘 상태 배지 (예: 흐름 좋음) */
  status: string;
  /** ① 오늘 이 분야의 직관적 흐름 판단 한 줄 */
  flow: string;
  /** ② 오늘 바로 참고할 구체적 생활 조언 한 줄 */
  advice: string;
  /** ③ 이 분야에서 오늘 조심할 것 한 줄 */
  caution: string;
  /** MBTI 성향에 맞춘 한마디 — MBTI 없이 시작한 경우 null */
  mbtiNote: string | null;
}

/** 오늘 조심할 것 — 일진과 내 일간·부족 오행의 부딪킴을 근거로 한 주의점과 회피 행동 */
export interface CautionView {
  axis: CautionAxis;
  /** 뾰족한 주의점 1가지 */
  caution: string;
  /** 바로 피하는 직관적 행동 1가지 */
  avoid: string;
  /** 사주 근거 — 오늘 간지·천간·지지와 내 일간·오행 분포 */
  basis: string;
}

export interface CharmView {
  id: string;
  element: Element;
  /** 카드 제목이 되는 키워드 */
  title: string;
  quote: string;
  author: string;
  colorName: string;
  number: string;
  item: string;
}

export interface DailyView {
  dateKey: string;
  /** 45세 이하 young / 46~64세 mature / 65세 이상 senior */
  ageGroup: AgeGroup;
  /** 사주 중심으로 시작해 MBTI가 없으면 null */
  mbti: Mbti | null;
  /** 46세 이후 종합 풀이 마지막에 붙는 성향 한 줄 — MBTI가 없으면 null */
  mbtiLine: string | null;
  chart: Chart;
  today: DayEnergy;
  score: number;
  scoreLabel: string;
  /** 점수에 맞춘 짧은 상태 배지 (예: 흐름 좋음) */
  scoreStatus: string;
  scoreCaption: string;
  balance: BalanceItem[];
  reading: string[];
  /** 오늘 조심할 것 — 운세를 보는 이유에 답하는 전용 주의 포인트 */
  caution: CautionView;
  /** 재물 · 연애·대인(46세 이후 대인·관계) · 일·학업 한마디 */
  topics: Record<FortuneTopic, TopicFortune>;
  quests: [ResolvedQuest, ResolvedQuest];
  /** 오늘의 퀘스트가 겨냥한 오행 — 복합이면 두 개, 단일이면 하나. */
  focus: Element[];
  charm: CharmView;
}

/* ── 점수 계산 — 천간·지지·내 일간·주제 오행의 상생·상극을 모두 본다 ── */

/** 천간(겉기운)이 내 일간에 작용하는 힘 */
const STEM_WEIGHT: Record<Relation, number> = { 도움: 8, 같음: 5, 보탬: 2, 버팀: -5, 누름: 4 };
/** 지지(바탕 기운)는 받쳐 주는 결이라 절반 무게로 본다. */
const BRANCH_WEIGHT: Record<Relation, number> = { 도움: 5, 같음: 4, 보탬: 1, 버팀: -3, 누름: 2 };

/**
 * 60갑자 순번을 날마다 크게 흔드는 결정적 물결.
 * span(홀수)과 mul을 서로소 가까이 고르면 연이틀 값이 적어도 7~9점은 벌어진다.
 */
function wave(cycleIndex: number, span: number, mul: number): number {
  const half = (span - 1) / 2;
  return ((cycleIndex * mul) % span) - half;
}

/**
 * 종합 지수 — 세 주제(재물·연애·일)의 평균에 그날 일진의 물결을 얹어 낸다.
 * 카테고리가 움직이면 종합도 따라 움직이고, 날마다 물결이 4~6점은 더 흔들어
 * 어제와 같은 숫자로 남지 않는다.
 */
function overallScore(topics: Record<FortuneTopic, number>, today: DayEnergy, seed: string): number {
  const average = (topics.money + topics.love + topics.work) / 3;
  const tide = Math.round(wave(today.cycleIndex, 15, 37) * 0.6);
  return clamp(Math.round(average) + tide + (hash(`${seed}-total`) % 5) - 2, 55, 97);
}

/** 주제가 기대는 오행과 오늘 기운이 맺는 인연 — 같음·생·극을 모두 센다. */
function affinity(incoming: Element, main: Element): number {
  if (incoming === main) return 5;
  if (GENERATES[incoming] === main) return 5;
  if (GENERATES[main] === incoming) return 1;
  if (CONTROLS[incoming] === main) return -4;
  return 2;
}

function scoreLabel(score: number): string {
  if (score >= 88) return "빛나는 하루예요!";
  if (score >= 80) return "아주 맑은 기운이에요";
  if (score >= 70) return "무난한 하루";
  if (score >= 62) return "차분히 챙기기";
  return "잔잔히 빛나는 하루예요";
}

/* ── 주제별 지수 ─────────────────────────────────────── */

const TOPIC_KEYS: FortuneTopic[] = ["money", "love", "work"];

/** 주제가 기대는 오행 — 재물은 결실(금), 연애·대인은 온기(화), 일·학업은 시작(목). */
const TOPIC_MAIN: Record<FortuneTopic, Element> = { money: "금", love: "화", work: "목" };

/** 지수를 상태 배지로 옮긴다. 탭·본문 어디서나 같은 기준을 쓴다. */
export function fortuneStatus(score: number): string {
  if (score >= 88) return "아주 좋은 흐름";
  if (score >= 80) return "흐름 좋음";
  if (score >= 70) return "무난한 하루";
  if (score >= 62) return "차분히 챙기기";
  return "천천히 가기";
}

/** 세 주제가 같은 점수로 뭉치지 않게, 높은 순서대로 최소 5점씩 벌려 놓는다. */
function spreadTopics(raw: Record<FortuneTopic, number>): Record<FortuneTopic, number> {
  const out = { ...raw };
  for (let guard = 0; guard < 8; guard += 1) {
    const sorted = [...TOPIC_KEYS].sort(
      (a, b) => out[b] - out[a] || TOPIC_KEYS.indexOf(a) - TOPIC_KEYS.indexOf(b),
    );
    let changed = false;
    for (let i = 1; i < sorted.length; i += 1) {
      const hi = out[sorted[i - 1]];
      const lo = out[sorted[i]];
      if (hi - lo >= 5) continue;
      changed = true;
      if (lo - 5 >= 55) out[sorted[i]] = lo - 5;
      else out[sorted[i - 1]] = Math.min(97, hi + 5);
    }
    if (!changed) break;
  }
  return out;
}

/**
 * 주제별 지수 — 천간·지지 각각과 내 일간의 관계, 그리고 그 기운이 주제 오행에게
 * 무엇을 하는지(같음·생·극)를 모두 더한다. 날마다 물결이 8점 이상 움직이고,
 * 세 주제에는 사람마다 고정된 +4/0/−4 자리 벌림이 붙어 서로 뚜렷이 갈린다.
 */
function topicScores(today: DayEnergy, me: Element, seed: string, stableSeed: string): Record<FortuneTopic, number> {
  const rankOrder = [...TOPIC_KEYS].sort(
    (a, b) =>
      (hash(`${stableSeed}-${a}-rank`) % 97) - (hash(`${stableSeed}-${b}-rank`) % 97) ||
      TOPIC_KEYS.indexOf(a) - TOPIC_KEYS.indexOf(b),
  );
  const lift: Record<string, number> = {};
  rankOrder.forEach((topic, i) => {
    lift[topic] = [4, 0, -4][i];
  });

  const raw = {} as Record<FortuneTopic, number>;
  for (const topic of TOPIC_KEYS) {
    const main = TOPIC_MAIN[topic];
    let base = 70;
    base += STEM_WEIGHT[relationOf(today.element, me)];
    base += BRANCH_WEIGHT[relationOf(today.branchElement, me)];
    base += affinity(today.element, main);
    base += Math.round(affinity(today.branchElement, main) * 0.6);
    base += lift[topic];
    base += wave(today.cycleIndex, 15, 37);
    base += (hash(`${seed}-${topic}-jitter`) % 7) - 3;
    raw[topic] = clamp(base, 55, 97);
  }
  return spreadTopics(raw);
}

/** 60갑자 순번으로 풀을 돌려 고른다 — 연이틀 인덱스가 반드시 달라져 같은 문장이 나오지 않는다. */
function rotate<T>(items: readonly T[], index: number, salt: string): T {
  const offset = hash(salt) % items.length;
  return items[(index + offset) % items.length];
}

function buildTopicFortunes(
  mbti: Mbti | null,
  group: AgeGroup,
  today: DayEnergy,
  scores: Record<FortuneTopic, number>,
  seed: string,
): Record<FortuneTopic, TopicFortune> {
  const result = {} as Record<FortuneTopic, TopicFortune>;
  // 46세 이후(중장년·시니어)는 직장·지인·가족 중심의 관계 문장과 행동 풀을 쓴다.
  const mature = isSajuDeep(group);
  const senior = isSenior(group);

  for (const topic of TOPIC_KEYS) {
    const score = scores[topic];
    // 46세 이후의 '대인·관계'는 연애가 아니라 직장·지인·가족·거래처 중심으로 쓴다.
    const relationTopic = mature && topic === "love";
    const flowPool = relationTopic ? TOPIC_FLOW_MATURE_LOVE[today.element] : TOPIC_FLOW[topic][today.element];
    const advicePool = relationTopic ? TOPIC_ADVICE_MATURE_LOVE[today.element] : TOPIC_ADVICE[topic][today.element];
    const cautionPool = relationTopic ? TOPIC_CAUTION_MATURE_LOVE[today.element] : TOPIC_CAUTION[topic][today.element];

    // 앞 두 글자(E/I·S/N) 중 하나, 뒤 두 글자(T/F·J/P) 중 하나를 골라 성향 한마디를 만든다.
    let mbtiNote: string | null = null;
    if (mbti) {
      const styleLetter = (hash(`${seed}-${topic}-style`) % 2 === 0 ? mbti[0] : mbti[1]) as keyof typeof MBTI_STYLE;
      const actionLetter = (hash(`${seed}-${topic}-action`) % 2 === 0 ? mbti[2] : mbti[3]) as keyof (typeof TOPIC_MBTI_ACTIONS)[FortuneTopic];
      const actions = mature ? TOPIC_MBTI_ACTIONS_MATURE : TOPIC_MBTI_ACTIONS;
      const note = `${MBTI_STYLE[styleLetter]}, ${actions[topic][actionLetter]}`;
      // 46~64세는 사주 70 : 성향 30 — 화면에서 '✨ INFP 성향' 배지와 함께 또렷이 보여 준다.
      // 65세 이상은 직접 고른 경우에만 사주 90 : 성향 10의 가벼운 참고 한 줄로 둔다.
      mbtiNote = senior ? `가볍게 — ${note}` : note;
    }

    result[topic] = {
      score,
      status: fortuneStatus(score),
      flow: rotate(flowPool, today.cycleIndex, `${topic}-flow-${today.element}-${group}`),
      advice: rotate(advicePool, today.cycleIndex, `${topic}-advice-${today.element}-${group}`),
      caution: rotate(cautionPool, today.cycleIndex, `${topic}-caution-${today.element}-${group}`),
      mbtiNote,
    };
  }

  return result;
}

/* ── 오늘 조심할 것 ─────────────────────────────────────── */

const REL_LABEL: Record<Relation, string> = {
  도움: "힘을 보태는 쪽",
  같음: "같은 결",
  보탬: "내가 내주는 쪽",
  버팀: "눌러 오는 쪽",
  누름: "내가 누르는 쪽",
};

/**
 * 오늘 조심할 것 — 일진(천간·지지)이 내 일간과 맺는 관계와 타고난 오행의 과다·부족을
 * 근거로 축을 고르고, 그 축의 문장을 60갑자 순번으로 돌려 매일 다르게 만든다.
 * 불안을 키우는 말 대신 '무엇을 조심하고 무엇을 바로 피할지'만 짧게 준다.
 */
function cautionOf(
  chart: Chart,
  today: DayEnergy,
  deficiency: Deficiency,
  group: AgeGroup,
): CautionView {
  const dayMaster = chart.dayMaster;
  const stemRel = relationOf(today.element, dayMaster);
  const branchRel = relationOf(today.branchElement, dayMaster);
  const weak = deficiency.lead;
  const weakCount = chart.counts[weak];
  const strong = chart.strongest;
  const strongCount = chart.counts[strong];

  // 부족한 오행을 오늘 기운이 극하면 가장 뾰족한 주의점이 된다.
  const clash = weakCount <= 1 && (CONTROLS[today.element] === weak || CONTROLS[today.branchElement] === weak);

  let axis: CautionAxis;
  if (clash) axis = "clash";
  else if (stemRel === "버팀" || branchRel === "버팀") axis = "press";
  else if (stemRel === "누름" || branchRel === "누름") axis = "control";
  else if (strongCount >= 4 || (strongCount >= 3 && (stemRel === "같음" || branchRel === "같음"))) axis = "over";
  else if (stemRel === "보탬" || branchRel === "보탬") axis = "drain";
  else axis = "ease";

  const copy = rotate(CAUTION_BOX[axis], today.cycleIndex, `caution-${axis}`);
  const fill = (text: string) => text.replace(/\{weak\}/g, elName(weak)).replace(/\{today\}/g, elName(today.element));

  const clashNote = `부족한 ${elName(weak)} 기운을 오늘 ${elName(today.element)} 기운이 누르고 있어요.`;
  const basis = isSajuDeep(group)
    ? `오늘 ${today.pillar}일 — 겉 ${today.stem}(${ELEMENT_HANJA[today.element]})·바탕 ${today.branch}(${ELEMENT_HANJA[today.branchElement]}). 내 ${elName(dayMaster)} 일간에는 겉이 ‘${stemRel}’으로, 바탕이 ‘${branchRel}’으로 닿고, 타고난 ${elName(strong)} 기운은 ${strongCount}개·${elName(weak)} 기운은 ${weakCount}개예요.${clash ? ` ${clashNote}` : ""}`
    : `오늘 ${today.pillar}일 — 겉 ${elName(today.element)}, 바탕 ${elName(today.branchElement)}. 내 ${elName(dayMaster)} 일간에는 겉이 ‘${REL_LABEL[stemRel]}’으로, 바탕이 ‘${REL_LABEL[branchRel]}’으로 닿아요. ${clash ? clashNote : `타고난 ${elName(weak)} 기운은 ${weakCount}개예요.`}`;

  return { axis, caution: fill(copy.caution), avoid: fill(copy.avoid), basis };
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

function resolveQuest(
  quest: Quest,
  badge: ResolvedQuest["badge"],
  element: Element,
  mbti: Mbti | null,
  tone: "leaf" | "gold",
): ResolvedQuest {
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

/** 오늘 들어온 천간·지지가 내 부족한 오행을 채워 주는지 짧게 짚어 준다. */
function supportLine(today: DayEnergy, target: Element): string | null {
  const layers = [
    { label: "겉기운", char: today.stem, element: today.element },
    { label: "바탕기운", char: today.branch, element: today.branchElement },
  ];
  const same = layers.find((layer) => layer.element === target);
  if (same) {
    return `오늘 들어온 ${same.label} ${same.char}의 ${elName(target)} 기운이 그 부족을 채워 주는 날이에요.`;
  }
  const feeds = layers.find((layer) => GENERATES[layer.element] === target);
  if (feeds) {
    return `오늘 들어온 ${feeds.label} ${feeds.char}의 ${elName(feeds.element)} 기운이 그 부족을 살려 주는 날이에요.`;
  }
  const drains = layers.find((layer) => GENERATES[target] === layer.element);
  if (drains) {
    return `오늘 ${drains.label} ${drains.char}의 ${elName(drains.element)} 쪽으로 ${elName(target)} 기운이 새어 나가니, 조금 아껴 쓰세요.`;
  }
  return null;
}

export function buildDaily(profile: Profile, now: Date = new Date()): DailyView {
  const key = dateKey(now);
  const ageGroup = ageGroupOf(profile.birth, now);
  const deep = isSajuDeep(ageGroup);
  const senior = isSenior(ageGroup);
  const mbti = profile.mbti;
  // 65세 이상은 사주 90% — 성향을 골라도 사주 점수·퀘스트는 그대로 두고 한 줄만 곁들인다.
  const mbtiSeed = mbti && !senior ? mbti : "saju";
  const chart = chartOf(profile);
  const today = todayEnergy(now);
  const deficiency = deficiencyOf(chart, key);
  const { pair, lead } = deficiency;

  // Quest 1 — 부족한 오행 하나, 또는 두 오행을 함께 채우는 복합 퀘스트
  const comboKey = pair ? comboKeyOf(pair[0], pair[1]) : null;
  const q1Pool = comboKey ? COMBO_QUESTS[comboKey] : ELEMENT_QUESTS[lead];
  const q1 = pick(q1Pool, `${key}-q1-${comboKey ?? lead}-${mbtiSeed}`);

  // Quest 2 — MBTI 성향에 맞춘 행동. Quest 1과 같은 행동은 피한다.
  // MBTI 없이 사주 중심으로 시작한 경우에는 다음으로 부족한 오행을 채우는 퀘스트를 준다.
  // 65세 이상은 성향을 골라도 두 퀘스트 모두 오행 기반으로 두고, 성향은 참고 한 줄로만 쓴다.
  let q2: Quest;
  if (mbti && !senior) {
    const q2Pool = MBTI_QUESTS[mbti];
    const q2Candidates = q2Pool.filter((q) => q.action !== q1.action);
    q2 = pick(q2Candidates.length > 0 ? q2Candidates : q2Pool, `${key}-q2-${mbti}`);
  } else {
    const second =
      [...ELEMENTS]
        .filter((el) => !(pair ?? [lead]).includes(el))
        .sort((a, b) => chart.counts[a] - chart.counts[b] || ELEMENTS.indexOf(a) - ELEMENTS.indexOf(b))[0] ?? lead;
    const pool = ELEMENT_QUESTS[second];
    const candidates = pool.filter((q) => q.action !== q1.action);
    q2 = pick(candidates.length > 0 ? candidates : pool, `${key}-q2-${second}-saju`);
  }

  // 주제별 지수를 먼저 내고, 그 평균으로 종합 지수를 잡는다 — 카테고리가 움직이면 종합도 따라 움직인다.
  const stableSeed = `${profile.birth.year}${profile.birth.month}${profile.birth.day}-${mbtiSeed}`;
  const topicSeed = `${key}-${mbtiSeed}`;
  const scoresOn = (date: Date) => {
    const dateKeyOf = dateKey(date);
    return topicScores(
      todayEnergy(date),
      chart.dayMaster,
      `${dateKeyOf}-${mbtiSeed}`,
      stableSeed,
    );
  };
  const shiftDate = (date: Date, delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    return next;
  };
  /** 어제와 같은 숫자가 그대로 나오지 않게, 같으면 1점만 밀어 준다. */
  const keepDifferent = (current: Record<FortuneTopic, number>, previous: Record<FortuneTopic, number>) => {
    const moved = {} as Record<FortuneTopic, number>;
    for (const topic of TOPIC_KEYS) {
      let value = current[topic];
      if (value === previous[topic]) value = value < 97 ? value + 1 : value - 1;
      moved[topic] = value;
    }
    const spread = spreadTopics(moved);
    // 자리 벌림이 밀어낸 1점을 마지막으로 한 번 더 확인한다.
    for (const topic of TOPIC_KEYS) {
      if (spread[topic] !== previous[topic]) continue;
      const taken = (value: number) => TOPIC_KEYS.some((other) => other !== topic && spread[other] === value);
      const spreadOk = (value: number) =>
        TOPIC_KEYS.every((other) => other === topic || Math.abs(spread[other] - value) >= 3);
      if (spread[topic] < 97 && !taken(spread[topic] + 1) && spreadOk(spread[topic] + 1)) spread[topic] += 1;
      else if (spread[topic] > 55 && !taken(spread[topic] - 1) && spreadOk(spread[topic] - 1)) spread[topic] -= 1;
    }
    return spread;
  };

  const prevDate = shiftDate(now, -1);
  const prevKey = dateKey(prevDate);
  const prevToday = todayEnergy(prevDate);
  const yesterday = keepDifferent(scoresOn(prevDate), scoresOn(shiftDate(now, -2)));
  const finalScores = keepDifferent(scoresOn(now), yesterday);
  const topics = buildTopicFortunes(mbti, ageGroup, today, finalScores, topicSeed);
  const caution = cautionOf(chart, today, deficiency, ageGroup);

  let score = overallScore(finalScores, today, topicSeed);
  if (score === overallScore(yesterday, prevToday, `${prevKey}-${mbtiSeed}`)) {
    score = score < 97 ? score + 1 : score - 1;
  }

  const relation = relationOf(today.element, chart.dayMaster);
  const balanceLine = (() => {
    if (pair) {
      const [a, b] = pair;
      const pa = elementPercent(chart.counts[a], chart.total);
      const pb = elementPercent(chart.counts[b], chart.total);
      const head = (() => {
        if (pa === 0 && pb === 0) {
          if (deficiency.zeros.length > 2) {
            return `타고난 기운에서 ${deficiency.zeros.map(elName).join("·")} — 모두 0%로 비어 있는데, 그중 ${elName(a)}와 ${elName(b)}를 먼저 채워 볼까요?`;
          }
          return `타고난 기운에서 ${elName(a)}·${elName(b)}가 0%로 함께 비어 있어요.`;
        }
        if (pa === 0) return `타고난 기운에서 ${elName(a)} 0% · ${elName(b)} ${pb}%로 가장 적은 축이에요.`;
        return `타고난 기운에서 ${elName(a)} ${pa}% · ${elName(b)} ${pb}%로 가장 적은 축이에요.`;
      })();
      const link = supportLine(today, a) ?? supportLine(today, b);
      return link
        ? `${head} ${link}`
        : `${head} 오늘 ${today.pillar}일의 기운은 이쪽으로 크게 기울지 않으니, 작은 행동으로 직접 채워 보세요.`;
    }
    const pct = elementPercent(chart.counts[lead], chart.total);
    const head = `타고난 ${elName(lead)} 기운이 ${pct}%로 가장 적어요.`;
    const link = supportLine(today, lead);
    return link
      ? `${head} ${link}`
      : `${head} 오늘 ${today.pillar}일은 이쪽으로 기울지 않으니, ${ELEMENT_WHY[lead]}`;
  })();

  // 겉기운(천간)과 바탕기운(지지)을 함께 이야기한다 — 오행이 연이틀 같아도 간지가 달라 문장이 달라진다.
  const weatherLine = (() => {
    const stemPhrase = rotate(TODAY_MOOD[today.element], today.cycleIndex, `stem-${today.element}`);
    if (today.element === today.branchElement) {
      return `${today.pillar}일, 겉과 바탕이 모두 ${stemPhrase}으로 채워진 하루예요.`;
    }
    const branchPhrase = rotate(BRANCH_MOOD[today.branchElement], today.cycleIndex, `branch-${today.branchElement}`);
    return `${today.pillar}일, 겉으로는 ${stemPhrase}이, 바탕으로는 ${branchPhrase}이 도는 날이에요.`;
  })();

  const reading = [
    weatherLine,
    `${elName(chart.dayMaster)} 일간인 나, ${rotate(RELATION_PHRASE[relation], today.cycleIndex, `rel-${relation}`)}`,
    balanceLine,
  ];

  // 46세 이후에는 일진의 겉·바탕이 내 일간에 어떻게 닿는지 한 겹 더 풀어 준다.
  if (deep) {
    const stemRel = relationOf(today.element, chart.dayMaster);
    const branchRel = relationOf(today.branchElement, chart.dayMaster);
    const stemDepth = rotate(STEM_DEPTH[stemRel], today.cycleIndex, `stem-depth-${stemRel}`);
    const branchDepth = rotate(BRANCH_DEPTH[branchRel], today.cycleIndex, `branch-depth-${branchRel}`);
    reading.push(
      `한 겹 더 보면, 겉의 ${today.stem} ${elName(today.element)} 기운은 ${stemDepth} 바탕의 ${today.branch} ${elName(today.branchElement)} 기운은 ${branchDepth}`,
    );
    reading.push(
      `타고난 ${elName(chart.strongest)} 기운이 ${chart.counts[chart.strongest]}개로 가장 두껍고, ${elName(lead)} 기운은 ${chart.counts[lead]}개로 가장 얇아요. ${rotate(WEAK_DAY_TIP[lead], today.cycleIndex, `weak-${lead}`)}`,
    );
  }

  // 46세 이후 종합 풀이의 마지막 한 줄 — 사주 70 : 성향 30의 비율을 한 문장으로 만든다.
  // 65세 이상은 사주 90 : 성향 10에 맞춰 짧게 곁들인다.
  let mbtiLine: string | null = null;
  if (deep && mbti) {
    const styleLetter = (hash(`${key}-${mbti}-line-style`) % 2 === 0 ? mbti[0] : mbti[1]) as keyof typeof MBTI_STYLE;
    const hint = MBTI_DAY_HINT[styleLetter][today.element];
    if (senior) {
      mbtiLine = `가볍게 — ${mbti} 성향으로는 ${hint}`;
    } else {
      const tipLetter = (hash(`${key}-${mbti}-line-tip`) % 2 === 0 ? mbti[2] : mbti[3]) as keyof typeof MBTI_DAY_TIP;
      mbtiLine = `${MBTI_STYLE[styleLetter]} ${hint} ${MBTI_DAY_TIP[tipLetter]}`;
    }
    reading.push(mbtiLine);
  }

  const charmContent = charmForDate(key, today.element);

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
    ageGroup,
    mbti,
    mbtiLine,
    chart,
    today,
    score,
    scoreLabel: scoreLabel(score),
    scoreStatus: fortuneStatus(score),
    scoreCaption: scoreLabel(score),
    balance,
    reading,
    caution,
    topics,
    quests: [
      resolveQuest(q1, "Quest 1", focus[0], mbti, "leaf"),
      resolveQuest(q2, "Quest 2", q2.elements[0] ?? focus[0], mbti, "gold"),
    ],
    focus,
    charm: {
      id: charmContent.id,
      element: today.element,
      title: charmContent.title,
      quote: charmContent.quote,
      author: charmContent.author,
      colorName: charmContent.colorName,
      number: charmContent.number,
      item: charmContent.item,
    },
  };
}
