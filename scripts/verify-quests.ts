/**
 * Lucky Quest 전수 검증.
 *
 * 1) 퀘스트 데이터 구조·문구 검사 (제목/설명/이유 문장의 길이·형태·1:1 정합성)
 * 2) 실제 사주 오행 분포 전수에 대한 매칭 검사 (복합 결핍 우선, Quest 1·2 중복 방지)
 *
 * 실행: npm run verify
 */
import {
  COMBO_QUESTS,
  ELEMENT_QUESTS,
  MBTI_QUESTS,
  comboKeyOf,
  type ComboKey,
  type Quest,
} from "../lib/content";
import { buildDaily, deficiencyOf } from "../lib/engine";
import { ELEMENTS, computeChart } from "../lib/saju";
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
      expect(q2.why.includes(mbti), `${label}: Quest 2 이유에 유형이 없어요`);
      expect(q2Source?.elements.length === 0, `${label}: Quest 2가 오행 퀘스트예요`);

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
