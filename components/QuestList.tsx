"use client";

import { useState } from "react";
import type { ResolvedQuest } from "@/lib/engine";
import { CheckMark, Clover, ElementIcon, Sparkle } from "./illustrations";

function Burst({ seed }: { seed: number }) {
  const bits = Array.from({ length: 9 }, (_, i) => {
    const angle = (i / 9) * Math.PI * 2 + (seed % 7) * 0.3;
    const dist = 26 + ((seed + i * 7) % 18);
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: i % 3 === 0 ? "#FFD95E" : i % 3 === 1 ? "#5FBF8B" : "#E9C466",
      delay: `${i * 14}ms`,
      size: i % 2 === 0 ? 8 : 6,
    };
  });

  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-0">
      {bits.map((b, i) => (
        <span
          key={i}
          className="spark"
          style={{
            // @ts-expect-error css custom properties
            "--dx": `${b.dx}px`,
            "--dy": `${b.dy}px`,
            width: b.size,
            height: b.size,
            marginLeft: -b.size / 2,
            marginTop: -b.size / 2,
            background: b.color,
            animationDelay: b.delay,
          }}
        />
      ))}
    </span>
  );
}

function QuestCard({
  quest,
  checked,
  onToggle,
}: {
  quest: ResolvedQuest;
  checked: boolean;
  onToggle: () => void;
}) {
  const [burst, setBurst] = useState(0);

  const gold = quest.badge === "Quest 2";
  const accent = gold ? "#DFAE3F" : "#12805C";
  const soft = gold ? "#FBF1D8" : "#E6F4EB";

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border bg-white/80 p-4 transition-all duration-300 ${
        checked ? "border-[#CFE7D8] bg-[#FBFFFC]" : "border-line"
      }`}
      style={checked ? { boxShadow: "0 16px 30px -26px rgba(18,128,92,0.8)" } : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10.5px] font-extrabold tracking-wide"
              style={{ background: accent, color: "#fff" }}
            >
              {quest.badge}
            </span>
            {quest.elements.length > 1 && (
              <span
                className="rounded-full border bg-white/80 px-1.5 py-0.5 text-[10px] font-extrabold tracking-tight"
                style={{ borderColor: `${accent}66`, color: accent }}
              >
                {quest.elements.join("+")} 함께
              </span>
            )}
            {checked && (
              <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-leaf anim-fade-up">
                <Clover size={11} /> 완료!
              </span>
            )}
          </div>

          <h3 className={`text-[16px] font-extrabold leading-snug tracking-tight transition ${checked ? "text-leaf-strong" : "text-ink"}`}>
            {quest.title}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{quest.desc}</p>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={`${quest.title} 완료 표시`}
            onClick={() => {
              if (!checked) setBurst((n) => n + 1);
              onToggle();
            }}
            className={`relative flex size-9 items-center justify-center rounded-xl border-2 transition active:scale-95 ${
              checked ? "border-leaf bg-leaf text-white" : "border-[#D8CFB8] bg-white/70 text-transparent hover:border-leaf/50"
            }`}
          >
            <span className={checked ? "block" : "hidden"}>
              <CheckMark size={16} />
            </span>
            {burst > 0 && checked && <Burst seed={burst} key={burst} />}
          </button>
        </div>
      </div>

      {/* 카드 오른쪽 아래 장식은 설명 박스 안에 나란히 놓아요 */}

      <div className="relative mt-3 flex items-center gap-2 rounded-xl px-2.5 py-1.5" style={{ background: soft }}>
        <Sparkle size={11} color={accent} className="mt-[3px] shrink-0 self-start" />
        <p className="flex-1 text-[11px] leading-relaxed text-[#6A6350]">
          <span className="font-bold text-[#57503F]">왜 이 퀘스트인가요? </span>
          {quest.why}
        </p>
        <span className="shrink-0 opacity-90">
          {gold ? (
            <Clover size={24} tone="gold" />
          ) : (
            <span className="flex items-center gap-0.5">
              {quest.elements.map((el) => (
                <ElementIcon key={el} element={el} size={quest.elements.length > 1 ? 19 : 24} />
              ))}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

export function QuestList({
  quests,
  checks,
  onToggle,
}: {
  quests: [ResolvedQuest, ResolvedQuest];
  checks: [boolean, boolean];
  onToggle: (index: 0 | 1) => void;
}) {
  const done = checks.filter(Boolean).length;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Sparkle size={14} color="#E0AE3E" className="anim-twinkle" />
          <h2 className="text-[17px] font-extrabold tracking-tight text-ink">오늘의 퀘스트</h2>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${done === 2 ? "bg-leaf text-white" : "bg-cream-2 text-ink-soft"}`}>
          {done} / 2 완료
        </span>
      </div>

      <QuestCard quest={quests[0]} checked={checks[0]} onToggle={() => onToggle(0)} />
      <QuestCard quest={quests[1]} checked={checks[1]} onToggle={() => onToggle(1)} />
    </section>
  );
}
