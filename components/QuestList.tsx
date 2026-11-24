"use client";

import { useEffect, useRef, useState } from "react";
import { ELEMENT_HANJA } from "@/lib/content";
import type { ResolvedQuest } from "@/lib/engine";
import type { QuestPhoto } from "@/lib/photos";
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

/** IndexedDB에 담긴 사진 Blob을 화면용 주소로 바꿔 보여 준다. */
function PhotoThumb({ blob, alt }: { blob: Blob; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  if (!url) {
    return <div className="size-16 animate-pulse rounded-xl bg-cream-3/60" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className="size-16 rounded-xl border border-line object-cover" />
  );
}

function QuestCard({
  quest,
  checked,
  onToggle,
  photo,
  onAddPhoto,
  onRemovePhoto,
}: {
  quest: ResolvedQuest;
  checked: boolean;
  onToggle: () => void;
  photo?: QuestPhoto;
  onAddPhoto: (file: File) => Promise<void>;
  onRemovePhoto: () => Promise<void>;
}) {
  const [burst, setBurst] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const gold = quest.badge === "Quest 2";
  const accent = gold ? "#DFAE3F" : "#12805C";
  const soft = gold ? "#FBF1D8" : "#E6F4EB";
  const elementLabel = quest.elements.map((el) => ELEMENT_HANJA[el]).join("+");

  const onPick = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      await onAddPhoto(file);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
            {quest.elements.length > 0 && (
              <span
                className="rounded-full border bg-white/80 px-1.5 py-0.5 text-[10px] font-extrabold tracking-tight"
                style={{ borderColor: `${accent}66`, color: accent }}
              >
                {elementLabel}
                {quest.elements.length > 1 ? " 함께" : " 기운"}
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

      {/* 인증샷 — 완료한 퀘스트에만, 선택으로 */}
      {checked && (
        <div className="mt-2.5">
          {photo ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#DCEBE1] bg-[#F6FBF8] p-2">
              <PhotoThumb blob={photo.blob} alt={`${quest.title} 인증샷`} />
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-bold text-[#3F6653]">인증샷 남김</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[#7E9488]">
                  이 기기에만 저장돼요 · {Math.max(1, Math.round(photo.bytes / 1024))}KB
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-[#CFE0D6] bg-white px-2 py-1 text-[10.5px] font-bold text-[#4B7A62]"
                >
                  바꾸기
                </button>
                <button
                  type="button"
                  onClick={() => void onRemovePhoto()}
                  className="rounded-lg px-2 py-1 text-[10.5px] font-bold text-[#A08B72]"
                >
                  지우기
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#CFDCCF] bg-white/60 py-2 text-[11.5px] font-bold text-[#5F7D68] transition active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "사진을 저장하는 중…" : "📷 인증샷 남기기(선택)"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void onPick(event.target.files?.[0])}
          />
        </div>
      )}
    </div>
  );
}

export function QuestList({
  quests,
  checks,
  onToggle,
  photos = [],
  onAddPhoto,
  onRemovePhoto,
}: {
  quests: [ResolvedQuest, ResolvedQuest];
  checks: [boolean, boolean];
  onToggle: (index: 0 | 1) => void;
  photos?: QuestPhoto[];
  onAddPhoto?: (index: 0 | 1, file: File) => Promise<void>;
  onRemovePhoto?: (index: 0 | 1) => Promise<void>;
}) {
  const done = checks.filter(Boolean).length;
  const photoOf = (index: 0 | 1) => photos.find((photo) => photo.index === index);

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

      <QuestCard
        quest={quests[0]}
        checked={checks[0]}
        onToggle={() => onToggle(0)}
        photo={photoOf(0)}
        onAddPhoto={(file) => onAddPhoto?.(0, file) ?? Promise.resolve()}
        onRemovePhoto={() => onRemovePhoto?.(0) ?? Promise.resolve()}
      />
      <QuestCard
        quest={quests[1]}
        checked={checks[1]}
        onToggle={() => onToggle(1)}
        photo={photoOf(1)}
        onAddPhoto={(file) => onAddPhoto?.(1, file) ?? Promise.resolve()}
        onRemovePhoto={() => onRemovePhoto?.(1) ?? Promise.resolve()}
      />
    </section>
  );
}
