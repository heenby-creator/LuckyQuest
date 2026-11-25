/**
 * Lucky Quest 전수 검증.
 *
 * 1) 퀘스트 데이터 구조·문구 검사 (제목/설명/이유 문장의 길이·형태·1:1 정합성)
 * 2) 실제 사주 오행 분포 전수에 대한 매칭 검사 (복합 결핍 우선, Quest 1·2 중복 방지)
 *
 * 실행: npm run verify
 */
import {
  CHARM_POOL,
  COMBO_QUESTS,
  ELEMENT_QUESTS,
  MBTI_QUESTS,
  BRANCH_MOOD,
  RELATION_PHRASE,
  TODAY_MOOD,
  charmForDate,
  comboKeyOf,
  fortuneTabs,
  topicLabel,
  type ComboKey,
  type Quest,
} from "../lib/content";
import { ageGroupForYear, type AgeGroup } from "../lib/age";
import { buildDaily, deficiencyOf } from "../lib/engine";
import { ELEMENTS, computeChart } from "../lib/saju";
import { cardForDate } from "../lib/share";
import type { BirthTime, Element, Mbti, Profile } from "../lib/types";

const MBTI_TYPES: Mbti[] = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const COMBO_PAIRS: ComboKey[] = [
  "목+화", "목+토", "목+금", "목+수",
  "화+토", "화+금", "화+수",
  "토+금", "토+수", "금+수",
];

const failures: string[] = [];
const warnings: string[] = [];
let checks = 0;

function fail(message: string) {
  failures.push(message);
}

function expect(condition: boolean, message: string) {
  checks += 1;
  if (!condition) fail(message);
}

const compact = (s: string) => s.replace(/\s+/g, "");

/** 제목에서 뜻이 있는 2글자 조각을 뽑는다. (조사·한 글자 토막 제외) */
function titleTokens(title: string): string[] {
  return title
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .map((token) => token.slice(0, 2));
}

const ELEMENT_MARKERS = (el: Element) => [
  `${el} 기운`,
  `${el}은`,
  `${el}는`,
  `${el}이 `,
  `${el}가 `,
  `${el}와`,
  `${el}과`,
  `${el},`,
  `${el}의`,
  `(${el})`,
];

function mentionsElement(text: string, el: Element): boolean {
  return ELEMENT_MARKERS(el).some((marker) => text.includes(marker)) || text.includes(`${el}와 ${el}`);
}

function allQuests(): { quest: Quest; pool: string }[] {
  const list: { quest: Quest; pool: string }[] = [];
  for (const el of ELEMENTS) {
    for (const quest of ELEMENT_QUESTS[el]) list.push({ quest, pool: `오행 ${el}` });
  }
  for (const key of COMBO_PAIRS) {
    for (const quest of COMBO_QUESTS[key]) list.push({ quest, pool: `복합 ${key}` });
  }
  for (const mbti of MBTI_TYPES) {
    for (const quest of MBTI_QUESTS[mbti]) list.push({ quest, pool: `MBTI ${mbti}` });
  }
  return list;
}

/* ── 1. 데이터 구조·문구 검사 ───────────────────────────── */

console.log("① 퀘스트 데이터 검사");

for (const el of ELEMENTS) {
  expect(ELEMENT_QUESTS[el].length === 10, `오행 ${el} 퀘스트가 10개가 아니에요 (${ELEMENT_QUESTS[el].length})`);
}
for (const key of COMBO_PAIRS) {
  expect(COMBO_QUESTS[key].length >= 4, `복합 ${key} 퀘스트가 4개보다 적어요 (${COMBO_QUESTS[key].length})`);
}
for (const mbti of MBTI_TYPES) {
  expect(MBTI_QUESTS[mbti].length === 8, `MBTI ${mbti} 퀘스트가 8개가 아니에요 (${MBTI_QUESTS[mbti].length})`);
}

const all = allQuests();
const ids = new Map<string, Quest>();
const titles = new Map<string, string>();

for (const { quest, pool } of all) {
  const where = `${pool} / ${quest.id}`;

  expect(!ids.has(quest.id), `퀘스트 id가 중복돼요: ${quest.id}`);
  ids.set(quest.id, quest);

  const title = compact(quest.title);
  expect(title.length >= 5 && title.length <= 18, `${where}: 제목 길이가 어색해요 (${title.length}자) "${quest.title}"`);
  expect(/기$/.test(quest.title.trim()), `${where}: 제목이 '~하기' 형태로 끝나지 않아 잘린 듯 보여요 "${quest.title}"`);
  expect(!/[….·]{1,}|\.\.\./.test(quest.title), `${where}: 제목에 말줄임표가 있어요 "${quest.title}"`);
  expect(quest.desc.trim().endsWith("요."), `${where}: 설명이 '~요.'로 끝나지 않아요 "${quest.desc}"`);
  expect(compact(quest.desc).length >= 15 && compact(quest.desc).length <= 60, `${where}: 설명 길이가 어색해요 (${compact(quest.desc).length}자)`);
  expect(quest.why.trim().endsWith("요."), `${where}: 이유 문장이 '~요.'로 끝나지 않아요 "${quest.why}"`);
  expect(compact(quest.why).length >= 25 && compact(quest.why).length <= 95, `${where}: 이유 문장 길이가 어색해요 (${compact(quest.why).length}자)`);

  // 제목의 행동이 설명에 실제로 나오는지 (제목과 설명이 따로 놀지 않게)
  const titleInDesc = titleTokens(quest.title).some((token) => compact(quest.desc).includes(token));
  expect(titleInDesc, `${where}: 제목 "${quest.title}"의 행동이 설명에 없어요`);

  // 제목의 행동이 이유 문장에도 이어지는지 (퀘스트 ↔ 이유 1:1)
  const titleInWhy = titleTokens(quest.title).some((token) => compact(quest.why).includes(token));
  expect(titleInWhy, `${where}: 이유 문장이 제목 "${quest.title}"의 행동을 설명하지 않아요 → "${quest.why}"`);

  // 오행·MBTI 근거가 이유 문장에 들어 있는지
  if (pool.startsWith("오행")) {
    const el = pool.slice(3) as Element;
    expect(mentionsElement(quest.why, el), `${where}: 이유 문장에 '${el} 기운' 근거가 없어요 → "${quest.why}"`);
  } else if (pool.startsWith("복합")) {
    for (const el of quest.elements) {
      expect(mentionsElement(quest.why, el), `${where}: 이유 문장에 '${el}' 근거가 없어요 → "${quest.why}"`);
    }
  } else {
    const mbti = pool.slice(5);
    expect(quest.why.includes(mbti), `${where}: 이유 문장에 유형(${mbti})이 없어요 → "${quest.why}"`);
  }

  const dup = titles.get(quest.title);
  if (dup) warnings.push(`같은 제목이 두 번 나와요: "${quest.title}" (${dup} / ${where})`);
  titles.set(quest.title, where);
}

// 이유 문장은 퀘스트마다 고유해야 한다 — 다른 퀘스트의 이유가 붙으면 딴소리가 된다.
const whySeen = new Map<string, string>();
for (const { quest, pool } of all) {
  const dup = whySeen.get(quest.why);
  expect(!dup, `이유 문장이 중복돼요: ${pool} / ${quest.id} ↔ ${dup ?? ""}`);
  whySeen.set(quest.why, `${pool} / ${quest.id}`);
}

// 복합 퀘스트는 반드시 두 오행을 함께 담는다.
for (const key of COMBO_PAIRS) {
  for (const quest of COMBO_QUESTS[key]) {
    expect(quest.elements.length === 2, `복합 ${key} / ${quest.id}: 오행이 두 개가 아니에요`);
    expect(comboKeyOf(quest.elements[0], quest.elements[1]) === key, `복합 ${key} / ${quest.id}: 두 오행의 키가 맞지 않아요`);
    expect(quest.elements.every((el) => key.includes(el)), `복합 ${key} / ${quest.id}: 다른 오행이 섞였어요`);
  }
}

console.log(`   퀘스트 ${all.length}개 · 검사 ${checks}건 · 문제 ${failures.length}건`);

/* ── 2. 실제 오행 분포 전수 매칭 검사 ────────────────────── */

console.log("② 실제 사주 오행 분포 전수 매칭 검사");

interface Sample {
  birth: { year: number; month: number; day: number; isLunar: boolean; isLeapMonth: boolean };
  time: BirthTime;
  counts: Record<Element, number>;
  total: number;
}

// 실제 만세력 계산으로 나올 수 있는 오행 분포를 모두 모은다.
const samples = new Map<string, Sample>();
for (let year = 1950; year <= 2008; year += 2) {
  for (let month = 1; month <= 12; month += 1) {
    for (const day of [1, 8, 15, 22]) {
      for (const time of [
        { kind: "unknown" } as BirthTime,
        { kind: "exact", hour: 1, minute: 0 } as BirthTime,
        { kind: "exact", hour: 7, minute: 0 } as BirthTime,
        { kind: "exact", hour: 13, minute: 0 } as BirthTime,
        { kind: "exact", hour: 19, minute: 0 } as BirthTime,
      ]) {
        const chart = computeChart({ year, month, day, isLunar: false, isLeapMonth: false }, time);
        const key = ELEMENTS.map((el) => chart.counts[el]).join("-");
        if (!samples.has(key)) {
          samples.set(key, {
            birth: { year, month, day, isLunar: false, isLeapMonth: false },
            time,
            counts: chart.counts,
            total: chart.total,
          });
        }
      }
    }
  }
}
console.log(`   서로 다른 오행 분포 ${samples.size}가지`);

const DATES = [
  new Date(2026, 10, 24),
  new Date(2026, 10, 25),
  new Date(2026, 11, 1),
  new Date(2026, 0, 6),
  new Date(2026, 5, 21),
  new Date(2026, 8, 9),
];

const questById = new Map(all.map(({ quest }) => [quest.id, quest]));

let cases = 0;
let comboCases = 0;
let singleCases = 0;

for (const sample of samples.values()) {
  const chart = computeChart(sample.birth, sample.time);
  for (const mbti of MBTI_TYPES) {
    const profile: Profile = { birth: sample.birth, time: sample.time, mbti, createdAt: "2026-11-24T00:00:00.000Z" };
    for (const now of DATES) {
      const daily = buildDaily(profile, now);
      const [q1, q2] = daily.quests;
      const deficiency = deficiencyOf(chart, daily.dateKey);
      const zeros = deficiency.zeros;
      cases += 1;

      const label = `[${ELEMENTS.map((el) => `${el}${sample.counts[el]}`).join(" ")} | ${mbti} | ${daily.dateKey}]`;

      // Quest 1은 반드시 결핍 오행을 향한다.
      if (deficiency.pair) {
        comboCases += 1;
        expect(q1.elements.join("+") === deficiency.pair.join("+"), `${label}: 두 기운(${deficiency.pair.join("+")})을 함께 채우는 복합 퀘스트가 아니에요 (${q1.title})`);
        expect(q1.elements.length === 2, `${label}: 복합 퀘스트의 오행이 두 개가 아니에요 (${q1.title})`);
        if (zeros.length >= 2) {
          expect(q1.elements.every((el) => zeros.includes(el)), `${label}: 0인 오행(${zeros.join(",")}) 대신 ${q1.elements.join("+")}를 골랐어요`);
        } else if (zeros.length === 1) {
          expect(q1.elements.includes(zeros[0]), `${label}: 0인 ${zeros[0]} 기운이 빠졌어요 (${q1.elements.join("+")})`);
        }
      } else {
        singleCases += 1;
        expect(q1.elements.length === 1, `${label}: 한 기운만 부족한데 복합 퀘스트가 나왔어요 (${q1.elements.join("+")})`);
        expect(q1.elements[0] === deficiency.lead, `${label}: 가장 적은 오행(${deficiency.lead})과 퀘스트(${q1.elements[0]})가 달라요`);
      }

      // 이유 문장은 그 퀘스트의 고유 문장이어야 한다.
      const q1Source = questById.get(q1.id);
      const q2Source = questById.get(q2.id);
      expect(Boolean(q1Source && q2Source), `${label}: 퀘스트를 풀에서 찾지 못했어요`);
      expect(q1.why === q1Source?.why, `${label}: Quest 1 이유가 퀘스트 고유 문장과 달라요`);
      expect(q2.why === q2Source?.why, `${label}: Quest 2 이유가 퀘스트 고유 문장과 달라요`);
      expect(q1.why.includes(q1.title) || titleTokens(q1.title).some((token) => q1.why.includes(token)), `${label}: Quest 1 이유가 제목과 따로 놀아요`);
      if (daily.ageGroup === "senior") {
        // 65세 이상은 성향을 골라도 Quest 1·2 모두 오행 기반이다.
        expect(q2Source?.elements.length === 1, `${label}: 65세 이상 Quest 2가 오행 퀘스트가 아니에요`);
        expect(q2.why.includes(q2.elements[0]), `${label}: 65세 이상 Quest 2 이유에 오행 근거가 없어요`);
      } else {
        expect(q2.why.includes(mbti), `${label}: Quest 2 이유에 유형이 없어요`);
        expect(q2Source?.elements.length === 0, `${label}: Quest 2가 오행 퀘스트예요`);
      }

      // 같은 행동이 두 카드에 겹치지 않는다.
      expect(q1.action !== q2.action, `${label}: Quest 1·2의 행동이 겹쳐요 (${q1.action} / ${q2.title})`);
      expect(q1.id !== q2.id, `${label}: Quest 1·2가 같은 퀘스트예요`);

      // 화면에 쓰는 값
      expect(daily.focus.join("+") === q1.elements.join("+"), `${label}: focus와 Quest 1 오행이 달라요`);
      if (deficiency.pair) {
        expect(
          daily.reading[2].includes(deficiency.pair[0]) && daily.reading[2].includes(deficiency.pair[1]),
          `${label}: 리딩이 함께 채울 두 오행을 알려주지 않아요 → ${daily.reading[2]}`,
        );
      }
      if (zeros.length >= 3) {
        expect(
          zeros.every((el) => daily.reading[2].includes(el)),
          `${label}: 0인 오행(${zeros.join(",")})을 리딩이 다 알려주지 않아요 → ${daily.reading[2]}`,
        );
      }
    }
  }
}

console.log(`   매칭 케이스 ${cases}건 (복합 결핍 ${comboCases} · 단일 ${singleCases}) · 문제 ${failures.length}건`);

/* ── 3. 경달 님이 짚으신 실제 사례 ───────────────────────── */

console.log("③ 실제 사례 확인");

function sampleFor(predicate: (counts: Record<Element, number>) => boolean): Sample {
  for (const sample of samples.values()) {
    if (predicate(sample.counts)) return sample;
  }
  throw new Error("조건에 맞는 사주 분포를 찾지 못했어요");
}

// 화·수가 모두 0인 사주
const fireWater = sampleFor((counts) => counts["화"] === 0 && counts["수"] === 0);
const fwProfile: Profile = { birth: fireWater.birth, time: fireWater.time, mbti: "INFP", createdAt: "2026-11-24T00:00:00.000Z" };
const fwDaily = buildDaily(fwProfile, new Date(2026, 10, 24));
console.log(`   · 화·수 0 사주 (${fireWater.birth.year}.${fireWater.birth.month}.${fireWater.birth.day}):`);
console.log(`     리딩 — ${fwDaily.reading[2]}`);
console.log(`     Quest 1 — ${fwDaily.quests[0].title} (${fwDaily.quests[0].elements.join("+")})`);
console.log(`     이유 — ${fwDaily.quests[0].why}`);
console.log(`     Quest 2 — ${fwDaily.quests[1].title}`);
console.log(`     이유 — ${fwDaily.quests[1].why}`);
expect(fwDaily.quests[0].elements.join("+") === "화+수", "화·수 0 사주에서 화+수 복합 퀘스트가 나오지 않았어요");

// 경달 님 사주 (1968-11-28, 시간 모름)
const kdProfile: Profile = {
  birth: { year: 1968, month: 11, day: 28, isLunar: false, isLeapMonth: false },
  time: { kind: "unknown" },
  mbti: "INFP",
  createdAt: "2026-11-24T00:00:00.000Z",
};
const kdDaily = buildDaily(kdProfile, new Date(2026, 10, 24));
console.log(`   · 경달 님 사주 (1968-11-28, 시간 모름): ${ELEMENTS.map((el) => `${el}${kdDaily.chart.counts[el]}`).join(" ")}`);
console.log(`     리딩 — ${kdDaily.reading[2]}`);
console.log(`     Quest 1 — ${kdDaily.quests[0].title} (${kdDaily.quests[0].elements.join("+")})`);
console.log(`     이유 — ${kdDaily.quests[0].why}`);
console.log(`     Quest 2 — ${kdDaily.quests[1].title}`);
console.log(`     이유 — ${kdDaily.quests[1].why}`);

// 날짜가 바뀌면 퀘스트도 바뀌는지
const variety = new Set<string>();
for (let day = 1; day <= 60; day += 1) {
  const daily = buildDaily(fwProfile, new Date(2026, 10, day));
  variety.add(daily.quests[0].id);
}
console.log(`   · 60일 동안 화·수 복합 퀘스트 ${variety.size}종`);
expect(variety.size >= 3, "복합 퀘스트가 날마다 거의 바뀌지 않아요");

/* ── 4. 오늘의 행운 카드 · 주제별 운세 검사 ───────────────── */

console.log("④ 오늘의 행운 카드 · 주제별 운세 검사");

const FATE_STATUSES = new Set(["아주 좋은 흐름", "흐름 좋음", "무난한 하루", "차분히 챙기기", "천천히 가기"]);
const allCards = ELEMENTS.flatMap((el) => CHARM_POOL[el]);

for (const el of ELEMENTS) {
  expect(CHARM_POOL[el].length >= 3, `오행 ${el} 행운 카드가 3장보다 적어요 (${CHARM_POOL[el].length})`);
  for (const card of CHARM_POOL[el]) {
    expect(card.element === el, `카드 ${card.id}: 오행이 ${el}이 아니에요`);
  }
}
expect(allCards.length >= 15, `행운 카드가 15장보다 적어요 (${allCards.length})`);

const cardIds = new Set<string>();
const cardTitles = new Set<string>();
for (const card of allCards) {
  const where = `카드 ${card.id}`;
  expect(!cardIds.has(card.id), `카드 id가 중복돼요: ${card.id}`);
  cardIds.add(card.id);
  expect(!cardTitles.has(card.title), `카드 제목이 중복돼요: ${card.title}`);
  cardTitles.add(card.title);
  expect(compact(card.title).length >= 3 && compact(card.title).length <= 10, `${where}: 제목(키워드) 길이가 어색해요 (${card.title})`);
  expect(card.quote.trim().length >= 8 && card.quote.trim().length <= 60, `${where}: 명언 길이가 어색해요 (${card.quote})`);
  expect(!card.quote.includes('"') && !card.quote.includes("“"), `${where}: 명언에 따옴표가 들어 있어요 (${card.quote})`);
  expect(card.author.trim().length >= 1, `${where}: 명언 저자가 비어 있어요`);
  expect(card.colorName.trim().length >= 2, `${where}: 행운의 색이 비어 있어요`);
  expect(card.item.trim().length >= 2, `${where}: 행운의 아이템이 비어 있어요`);
  const number = Number(card.number);
  expect(Number.isInteger(number) && number >= 1 && number <= 10, `${where}: 행운의 숫자가 1~10이 아니에요 (${card.number})`);
}

// 날짜가 바뀌면 카드도 달라져야 한다.
for (const el of ELEMENTS) {
  const seen = new Set<string>();
  for (let day = 1; day <= 60; day += 1) {
    const key = `2026-${day <= 30 ? "11" : "12"}-${String(day <= 30 ? day : day - 30).padStart(2, "0")}`;
    seen.add(charmForDate(key, el).id);
  }
  expect(seen.size >= 3, `오행 ${el} 카드가 날마다 거의 바뀌지 않아요 (${seen.size}종)`);
}

// 앱과 공유 페이지(/card/[날짜], OG)가 같은 카드를 봐야 한다.
const SHARE_DAYS = [1, 7, 16, 24, 30];
for (const day of SHARE_DAYS) {
  const key = `2026-11-${String(day).padStart(2, "0")}`;
  const daily = buildDaily(kdProfile, new Date(2026, 10, day));
  const shared = cardForDate(key);
  expect(shared.cardId === daily.charm.id, `[${key}] 공유 카드(${shared.cardId})와 앱 카드(${daily.charm.id})가 달라요`);
  expect(shared.quote === daily.charm.quote, `[${key}] 공유 카드의 명언이 앱과 달라요`);
  expect(shared.item === daily.charm.item, `[${key}] 공유 카드의 아이템이 앱과 달라요`);
}

// 주제별 지수 · 상태 배지 · 두 줄 설명
for (const now of DATES) {
  const daily = buildDaily(kdProfile, now);
  expect(daily.score >= 55 && daily.score <= 97, `[${daily.dateKey}] 종합 지수가 55~97을 벗어났어요 (${daily.score})`);
  expect(FATE_STATUSES.has(daily.scoreStatus), `[${daily.dateKey}] 종합 상태 배지가 이상해요 (${daily.scoreStatus})`);
  for (const topic of ["money", "love", "work"] as const) {
    const fortune = daily.topics[topic];
    const label = `[${daily.dateKey} ${topic}]`;
    expect(Number.isInteger(fortune.score) && fortune.score >= 55 && fortune.score <= 97, `${label}: 지수가 55~97을 벗어났어요 (${fortune.score})`);
    expect(FATE_STATUSES.has(fortune.status), `${label}: 상태 배지가 이상해요 (${fortune.status})`);
    expect(fortune.flow.trim().endsWith("요."), `${label}: 흐름 문장이 '~요.'로 끝나지 않아요 (${fortune.flow})`);
    expect(compact(fortune.flow).length >= 12 && compact(fortune.flow).length <= 45, `${label}: 흐름 문장 길이가 어색해요 (${compact(fortune.flow).length}자)`);
    expect(fortune.advice.trim().length >= 20 && fortune.advice.trim().length <= 90, `${label}: 조언 문장 길이가 어색해요 (${fortune.advice})`);
    expect(Boolean(fortune.mbtiNote && fortune.mbtiNote.includes("편이라")), `${label}: 성향 한마디가 비어 있어요`);
  }
}

console.log(`   카드 ${allCards.length}장(오행별 ${ELEMENTS.map((el) => CHARM_POOL[el].length).join("/")}) · 검사 ${checks}건 · 문제 ${failures.length}건`);

/* ── ⑤ 연속 7일 변별력 검사 ────────────────────────────── */

console.log("⑤ 연속 7일 변별력 검사 (2026-11-23 ~ 11-29)");

// 문장 풀 크기·중복
for (const el of ELEMENTS) {
  expect(TODAY_MOOD[el].length >= 5, `천간 문장 풀이 ${el} 5개보다 적어요 (${TODAY_MOOD[el].length})`);
  expect(new Set(TODAY_MOOD[el]).size === TODAY_MOOD[el].length, `천간 ${el} 문장이 중복돼요`);
  expect(BRANCH_MOOD[el].length >= 4, `지지 문장 풀이 ${el} 4개보다 적어요 (${BRANCH_MOOD[el].length})`);
  expect(new Set(BRANCH_MOOD[el]).size === BRANCH_MOOD[el].length, `지지 ${el} 문장이 중복돼요`);
}
for (const relation of ["도움", "같음", "보탬", "버팀", "누름"] as const) {
  expect(RELATION_PHRASE[relation].length >= 4, `관계 문장 풀이 ${relation} 4개보다 적어요`);
  expect(new Set(RELATION_PHRASE[relation]).size === RELATION_PHRASE[relation].length, `관계 ${relation} 문장이 중복돼요`);
}

const streakProfiles: { name: string; profile: Profile }[] = [
  { name: "경달 님", profile: kdProfile },
  { name: "화·수 0 사주", profile: fwProfile },
  { name: "목·수 부족 사주", profile: { birth: { year: 1988, month: 12, day: 5, isLunar: false, isLeapMonth: false }, time: { kind: "jin", index: 5 }, mbti: "ESFJ", createdAt: "2026-11-24T00:00:00.000Z" } },
  { name: "목 과다 사주", profile: { birth: { year: 1975, month: 3, day: 10, isLunar: false, isLeapMonth: false }, time: { kind: "exact", hour: 7, minute: 0 }, mbti: "INTJ", createdAt: "2026-11-24T00:00:00.000Z" } },
];

for (const { name, profile } of streakProfiles) {
  let prev: ReturnType<typeof buildDaily> | null = null;
  console.log(`   · ${name}`);
  for (let day = 23; day <= 29; day += 1) {
    const daily = buildDaily(profile, new Date(2026, 10, day));
    const t = daily.topics;
    const scores = [t.money.score, t.love.score, t.work.score];
    const label = `[${name} ${daily.dateKey}]`;

    expect(new Set(scores).size === 3, `${label}: 세 주제 지수가 겹쳐요 (${scores.join("/")})`);
    expect(Math.max(...scores) - Math.min(...scores) >= 3, `${label}: 세 주제 지수 차이가 3점 미만이에요 (${scores.join("/")})`);
    expect(daily.score >= 55 && daily.score <= 97, `${label}: 종합 지수가 55~97을 벗어나요 (${daily.score})`);
    expect(daily.reading[0].includes(daily.today.pillar), `${label}: 날씨줄에 그날 간지가 없어요 → ${daily.reading[0]}`);
    expect(daily.reading[0].includes(daily.today.element), `${label}: 날씨줄에 천간 오행이 없어요 → ${daily.reading[0]}`);
    expect(daily.reading[0].includes(daily.today.branchElement), `${label}: 날씨줄에 지지 오행이 없어요 → ${daily.reading[0]}`);

    if (prev) {
      const line = daily.score - prev.score;
      for (const i of [0, 1, 2] as const) {
        expect(daily.reading[i] !== prev.reading[i], `${label}: 어제와 같은 ${i + 1}번째 줄이 나왔어요 → ${daily.reading[i]}`);
      }
      for (const topic of ["money", "love", "work"] as const) {
        expect(
          t[topic].score !== prev.topics[topic].score,
          `${label}: 어제와 ${topic} 지수가 같아요 (${t[topic].score})`,
        );
      }
      expect(daily.score !== prev.score, `${label}: 어제와 종합 지수가 같아요 (${daily.score})`);
      console.log(
        `     ${daily.dateKey} ${daily.today.pillar}(${daily.today.element}/${daily.today.branchElement}) 종합 ${daily.score}(${line > 0 ? "+" : ""}${line}) · 재물 ${t.money.score} · 연애 ${t.love.score} · 일 ${t.work.score}`,
      );
    } else {
      console.log(
        `     ${daily.dateKey} ${daily.today.pillar}(${daily.today.element}/${daily.today.branchElement}) 종합 ${daily.score} · 재물 ${t.money.score} · 연애 ${t.love.score} · 일 ${t.work.score}`,
      );
    }
    prev = daily;
  }
}

// 60일 × 여러 사주에서 어제와 같은 줄이 하나도 없는지 마지막으로 훑는다.
let streakDays = 0;
let repeatedLines = 0;
for (const { profile } of streakProfiles) {
  let prev = buildDaily(profile, new Date(2026, 10, 1));
  for (let i = 1; i < 60; i += 1) {
    const daily = buildDaily(profile, new Date(2026, 10, 1 + i));
    streakDays += 1;
    for (const idx of [0, 1, 2] as const) if (daily.reading[idx] === prev.reading[idx]) repeatedLines += 1;
    prev = daily;
  }
}
console.log(`   60일 × ${streakProfiles.length}사주 ${streakDays}회 비교 — 어제와 같은 줄 ${repeatedLines}건`);
console.log(`   검사 ${checks}건 · 문제 ${failures.length}건`);

/* ── ⑥ 3단계 연령 맞춤 · 오늘 조심할 것 ─────────────────── */

console.log("⑥ 3단계 연령 맞춤 · 오늘 조심할 것 검사");

const AGE_NOW = new Date(2026, 10, 25);
const ageCases: { year: number; group: AgeGroup }[] = [
  { year: 2004, group: "young" },
  { year: 1995, group: "young" },
  { year: 1982, group: "young" }, // 45세 — young의 위쪽 경계
  { year: 1981, group: "mature" }, // 46세 — mature의 아래쪽 경계
  { year: 1968, group: "mature" },
  { year: 1963, group: "mature" }, // 64세 — mature의 위쪽 경계
  { year: 1962, group: "senior" }, // 65세 — senior의 아래쪽 경계
  { year: 1958, group: "senior" },
];
for (const item of ageCases) {
  expect(
    ageGroupForYear(item.year, AGE_NOW) === item.group,
    `${item.year}년생 연령대가 ${item.group}가 아니에요 (${ageGroupForYear(item.year, AGE_NOW)})`,
  );
}
expect(ageGroupForYear(1981, new Date(2027, 0, 2)) === "mature", "해가 바뀌면 1981년생은 47세로 mature여야 해요");
expect(ageGroupForYear(1962, new Date(2027, 0, 2)) === "senior", "해가 바뀌면 1962년생은 66세로 senior여야 해요");
expect(topicLabel("love", "young") === "연애·대인", `45세 이하 관계 탭 이름이 이상해요 (${topicLabel("love", "young")})`);
expect(topicLabel("love", "mature") === "대인·관계", `46세 이후 관계 탭 이름이 이상해요 (${topicLabel("love", "mature")})`);
expect(topicLabel("love", "senior") === "대인·관계", `65세 이상 관계 탭 이름이 이상해요 (${topicLabel("love", "senior")})`);
for (const group of ["young", "mature", "senior"] as const) {
  const tabs = fortuneTabs(group);
  expect(tabs.length === 4, `${group} 탭이 4개가 아니에요`);
  expect(tabs[0].label === "종합", `${group} 첫 탭이 종합이 아니에요`);
}

const youngProfile: Profile = {
  birth: { year: 1995, month: 4, day: 12, isLunar: false, isLeapMonth: false },
  time: { kind: "jin", index: 6 },
  mbti: "INFP",
  createdAt: "2026-11-24T00:00:00.000Z",
};
const matureProfile: Profile = {
  birth: { year: 1968, month: 11, day: 28, isLunar: false, isLeapMonth: false },
  time: { kind: "unknown" },
  mbti: "INFP",
  createdAt: "2026-11-24T00:00:00.000Z",
};
const matureNoMbti: Profile = { ...matureProfile, mbti: null };
const seniorProfile: Profile = {
  birth: { year: 1958, month: 3, day: 4, isLunar: false, isLeapMonth: false },
  time: { kind: "unknown" },
  mbti: null,
  createdAt: "2026-11-24T00:00:00.000Z",
};
const seniorWithMbti: Profile = { ...seniorProfile, mbti: "INFP" };

const AXES = new Set(["clash", "press", "control", "over", "drain", "ease"]);
const loveYoung = new Set<string>();
const loveMature = new Set<string>();

for (const profile of [youngProfile, matureProfile, matureNoMbti, seniorProfile, seniorWithMbti]) {
  const who = `${profile.birth.year}년생${profile.mbti ? ` ${profile.mbti}` : " 사주중심"}`;
  const expectedGroup = ageGroupForYear(profile.birth.year, AGE_NOW);
  let prev: ReturnType<typeof buildDaily> | null = null;
  const cautions = new Set<string>();
  const avoIds = new Set<string>();
  const axes = new Set<string>();

  for (let i = 0; i < 60; i += 1) {
    const daily = buildDaily(profile, new Date(2026, 10, 1 + i));
    const label = `[${who} ${daily.dateKey}]`;
    const c = daily.caution;

    expect(daily.ageGroup === expectedGroup, `${label}: 연령대가 잘못 붙었어요 (${daily.ageGroup})`);
    expect(AXES.has(c.axis), `${label}: 주의 축이 이상해요 (${c.axis})`);
    expect(c.caution.trim().length >= 12 && c.caution.trim().length <= 80, `${label}: 주의점 길이가 어색해요 (${c.caution})`);
    expect(c.avoid.trim().length >= 10 && c.avoid.trim().length <= 80, `${label}: 회피 행동 길이가 어색해요 (${c.avoid})`);
    expect(/[요다]$/.test(c.caution.trim().replace(/[.!]$/, "")), `${label}: 주의점이 문장으로 끝나지 않아요 (${c.caution})`);
    expect(/[요다]$/.test(c.avoid.trim().replace(/[.!]$/, "")), `${label}: 회피 행동이 문장으로 끝나지 않아요 (${c.avoid})`);
    expect(!/[{}]/.test(c.caution + c.avoid), `${label}: 주의점에 치환되지 않은 자리표시가 남아 있어요`);
    expect(c.basis.includes(daily.today.pillar), `${label}: 주의 근거에 오늘 간지가 없어요`);
    expect(c.basis.includes(daily.chart.dayMaster), `${label}: 주의 근거에 내 일간이 없어요`);
    expect(c.avoid !== c.caution, `${label}: 주의점과 회피 행동이 같아요`);
    cautions.add(c.caution);
    avoIds.add(c.avoid);
    axes.add(c.axis);

    // 45세 이하 3줄 · 46세 이후 5줄 (사주 깊이 두 줄 추가) + 성향 한 줄(있을 때만)
    const sajuLines = daily.mbtiLine ? daily.reading.length - 1 : daily.reading.length;
    if (daily.ageGroup === "young") {
      expect(sajuLines === 3, `${label}: 45세 이하 리딩이 3줄이 아니에요 (${daily.reading.length})`);
      expect(daily.mbtiLine === null, `${label}: 45세 이하에 성향 한 줄이 붙었어요`);
    } else {
      expect(sajuLines === 5, `${label}: 사주 깊이 풀이가 5줄이 아니에요 (${sajuLines})`);
      expect(
        daily.reading[3].includes(daily.today.stem) && daily.reading[3].includes(daily.today.branch),
        `${label}: 깊이 풀이에 천간·지지가 없어요`,
      );
      expect(
        daily.reading[4].includes(daily.chart.strongest) && daily.reading[4].includes(daily.chart.weakest),
        `${label}: 깊이 풀이에 강한·약한 오행이 없어요`,
      );
      if (prev) expect(daily.reading[3] !== prev.reading[3], `${label}: 어제와 같은 깊이 풀이가 나왔어요`);
    }

    // 46세 이후 종합 풀이 마지막의 성향 한 줄 — 중장년은 1~2문장, 시니어는 가벼운 1줄
    if (daily.mbtiLine) {
      expect(daily.reading[daily.reading.length - 1] === daily.mbtiLine, `${label}: 성향 한 줄이 마지막에 없어요`);
      if (daily.ageGroup === "mature") {
        expect(daily.reading.length === 6, `${label}: 46~64세 리딩이 5줄+성향 1줄이 아니에요 (${daily.reading.length})`);
        expect(!daily.mbtiLine.startsWith("가볍게"), `${label}: 46~64세 성향 한 줄이 보조로만 보여요`);
        expect(daily.mbtiLine.length >= 45, `${label}: 46~64세 성향 한 줄이 너무 짧아요 (${daily.mbtiLine})`);
      } else if (daily.ageGroup === "senior") {
        expect(daily.reading.length === 6, `${label}: 65세 이상 리딩이 5줄+성향 1줄이 아니에요 (${daily.reading.length})`);
        expect(daily.mbtiLine.startsWith("가볍게 — "), `${label}: 65세 이상 성향 한 줄이 가볍게 표시되지 않아요`);
      }
    } else if (daily.mbti && daily.ageGroup !== "young") {
      fail(`${label}: MBTI가 있는데 성향 한 줄이 없어요`);
    }

    if (daily.mbti) {
      for (const topic of ["money", "love", "work"] as const) {
        const note = daily.topics[topic].mbtiNote;
        expect(Boolean(note && note.includes("편이라")), `${label}: ${topic} 성향 한마디가 비어 있어요`);
        if (daily.ageGroup === "mature") {
          expect(Boolean(note && !note.startsWith("가볍게")), `${label}: 46~64세 성향 한마디가 배지용 문장이 아니에요`);
        }
        if (daily.ageGroup === "senior") {
          expect(Boolean(note && note.startsWith("가볍게 — ")), `${label}: 65세 이상 성향 한마디가 보조로 표시되지 않아요`);
        }
      }
    } else {
      for (const topic of ["money", "love", "work"] as const) {
        expect(daily.topics[topic].mbtiNote === null, `${label}: MBTI 없이 시작했는데 성향 한마디가 있어요`);
      }
      const q2 = daily.quests[1];
      expect(q2.elements.length === 1, `${label}: 사주 중심 Quest 2가 오행 퀘스트가 아니에요 (${q2.title})`);
      expect(q2.why.includes(q2.elements[0]), `${label}: 사주 중심 Quest 2 이유에 오행 근거가 없어요`);
    }

    // 65세 이상은 성향을 골라도 Quest 1·2 모두 오행 기반이어야 한다.
    if (daily.ageGroup === "senior") {
      expect(daily.quests[0].elements.length >= 1, `${label}: 65세 이상 Quest 1이 오행 퀘스트가 아니에요`);
      const q2 = daily.quests[1];
      expect(q2.elements.length === 1, `${label}: 65세 이상 Quest 2가 오행 퀘스트가 아니에요 (${q2.title})`);
      expect(q2.why.includes(q2.elements[0]), `${label}: 65세 이상 Quest 2 이유에 오행 근거가 없어요`);
    }

    // 탭 안의 '오늘 조심할 것'도 비어 있으면 안 된다.
    for (const topic of ["money", "love", "work"] as const) {
      expect(daily.topics[topic].caution.trim().length >= 15, `${label}: ${topic} 조심할 것이 비어 있어요`);
    }

    // 46세 이후 '대인·관계'는 연애 대신 직장·가족·거래처 중심
    const love = daily.topics.love;
    if (daily.ageGroup === "young") {
      loveYoung.add(love.flow);
    } else {
      expect(!/연애|썸|데이트/.test(love.flow + love.advice + love.caution), `${label}: 46세 이후 관계 풀이에 연애 표현이 남아 있어요`);
      loveMature.add(love.flow);
    }

    // 연이틀 같은 주의점·회피 행동이 나오면 안 된다.
    if (prev) {
      expect(c.caution !== prev.caution.caution, `${label}: 어제와 같은 주의점이 나왔어요 → ${c.caution}`);
      expect(c.avoid !== prev.caution.avoid, `${label}: 어제와 같은 회피 행동이 나왔어요 → ${c.avoid}`);
    }
    prev = daily;
  }

  console.log(`   · ${who} — 60일 주의점 ${cautions.size}종 · 회피 행동 ${avoIds.size}종 · 축 ${axes.size}종`);
  expect(cautions.size >= 6, `${who}: 60일 주의점이 ${cautions.size}종뿐이에요`);
  expect(axes.size >= 3, `${who}: 주의 축이 ${axes.size}종뿐이에요`);
}

expect(loveYoung.size >= 2 && loveMature.size >= 2, "관계 탭 흐름 문장이 날마다 바뀌지 않아요");
for (const line of loveMature) {
  expect(!loveYoung.has(line), `45세 이하와 46세 이후의 관계 흐름이 같은 문장이에요 → ${line}`);
}

// 65세 이상: 성향을 골라도 사주 점수·퀘스트는 그대로, 마지막 한 줄만 더해진다 (사주 90 : 성향 10).
for (const day of [1, 12, 25, 30]) {
  const date = new Date(2026, 10, day);
  const withMbti = buildDaily(seniorWithMbti, date);
  const without = buildDaily(seniorProfile, date);
  const label = `[1958년생 ${withMbti.dateKey}]`;
  expect(withMbti.score === without.score, `${label}: 성향을 골라도 종합 지수는 같아야 해요 (${withMbti.score} vs ${without.score})`);
  expect(withMbti.topics.money.score === without.topics.money.score, `${label}: 성향을 골라 재물 지수가 달라졌어요`);
  expect(withMbti.quests[0].id === without.quests[0].id, `${label}: 성향을 골라 Quest 1이 달라졌어요`);
  expect(withMbti.quests[1].id === without.quests[1].id, `${label}: 성향을 골라 Quest 2가 달라졌어요`);
  expect(withMbti.mbtiLine !== null && withMbti.mbtiLine.startsWith("가볍게 — "), `${label}: 65세 이상 성향 한 줄이 없어요`);
  expect(without.mbtiLine === null, `${label}: 성향을 고르지 않았는데 성향 한 줄이 있어요`);
}
console.log(`   검사 ${checks}건 · 문제 ${failures.length}건`);

/* ── 결과 ───────────────────────────────────────────────── */

console.log("");
if (warnings.length > 0) {
  console.log(`참고 ${warnings.length}건:`);
  for (const warning of warnings) console.log(`  - ${warning}`);
  console.log("");
}

if (failures.length > 0) {
  console.log(`❌ 검증 실패 ${failures.length}건`);
  for (const failure of failures.slice(0, 60)) console.log(`  - ${failure}`);
  if (failures.length > 60) console.log(`  … 외 ${failures.length - 60}건`);
  process.exit(1);
}

console.log(`✅ 전수 검증 통과 — 퀘스트 ${all.length}개, 매칭 케이스 ${cases}건`);
