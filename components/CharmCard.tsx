"use client";

import { useState } from "react";
import { ELEMENT_META } from "@/lib/content";
import type { DailyView } from "@/lib/engine";
import { composeCardImage, saveOrShareImage } from "@/lib/cardImage";
import type { QuestPhoto } from "@/lib/photos";
import { formatKoreanDate } from "@/lib/utils";
import { CardEmblem, Clover, LockIcon, ShareIcon, Sparkle } from "./illustrations";

export function CharmCard({
  daily,
  unlocked,
  onShare,
  justUnlocked,
  done = 0,
  photos = [],
  onToast,
}: {
  daily: DailyView;
  unlocked: boolean;
  onShare: () => void;
  justUnlocked: boolean;
  done?: number;
  photos?: QuestPhoto[];
  onToast?: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  const onSavePhotoCard = async () => {
    if (saving || photos.length === 0) return;
    setSaving(true);
    try {
      const blob = await composeCardImage({
        charm: daily.charm,
        dateLabel: formatKoreanDate(daily.dateKey),
        elementName: ELEMENT_META[daily.charm.element].name,
        pillar: daily.today.pillar,
        photos: photos.map((photo) => photo.blob),
      });
      const result = await saveOrShareImage(blob, `luckyquest-${daily.dateKey}.png`);
      onToast?.(result === "shared" ? "인증샷 카드를 공유했어요" : "인증샷 카드 이미지를 저장했어요");
    } catch {
      onToast?.("이미지를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요");
    } finally {
      setSaving(false);
    }
  };

  if (!unlocked) {
    return (
      <section className="lq-card lq-card--muted">
        <span aria-hidden className="lq-card-inner" />
        <div className="relative px-[18px] pb-[18px] pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lq-overline">Today&apos;s Lucky Card</p>
              <h2 className="mt-1 font-serif text-[15.5px] font-medium leading-none tracking-[-0.01em] text-[#3D4136]">
                오늘의 행운 카드
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
                오늘의 행운 카드가 열려요
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
            <p className="lq-overline">Today&apos;s Lucky Card</p>
            <h2 className="mt-1 font-serif text-[16px] font-medium leading-none tracking-[-0.01em] text-[#3D4136]">
              오늘의 행운 카드
            </h2>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold-line/65 bg-[#FBF6E7]/85 px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.04em] text-[#8E7234]">
            <Clover size={9} tone="gold" /> 열렸어요
          </span>
        </div>

        {/* 문양 */}
        <div className="mt-2.5 flex justify-center">
          <CardEmblem size={124} />
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

        {/* 오늘의 기운과 맞닿은 명언 */}
        <blockquote className="mx-auto mt-3 max-w-[19rem] text-center">
          <p className="text-[12.5px] leading-[1.85] text-[#6E6757]">
            &ldquo;{daily.charm.quote}&rdquo;
          </p>
          <footer className="mt-1.5 font-serif text-[11px] tracking-[0.02em] text-[#94804F]">
            — {daily.charm.author}
          </footer>
        </blockquote>

        {/* 행운의 결 */}
        <dl className="mt-4 grid grid-cols-3 divide-x divide-[#E6DCC1] border-y border-[#E6DCC1] py-2.5">
          {[
            { label: "행운의 색", value: daily.charm.colorName },
            { label: "행운의 숫자", value: daily.charm.number },
            { label: "행운의 아이템", value: daily.charm.item },
          ].map((item) => (
            <div key={item.label} className="px-1 text-center">
              <dt className="text-[9px] font-semibold tracking-[0.12em] text-[#94804F]">{item.label}</dt>
              <dd className="mt-1 font-serif text-[13px] font-medium leading-tight text-[#3E3A2C]">{item.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={onShare}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[13px] bg-forest py-[13px] text-[13px] font-semibold tracking-[0.02em] text-[#FBF7EA] shadow-[inset_0_0_0_1px_rgba(212,184,118,0.32),0_16px_26px_-20px_rgba(18,80,60,1)] transition active:scale-[0.99]"
        >
          <ShareIcon size={14} />
          오늘의 행운 카드 공유하기
        </button>

        {/* 인증샷을 남긴 날에만 열리는 선택 옵션 — 기본 공유에는 사진이 들어가지 않는다. */}
        {photos.length > 0 && (
          <button
            type="button"
            onClick={onSavePhotoCard}
            disabled={saving}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[13px] border border-gold-line/70 bg-[#FBF6E7]/80 py-3 text-[12.5px] font-semibold tracking-[0.01em] text-[#7C6530] transition active:scale-[0.99] disabled:opacity-60"
          >
            {saving ? "이미지를 만드는 중…" : `📷 인증샷 포함 카드 저장(PNG) · ${photos.length}장`}
          </button>
        )}
      </div>
    </section>
  );
}
