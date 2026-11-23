"use client";

import { useEffect, useState } from "react";
import { ELEMENT_META } from "@/lib/content";
import type { DailyView } from "@/lib/engine";
import { formatKoreanDate } from "@/lib/utils";
import { ElementIcon, Sparkle, StarMascot } from "./illustrations";

const ARC_LEN = Math.PI * 96;

function Gauge({ value, label }: { value: number; label: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(value), 220);
    return () => window.clearTimeout(t);
  }, [value]);

  const offset = ARC_LEN * (1 - shown / 100);
  const angle = Math.PI * (1 - shown / 100);
  const knobX = 120 + 96 * Math.cos(angle);
  const knobY = 120 - 96 * Math.sin(angle);

  return (
    <div className="relative mt-3">
      <svg viewBox="0 0 240 148" className="w-full" role="img" aria-label={`오늘의 운세 에너지 ${value}%`}>
        <defs>
          <linearGradient id="gauge-grad" x1="24" y1="120" x2="216" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0E7A54" />
            <stop offset="0.45" stopColor="#43A96B" />
            <stop offset="0.75" stopColor="#A5C94E" />
            <stop offset="1" stopColor="#F1D14B" />
          </linearGradient>
        </defs>
        <path d="M24 120 A96 96 0 0 1 216 120" stroke="#F1E8D3" strokeWidth="17" strokeLinecap="round" fill="none" />
        <path
          d="M24 120 A96 96 0 0 1 216 120"
          stroke="url(#gauge-grad)"
          strokeWidth="17"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={offset}
          className="gauge-progress"
        />
        <circle cx={knobX} cy={knobY} r="13" fill="#FFFDF5" opacity="0.95" />
        <circle cx={knobX} cy={knobY} r="7.5" fill="#FFFFFF" stroke="#0E7A54" strokeWidth="3.5" />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-[6px] flex flex-col items-center">
        <div className="flex items-start gap-0.5 text-leaf-strong">
          <span className="text-[44px] font-extrabold leading-none tracking-tight tabular-nums">{value}</span>
          <span className="mt-1.5 text-[17px] font-bold">%</span>
        </div>
        <p className="mt-1 text-[12.5px] font-bold text-[#4E7A5E]">{label}</p>
      </div>

      <div className="mt-1 flex justify-between px-1 text-[10.5px] text-ink-faint">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export function FortuneCard({ daily, mbti }: { daily: DailyView; mbti: string }) {
  const todayMeta = ELEMENT_META[daily.today.element];

  return (
    <section className="card card-pop overflow-hidden">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkle size={15} color="#E0AE3E" className="anim-twinkle" />
              <h2 className="text-[19px] font-extrabold tracking-tight text-ink">오늘의 운세</h2>
              <Sparkle size={12} color="#E0AE3E" className="anim-twinkle" style={{ animationDelay: "0.8s" }} />
            </div>
            <p className="mt-0.5 text-[11.5px] text-ink-faint">{daily.chart.birthLabel} · {mbti}</p>
          </div>
          <span className="rounded-full bg-leaf px-3 py-1 text-[12px] font-bold text-white shadow-[0_8px_18px_-14px_rgba(18,128,92,0.9)]">
            {formatKoreanDate(daily.dateKey)}
          </span>
        </div>

        <Gauge value={daily.score} label={daily.scoreLabel} />

        <div className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-cream-2/70 px-3 py-1.5 text-[11.5px] text-ink-soft">
          <span className="size-1.5 rounded-full" style={{ background: todayMeta.color }} />
          오늘은 <b className="font-bold text-ink">{daily.today.pillar}일</b> · {todayMeta.name} 기운
        </div>
      </div>

      <div className="mx-5 mt-4 border-t border-dashed border-line" />

      <div className="px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-ink">오행 밸런스</h3>
          <span className="text-[10.5px] text-ink-faint">
            {daily.chart.hourKnown ? "네 기둥 기준" : "세 기둥 기준"}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {daily.balance.map((item) => {
            const meta = ELEMENT_META[item.element];
            const statusColor =
              item.status === "좋음" ? "#12805C" : item.status === "보통" ? "#A9873C" : "#A9987F";
            return (
              <div key={item.element} className="flex flex-col items-center gap-1">
                <div className="flex size-12 items-center justify-center rounded-full border" style={{ background: meta.soft, borderColor: `${meta.color}33` }}>
                  <ElementIcon element={item.element} size={24} />
                </div>
                <span className="text-[12px] font-bold text-ink">{item.element}</span>
                <span className="text-[10px] font-semibold" style={{ color: statusColor }}>{item.status}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 space-y-1.5">
          {daily.balance.map((item) => (
            <div key={item.element} className="flex items-center gap-2">
              <span className="w-3 text-[10px] font-bold text-ink-faint">{item.element}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-3/70">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${Math.max(item.percent, 3)}%`,
                    background: ELEMENT_META[item.element].color,
                    opacity: item.count === 0 ? 0.35 : 0.85,
                  }}
                />
              </div>
              <span className="w-8 text-right text-[10px] tabular-nums text-ink-faint">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-4 mb-4 rounded-[22px] border border-[#F1E5C4] bg-[#FFF9E8] px-4 pb-4 pt-3.5">
        <div className="space-y-1.5 text-[13px] leading-[1.7] text-[#4B4433]">
          {daily.reading.map((line, i) => (
            <p key={i} className={i === 0 ? "font-semibold" : ""}>{line}</p>
          ))}
        </div>
        <div className="absolute -bottom-3 right-2">
          <StarMascot size={46} mood="idle" />
        </div>
      </div>
    </section>
  );
}
