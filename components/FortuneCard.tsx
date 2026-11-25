"use client";

import { useEffect, useState } from "react";
import {
  ELEMENT_HANJA,
  ELEMENT_META,
  FORTUNE_TABS,
  FORTUNE_TOPIC_LABEL,
  type FortuneTopic,
} from "@/lib/content";
import type { DailyView } from "@/lib/engine";
import { trackEvent } from "@/lib/analytics";
import { formatKoreanDate } from "@/lib/utils";
import { ElementIcon, Sparkle, StarMascot } from "./illustrations";

/* 반원 게이지 — 위쪽 공간을 덜 차지하도록 크기를 줄였다(slim). */
const ARC_R = 86;
const ARC_LEN = Math.PI * ARC_R;
const ARC_Y = 106;

function Gauge({ value, label }: { value: number; label: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(value), 220);
    return () => window.clearTimeout(t);
  }, [value]);

  const offset = ARC_LEN * (1 - shown / 100);
  const angle = Math.PI * (1 - shown / 100);
  const knobX = 120 + ARC_R * Math.cos(angle);
  const knobY = ARC_Y - ARC_R * Math.sin(angle);
  const arc = `M${120 - ARC_R} ${ARC_Y} A${ARC_R} ${ARC_R} 0 0 1 ${120 + ARC_R} ${ARC_Y}`;

  return (
    <div className="relative mt-2">
      <svg viewBox="0 0 240 118" className="w-full" role="img" aria-label={`오늘의 운세 에너지 ${value}%`}>
        <defs>
          <linearGradient id="gauge-grad" x1="34" y1="106" x2="206" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0E7A54" />
            <stop offset="0.45" stopColor="#43A96B" />
            <stop offset="0.75" stopColor="#A5C94E" />
            <stop offset="1" stopColor="#F1D14B" />
          </linearGradient>
        </defs>
        <path d={arc} stroke="#F1E8D3" strokeWidth="14" strokeLinecap="round" fill="none" />
        <path
          d={arc}
          stroke="url(#gauge-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={offset}
          className="gauge-progress"
        />
        <circle cx={knobX} cy={knobY} r="11.5" fill="#FFFDF5" opacity="0.95" />
        <circle cx={knobX} cy={knobY} r="6.5" fill="#FFFFFF" stroke="#0E7A54" strokeWidth="3" />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-[2px] flex flex-col items-center">
        <div className="flex items-start gap-0.5 text-leaf-strong">
          <span className="text-[38px] font-extrabold leading-none tracking-tight tabular-nums">{value}</span>
          <span className="mt-1 text-[15px] font-bold">%</span>
        </div>
        <p className="mt-0.5 text-[11.5px] font-bold text-[#4E7A5E]">{label}</p>
      </div>
    </div>
  );
}

export function FortuneCard({ daily, mbti }: { daily: DailyView; mbti: string }) {
  const todayMeta = ELEMENT_META[daily.today.element];
  const [tab, setTab] = useState<"all" | FortuneTopic>("all");
  const topic = tab === "all" ? null : daily.topics[tab];

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

        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-cream-2/70 px-3 py-1.5 text-[11.5px] text-ink-soft">
          <span className="size-1.5 rounded-full" style={{ background: todayMeta.color }} />
          오늘은 <b className="font-bold text-ink">{daily.today.pillar}일</b> · 겉 {daily.today.element} · 바탕 {daily.today.branchElement}
        </div>
      </div>

      <div className="mx-5 mt-3 border-t border-dashed border-line" />

      <div className="px-5 py-3.5">
        <div className="mb-2 flex items-end justify-between gap-2">
          <div>
            <h3 className="text-[13px] font-bold text-ink">타고난 오행 밸런스</h3>
            <p className="mt-0.5 text-[10px] leading-tight text-ink-faint">
              태어난 생년월일{daily.chart.hourKnown ? "시" : ""}로 계산한 타고난 분포예요
            </p>
          </div>
          <span className="shrink-0 pb-0.5 text-[10.5px] text-ink-faint">
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
                  <ElementIcon element={item.element} size={23} />
                </div>
                <span className="text-[14px] font-bold leading-none text-ink">{ELEMENT_HANJA[item.element]}</span>
                <span className="text-[10px] font-semibold" style={{ color: statusColor }}>{item.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-4 mb-4">
        {/* 4개 운세 탭 — 누를 수 있는 탭임이 한눈에 보이도록 테두리·대비·글자를 키우고 지수를 함께 보여 준다. */}
        <div role="tablist" aria-label="운세 주제" className="grid grid-cols-4 gap-1.5">
          {FORTUNE_TABS.map((t) => {
            const active = tab === t.key;
            const percent = t.key === "all" ? daily.score : daily.topics[t.key].score;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.key);
                  trackEvent("fortune_tab_click", { tab: t.key, label: t.label });
                }}
                className={`flex flex-col items-center gap-0.5 rounded-2xl border-2 px-1 py-2 transition active:scale-[0.97] ${
                  active
                    ? "border-leaf bg-leaf-soft shadow-[0_10px_20px_-16px_rgba(18,128,92,1)]"
                    : "border-[#E7DCC2] bg-white/85 hover:border-leaf/35 hover:bg-white"
                }`}
              >
                <span className={`text-[13px] font-extrabold leading-none tracking-tight ${active ? "text-leaf-strong" : "text-[#4C4637]"}`}>
                  {t.label}
                </span>
                <span className={`text-[11px] font-bold leading-none tabular-nums ${active ? "text-leaf" : "text-[#8C8168]"}`}>
                  {percent}%
                </span>
              </button>
            );
          })}
        </div>

        <div
          key={tab}
          className="anim-fade-up relative mt-2.5 rounded-[22px] border border-[#F1E5C4] bg-[#FFF9E8] px-4 pb-6 pt-3.5"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#B09355]">
              {topic ? `${FORTUNE_TOPIC_LABEL[tab as FortuneTopic]} 한마디` : "오늘의 한마디"}
            </p>
            <span className="flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[10.5px] font-extrabold text-[#8A6F33] shadow-[inset_0_0_0_1px_rgba(199,168,98,0.35)]">
              <span className="tabular-nums">{topic ? topic.score : daily.score}%</span>
              <span className="font-semibold text-[#A08B58]">{topic ? topic.status : daily.scoreStatus}</span>
            </span>
          </div>

          {topic ? (
            <div className="pr-10">
              <p className="text-[13.5px] font-bold leading-[1.65] text-[#3E3A2C]">{topic.flow}</p>
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-white/80 px-2.5 py-2 text-[12px] leading-[1.7] text-[#4B4433]">
                <span aria-hidden="true">💡</span>
                <span>{topic.advice}</span>
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-[#8C8064]">{topic.mbtiNote}</p>
            </div>
          ) : (
            <div className="space-y-1.5 pr-10 text-[13px] leading-[1.7] text-[#4B4433]">
              {daily.reading.map((line, i) => (
                <p key={i} className={i === 0 ? "font-semibold" : ""}>{line}</p>
              ))}
            </div>
          )}

          <div className="pointer-events-none absolute -bottom-4 right-1.5">
            <StarMascot size={38} mood="idle" />
          </div>
        </div>
      </div>
    </section>
  );
}
