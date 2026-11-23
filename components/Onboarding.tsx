"use client";

import { useMemo, useState } from "react";
import { JIN, computeChart } from "@/lib/saju";
import type { Birth, BirthTime, Mbti, Profile } from "@/lib/types";
import { Clover, Sparkle, StarMascot } from "./illustrations";

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
  const [timeUnknown, setTimeUnknown] = useState(initial ? initial.time.kind === "unknown" : true);
  const [jinIndex, setJinIndex] = useState<number | null>(
    initial?.time.kind === "jin" ? initial.time.index : null,
  );
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

  const ready = Boolean(year && month && day && mbti);

  function pickJin(index: number) {
    setJinIndex(index);
    setTimeUnknown(false);
  }

  function submit() {
    if (!year || !month || !day || !mbti) return;
    const birth: Birth = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      isLunar,
      isLeapMonth: isLunar ? isLeapMonth : false,
    };
    const time: BirthTime = timeUnknown
      ? { kind: "unknown" }
      : jinIndex === null
        ? { kind: "unknown" }
        : { kind: "jin", index: jinIndex };

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
            생년월일과 MBTI만 알려주시면 <br />오늘의 운세와 퀘스트를 준비할게요.
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
          <button
            type="button"
            onClick={() => {
              setTimeUnknown(true);
              setJinIndex(null);
            }}
            className={`rounded-full px-3 py-1 text-[12px] font-bold transition ${
              timeUnknown ? "bg-leaf text-white" : "bg-cream-2 text-ink-faint"
            }`}
          >
            시간 모름
          </button>
        </div>
        <p className="mb-3 text-[12px] text-ink-faint">
          {timeUnknown ? "세 기둥(연·월·일)으로 계산해요. 시간을 알면 더 정확해져요." : "12시진 중 가까운 시간을 골라주세요."}
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          {JIN.map((jin, index) => {
            const active = !timeUnknown && jinIndex === index;
            return (
              <button
                key={jin.name}
                type="button"
                onClick={() => pickJin(index)}
                className={`flex flex-col items-center rounded-2xl border px-1 py-2 transition ${
                  active
                    ? "border-leaf bg-leaf-soft text-leaf-strong shadow-[0_6px_16px_-12px_rgba(18,128,92,0.9)]"
                    : "border-line bg-white/60 text-ink-soft hover:border-[#cddcc9]"
                }`}
              >
                <span className="text-[13px] font-bold">{jin.name}</span>
                <span className="text-[10px] tracking-tight text-ink-faint">{jin.range}</span>
              </button>
            );
          })}
        </div>
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
