"use client";

import type { DailyView } from "@/lib/engine";
import { CharmIllustration, Clover, LockIcon, ShareIcon, Sparkle } from "./illustrations";

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
      <section className="relative overflow-hidden rounded-[26px] border border-line bg-[#FAF4E4]">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-1.5">
            <Sparkle size={13} color="#C9B98C" />
            <h2 className="text-[15px] font-extrabold tracking-tight text-[#8C8368]">오늘의 럭키 부적 카드</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-bold text-[#A09272]">
            <LockIcon size={11} /> 잠김
          </span>
        </div>

        <div className="flex items-center gap-4 px-4 pb-4 pt-3">
          <div className="relative shrink-0">
            <div className="pointer-events-none opacity-40 blur-[3px]">
              <CharmIllustration className="h-[112px] w-[82px]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-white/90 text-[#B9A87F] shadow-[0_10px_22px_-16px_rgba(120,100,50,0.9)]">
                <LockIcon size={19} />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold leading-relaxed text-[#6F6754]">
              두 퀘스트를 모두 마치면<br />오늘의 부적이 열려요
            </p>
            <div className="mt-2.5 flex items-center gap-1.5">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-9 rounded-full transition-colors"
                  style={{ background: i < done ? "#7CC3A3" : "#E7DCC0" }}
                />
              ))}
              <span className="ml-1 text-[10.5px] text-[#A99D80]">
                {done === 1 ? "하나 더 남았어요!" : "하나씩 채워볼까요?"}
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-[26px] border border-[#E7D9B4] bg-[#FFFCF2] ${
        justUnlocked ? "anim-reveal" : ""
      }`}
      style={{ boxShadow: "0 26px 44px -36px rgba(140,112,40,0.75)" }}
    >
      {justUnlocked && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <div className="shimmer-track absolute inset-0" />
        </div>
      )}

      <div className="relative flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-1.5">
          <Sparkle size={13} color="#D3A93E" className="anim-twinkle" />
          <h2 className="text-[15px] font-extrabold tracking-tight text-[#3F3A2C]">오늘의 럭키 부적 카드</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-leaf px-2.5 py-1 text-[10.5px] font-extrabold text-white">
          <Clover size={11} tone="ivory" /> 열렸어요
        </span>
      </div>

      <div className="relative flex items-center gap-3.5 px-4 pb-3 pt-3">
        <div className="shrink-0 rounded-lg">
          <CharmIllustration className="h-[150px] w-[110px] drop-shadow-[0_10px_18px_rgba(150,120,50,0.18)]" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[9.5px] font-extrabold tracking-[0.16em] text-[#B99A44]">LUCKY CHARM</span>
          <h3 className="mt-0.5 text-[20px] font-extrabold leading-tight tracking-tight text-[#1D6B4D]">
            {daily.charm.title}
          </h3>
          <div className="mt-1 flex items-center gap-1">
            <span className="h-px w-5 bg-[#D8C89C]" />
            <Sparkle size={9} color="#C9A227" />
            <span className="h-px w-5 bg-[#D8C89C]" />
          </div>

          <p className="mt-1.5 text-[12px] leading-[1.65] text-[#5D5644]">{daily.charm.message}</p>

          <div className="mt-2 flex flex-wrap gap-1">
            {[
              { label: "행운의 색", value: daily.charm.colorName },
              { label: "숫자", value: daily.charm.number },
              { label: "키워드", value: daily.charm.keyword },
            ].map((chip) => (
              <span key={chip.label} className="rounded-full bg-[#F6EFD9] px-2 py-0.5 text-[10px] font-semibold text-[#8A7A4E]">
                {chip.label} <b className="font-bold text-[#5F5533]">{chip.value}</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative px-4 pb-4">
        <button
          type="button"
          onClick={onShare}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-leaf py-3 text-[13.5px] font-extrabold text-white shadow-[0_16px_26px_-18px_rgba(18,128,92,1)] transition active:scale-[0.99]"
        >
          <ShareIcon size={15} />
          오늘의 부적 공유하기
        </button>
      </div>
    </section>
  );
}
