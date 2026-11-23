"use client";

import type { DailyView } from "@/lib/engine";
import { CardEmblem, Clover, LockIcon, ShareIcon, Sparkle } from "./illustrations";

export function CharmCard({
  daily,
  unlocked,
  onShare,
  justUnlocked,
  done = 0,
}: {
  daily: DailyView;
  unlocked: boolean;
  onShare: () => void;
  justUnlocked: boolean;
  done?: number;
}) {
  if (!unlocked) {
    return (
      <section className="lq-card lq-card--muted">
        <span aria-hidden className="lq-card-inner" />
        <div className="relative px-[18px] pb-[18px] pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lq-overline">Today&apos;s Card</p>
              <h2 className="mt-1 font-serif text-[15.5px] font-medium leading-none tracking-[-0.01em] text-[#3D4136]">
                오늘의 카드
              </h2>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold-line/60 bg-white/60 px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.04em] text-[#9A834F]">
              <LockIcon size={10} /> 잠김
            </span>
          </div>

          <div className="mt-3 flex items-center gap-4">
            <div className="shrink-0">
              <CardEmblem size={96} muted />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] leading-[1.7] text-[#5C5646]">
                두 퀘스트를 모두 마치면
                <br />
                오늘의 카드가 열려요
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  {[0, 1].map((i) => (
                    <span
                      key={i}
                      className="h-[3px] w-7 rounded-full transition-colors"
                      style={{ background: i < done ? "#BFA469" : "#E3DAC4" }}
                    />
                  ))}
                </span>
                <span className="text-[10px] tracking-[0.01em] text-[#8E8368]">
                  {done === 1 ? "하나 더 남았어요" : "차곡차곡 채워볼까요"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`lq-card ${justUnlocked ? "anim-reveal" : ""}`}>
      <span aria-hidden className="lq-card-inner" />

      {justUnlocked && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <div className="shimmer-track absolute inset-0" />
        </div>
      )}

      <div className="relative px-[18px] pb-[18px] pt-4">
        {/* 머리글 */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lq-overline">Today&apos;s Card</p>
            <h2 className="mt-1 font-serif text-[16px] font-medium leading-none tracking-[-0.01em] text-[#3D4136]">
              오늘의 카드
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold-line/65 bg-[#FBF6E7]/85 px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.04em] text-[#8E7234]">
            <Clover size={9} tone="gold" /> 열렸어요
          </span>
        </div>

        {/* 문양 */}
        <div className="mt-2.5 flex justify-center">
          <CardEmblem size={112} />
        </div>

        {/* 카드 내용 */}
        <h3 className="mt-1 text-center font-serif text-[21.5px] font-medium leading-snug tracking-[-0.015em] text-[#2F4A3B]">
          {daily.charm.title}
        </h3>
        <div className="mt-2 flex items-center justify-center gap-2 text-gold-line">
          <span className="h-px w-10 bg-current opacity-70" />
          <Sparkle size={7} color="#C7A862" />
          <span className="h-px w-10 bg-current opacity-70" />
        </div>
        <p className="mx-auto mt-2.5 max-w-[19rem] text-center text-[12px] leading-[1.8] text-[#6E6757]">
          {daily.charm.message}
        </p>

        {/* 행운의 결 */}
        <dl className="mt-4 grid grid-cols-3 divide-x divide-[#E6DCC1] border-y border-[#E6DCC1] py-2.5">
          {[
            { label: "행운의 색", value: daily.charm.colorName },
            { label: "숫자", value: daily.charm.number },
            { label: "키워드", value: daily.charm.keyword },
          ].map((item) => (
            <div key={item.label} className="px-1 text-center">
              <dt className="text-[9px] font-semibold tracking-[0.16em] text-[#94804F]">{item.label}</dt>
              <dd className="mt-1 font-serif text-[13.5px] font-medium leading-none text-[#3E3A2C]">{item.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={onShare}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[13px] bg-forest py-[13px] text-[13px] font-semibold tracking-[0.02em] text-[#FBF7EA] shadow-[inset_0_0_0_1px_rgba(212,184,118,0.32),0_16px_26px_-20px_rgba(18,80,60,1)] transition active:scale-[0.99]"
        >
          <ShareIcon size={14} />
          오늘의 카드 공유하기
        </button>
      </div>
    </section>
  );
}
