"use client";

import { useMemo, useState } from "react";
import { JIN, computeChart } from "@/lib/saju";
import type { Birth, BirthTime, Mbti, Profile } from "@/lib/types";
import { CheckMark, Clover, Sparkle, StarMascot } from "./illustrations";

/** 태어난 시간 선택값 — 아직 아무것도 고르지 않은 상태를 null로 둔다. */
type TimeChoice = { kind: "unknown" } | { kind: "jin"; index: number };

function nearestJinIndex(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  return Math.min(11, Math.max(0, Math.floor(((h + 1) % 24) / 2)));
}

/** 받침 유무에 맞는 목적격 조사를 붙인다. (MBTI처럼 영문으로 끝나면 '를') */
function withObjectParticle(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinal = isHangul ? (code - 0xac00) % 28 !== 0 : false;
  return `${word}${hasFinal ? "을" : "를"}`;
}

/** 저장된 프로필을 편집할 때는 저장된 선택을 그대로 되살린다. */
function initialTimeChoice(initial?: Profile | null): TimeChoice | null {
  const saved = initial?.time;
  if (!saved) return null;
  if (saved.kind === "jin") return { kind: "jin", index: Math.min(11, Math.max(0, saved.index)) };
  if (saved.kind === "exact") return { kind: "jin", index: nearestJinIndex(saved.hour) };
  return { kind: "unknown" };
}

const MBTI_LIST: Mbti[] = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const QUIZ: { question: string; options: { label: string; value: string; hint: string }[] }[] = [
  {
    question: "주말 저녁, 에너지를 채우는 쪽은?",
    options: [
      { label: "사람들을 만나 수다 떨기", value: "E", hint: "밖으로" },
      { label: "혼자만의 시간으로 충전", value: "I", hint: "안으로" },
    ],
  },
  {
    question: "새로운 걸 볼 때 먼저 드는 생각은?",
    options: [
      { label: "지금 눈에 보이는 사실", value: "S", hint: "현실" },
      { label: "그 너머의 가능성", value: "N", hint: "상상" },
    ],
  },
  {
    question: "친구가 고민을 털어놓을 때 나는?",
    options: [
      { label: "해결책을 함께 찾아보기", value: "T", hint: "이성" },
      { label: "마음부터 함께 나누기", value: "F", hint: "감성" },
    ],
  },
  {
    question: "여행 계획을 세울 때 나는?",
    options: [
      { label: "미리 정해두면 마음이 편해요", value: "J", hint: "계획" },
      { label: "그때그때 즐기는 게 좋아요", value: "P", hint: "즉흥" },
    ],
  },
];

function buildYearOptions(): number[] {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now; y >= 1930; y -= 1) years.push(y);
  return years;
}

export function Onboarding({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Profile | null;
  onSave: (profile: Profile) => void;
  onCancel?: () => void;
}) {
  const [isLunar, setIsLunar] = useState(initial?.birth.isLunar ?? false);
  const [isLeapMonth, setIsLeapMonth] = useState(initial?.birth.isLeapMonth ?? false);
  const [year, setYear] = useState<number | "">(initial?.birth.year ?? "");
  const [month, setMonth] = useState<number | "">(initial?.birth.month ?? "");
  const [day, setDay] = useState<number | "">(initial?.birth.day ?? "");
  const [timeChoice, setTimeChoice] = useState<TimeChoice | null>(() => initialTimeChoice(initial));
  const [mbti, setMbti] = useState<Mbti | null>(initial?.mbti ?? null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(buildYearOptions, []);
  const daysInMonth = useMemo(() => {
    if (isLunar) return 30; // 음력은 29·30일까지 — 실제 존재 여부는 계산 단계에서 확인해요
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  }, [year, month, isLunar]);

  const quizResult = useMemo(() => {
    if (![0, 1, 2, 3].every((i) => quizAnswers[i])) return null;
    return `${quizAnswers[0]}${quizAnswers[1]}${quizAnswers[2]}${quizAnswers[3]}` as Mbti;
  }, [quizAnswers]);

  const ready = Boolean(year && month && day && mbti && timeChoice);

  const missing = useMemo(() => {
    const items: string[] = [];
    if (!year || !month || !day) items.push("생년월일");
    if (!timeChoice) items.push("태어난 시간");
    if (!mbti) items.push("MBTI");
    return items;
  }, [year, month, day, timeChoice, mbti]);

  function submit() {
    if (!year || !month || !day || !mbti || !timeChoice) return;
    const birth: Birth = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      isLunar,
      isLeapMonth: isLunar ? isLeapMonth : false,
    };
    const time: BirthTime =
      timeChoice.kind === "unknown" ? { kind: "unknown" } : { kind: "jin", index: timeChoice.index };

    try {
      computeChart(birth, time);
    } catch {
      setError(isLunar ? "음력 날짜를 다시 한 번 확인해 주세요. (윤달 여부도 함께 살펴봐요)" : "생년월일을 다시 한 번 확인해 주세요.");
      return;
    }

    onSave({
      birth,
      time,
      mbti,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pb-0 pt-[max(14px,env(safe-area-inset-top))]">
      {/* 인사 */}
      <div className="flex items-center gap-3 rounded-[26px] border border-line bg-white/70 px-4 py-4">
        <StarMascot size={54} mood="wave" />
        <div>
          <p className="text-[15px] font-bold text-ink">안녕하세요, 오늘의 별이에요</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
            생년월일과 MBTI, 태어난 시간을 알려주시면 <br />오늘의 운세와 퀘스트를 준비할게요.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">5초 만에 시작하기</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-1 text-[11px] font-bold text-leaf">
          <Clover size={12} /> 로그인 없이
        </span>
      </div>

      {/* 생년월일 */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink">생년월일</h2>
          <div className="flex rounded-full bg-cream-2 p-0.5">
            {[
              { label: "양력", value: false },
              { label: "음력", value: true },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setIsLunar(opt.value);
                  if (!opt.value) setIsLeapMonth(false);
                }}
                className={`rounded-full px-3 py-1 text-[12px] font-bold transition ${
                  isLunar === opt.value ? "bg-white text-leaf shadow-sm" : "text-ink-faint"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2">
          <select className="field" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")} aria-label="출생 연도">
            <option value="">연도</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select className="field" value={month} onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : "")} aria-label="출생 월">
            <option value="">월</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <select className="field" value={day} onChange={(e) => setDay(e.target.value ? Number(e.target.value) : "")} aria-label="출생 일">
            <option value="">일</option>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}일</option>
            ))}
          </select>
        </div>

        {isLunar && (
          <label className="mt-2.5 flex items-center gap-2 px-1 text-[12.5px] text-ink-soft">
            <input
              type="checkbox"
              checked={isLeapMonth}
              onChange={(e) => setIsLeapMonth(e.target.checked)}
              className="size-4 accent-[#12805C]"
            />
            윤달에 태어났어요
          </label>
        )}
      </section>

      {/* 태어난 시간 */}
      <section className="card p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink">태어난 시간</h2>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
              timeChoice ? "bg-leaf-soft text-leaf-strong" : "bg-cream-2 text-ink-faint"
            }`}
          >
            {timeChoice ? (
              <>
                <CheckMark size={10} /> 선택 완료
              </>
            ) : (
              "골라주세요"
            )}
          </span>
        </div>
        <p className="mb-3 text-[12px] text-ink-faint" aria-live="polite">
          {timeChoice === null
            ? "태어난 시간을 몰라도 괜찮아요. 12시진 중에서 고르거나 아래 ‘시간 모름’을 눌러주세요."
            : timeChoice.kind === "unknown"
              ? "시간을 알면 사주가 더 정확해져요. 나중에 언제든 바꿀 수 있어요."
              : `${JIN[timeChoice.index].name}(${JIN[timeChoice.index].range}) 기준으로 계산할게요.`}
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          {JIN.map((jin, index) => {
            const active = timeChoice?.kind === "jin" && timeChoice.index === index;
            return (
              <button
                key={jin.name}
                type="button"
                aria-pressed={active}
                onClick={() => setTimeChoice({ kind: "jin", index })}
                className={`relative flex flex-col items-center rounded-2xl border px-1 py-2 transition-all duration-150 active:scale-[0.96] ${
                  active
                    ? "border-leaf bg-leaf text-white shadow-[0_10px_20px_-14px_rgba(18,128,92,0.95)]"
                    : "border-line bg-white/60 text-ink-soft hover:border-[#cddcc9] hover:bg-white"
                }`}
              >
                {active && (
                  <span className="anim-fade-up absolute right-1 top-1 text-white/90">
                    <CheckMark size={9} />
                  </span>
                )}
                <span className="text-[13px] font-bold">{jin.name}</span>
                <span className={`text-[10px] tracking-tight ${active ? "text-white/75" : "text-ink-faint"}`}>
                  {jin.range}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-pressed={timeChoice?.kind === "unknown"}
          onClick={() => setTimeChoice({ kind: "unknown" })}
          className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 transition-all duration-150 active:scale-[0.98] ${
            timeChoice?.kind === "unknown"
              ? "border-leaf bg-leaf text-white shadow-[0_10px_20px_-14px_rgba(18,128,92,0.95)]"
              : "border-dashed border-[#dccfb0] bg-white/50 text-ink-soft hover:border-[#cddcc9] hover:bg-white"
          }`}
        >
          {timeChoice?.kind === "unknown" && <CheckMark size={12} />}
          <span className="text-[12.5px] font-bold">시간 모름</span>
          <span
            className={`text-[11px] ${
              timeChoice?.kind === "unknown" ? "text-white/80" : "text-ink-faint"
            }`}
          >
            · 태어난 시각을 몰라도 괜찮아요
          </span>
        </button>

        {timeChoice?.kind === "unknown" && (
          <p className="anim-fade-up mt-2.5 flex items-center gap-1.5 rounded-2xl bg-leaf-soft px-3 py-2 text-[12px] font-semibold text-leaf-strong">
            <Sparkle size={11} color="#12805C" className="shrink-0" />
            태어난 시간 없이 연·월·일 세 기둥으로 계산해요
          </p>
        )}
      </section>

      {/* MBTI */}
      <section className="card p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink">MBTI</h2>
          <button
            type="button"
            onClick={() => setQuizOpen((v) => !v)}
            className="rounded-full bg-gold-soft px-3 py-1 text-[12px] font-bold text-[#8a6a1c]"
          >
            잘 모르겠어요
          </button>
        </div>

        {quizOpen ? (
          <div className="mt-2 space-y-3">
            {QUIZ.map((q, qi) => (
              <div key={qi}>
                <p className="mb-1.5 text-[12.5px] font-semibold text-ink-soft">
                  {qi + 1}. {q.question}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const active = quizAnswers[qi] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [qi]: opt.value }))}
                        className={`rounded-2xl border px-2.5 py-2 text-left transition ${
                          active ? "border-leaf bg-leaf-soft" : "border-line bg-white/60"
                        }`}
                      >
                        <span className="block text-[12.5px] font-semibold leading-snug text-ink">{opt.label}</span>
                        <span className="text-[10.5px] text-ink-faint">{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {quizResult && (
              <div className="flex items-center justify-between rounded-2xl bg-leaf-soft px-3 py-2.5">
                <span className="text-[13px] font-bold text-leaf-strong">
                  나의 유형은 <span className="text-[15px]">{quizResult}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMbti(quizResult);
                    setQuizOpen(false);
                  }}
                  className="rounded-full bg-leaf px-3 py-1.5 text-[12px] font-bold text-white"
                >
                  적용하기
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {MBTI_LIST.map((type) => {
              const active = mbti === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMbti(type)}
                  className={`rounded-xl border py-2 text-[12.5px] font-bold tracking-wide transition ${
                    active
                      ? "border-leaf bg-leaf text-white shadow-[0_8px_18px_-14px_rgba(18,128,92,0.9)]"
                      : "border-line bg-white/60 text-ink-soft hover:border-[#cddcc9]"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-2xl bg-[#FDF0E6] px-4 py-2.5 text-[12.5px] text-[#96603a]">{error}</p>
      )}

      {/* CTA */}
      <div className="sticky bottom-0 z-30 -mx-5 mt-auto border-t border-line/70 bg-cream/95 px-5 pb-5 pt-3 backdrop-blur">
        {!ready && missing.length > 0 && (
          <p className="mb-2 text-center text-[11.5px] font-semibold text-ink-faint">
            {withObjectParticle(missing.join(" · "))} 고르면 시작할 수 있어요
          </p>
        )}
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-line px-4 py-3.5 text-[14px] font-bold text-ink-soft"
            >
              취소
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-extrabold transition ${
              ready
                ? "bg-leaf text-white shadow-[0_18px_30px_-18px_rgba(18,128,92,0.95)] active:scale-[0.99]"
                : "bg-cream-3 text-ink-faint"
            }`}
          >
            <Sparkle size={15} color={ready ? "#FFE27A" : "#c9c0a8"} />
            {initial ? "저장하고 돌아가기" : "오늘의 운세 보기"}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          입력한 정보는 이 기기에만 저장돼요. 언제든 고칠 수 있어요.
        </p>
      </div>
    </div>
  );
}
