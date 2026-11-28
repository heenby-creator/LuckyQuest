"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CHARM_POOL, ELEMENT_HANJA, ELEMENT_META, MBTI_SUMMARY, cardById, charmForDate, type LuckyCard } from "@/lib/content";
import { getDayPhotos, countPhotosByDate, type QuestPhoto } from "@/lib/photos";
import { ageGroupOf, AGE_GROUP_LABEL } from "@/lib/age";
import { chartOf, elementPercent, timeLabel } from "@/lib/saju";
import type { AppState, Element } from "@/lib/types";
import { WEEKDAY_LABEL, dateKey, formatKoreanDate, monthMatrix } from "@/lib/utils";
import { Clover, ElementIcon, Sparkle, StarMascot } from "./illustrations";
import { MorningPushCard } from "./MorningPushCard";

/** 저장된 카드 id로 카드를 되찾는다. 예전 기록(`2026-11-24-수`)도 읽을 수 있게 둔다. */
function resolveCharm(key: string, id: string | undefined): LuckyCard | null {
  if (!id) return null;
  const found = cardById(id);
  if (found) return found;
  const legacy = id.split("-").pop() as Element | undefined;
  if (legacy && CHARM_POOL[legacy]) return charmForDate(key, legacy);
  return null;
}

function DayPhoto({ blob, label }: { blob: Blob; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  if (!url) return <div className="aspect-square animate-pulse rounded-xl bg-cream-3/60" aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={label} className="aspect-square w-full rounded-xl border border-line object-cover" />
  );
}

/* ── 달력 ─────────────────────────────────────────────── */

export function CalendarView({ state }: { state: AppState }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [selected, setSelected] = useState<string>(dateKey(new Date()));
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [selectedPhotos, setSelectedPhotos] = useState<QuestPhoto[]>([]);

  const rows = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const prefix = `${cursor.year}-${`${cursor.month}`.padStart(2, "0")}`;

  const monthDone = Object.keys(state.charms).filter((k) => k.startsWith(prefix)).length;
  const today = dateKey(new Date());

  useEffect(() => {
    let alive = true;
    void countPhotosByDate().then((counts) => {
      if (alive) setPhotoCounts(counts);
    });
    return () => {
      alive = false;
    };
  }, [selected, cursor]);

  useEffect(() => {
    let alive = true;
    void getDayPhotos(selected).then((photos) => {
      if (alive) setSelectedPhotos(photos);
    });
    return () => {
      alive = false;
    };
  }, [selected]);

  const selectedCard = resolveCharm(selected, state.charms[selected]);

  return (
    <div className="space-y-4 px-5 pb-8 pt-2">
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-[21px] font-extrabold tracking-tight text-ink">행운 달력</h1>
          <p className="mt-0.5 text-[12px] text-ink-faint">카드는 클로버로, 인증샷은 카메라로 남아요</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => setCursor((c) => (c.month === 1 ? { year: c.year - 1, month: 12 } : { ...c, month: c.month - 1 }))}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-white/70 text-ink-soft"
          >
            ‹
          </button>
          <span className="text-[13px] font-bold text-ink">{cursor.year}.{`${cursor.month}`.padStart(2, "0")}</span>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => setCursor((c) => (c.month === 12 ? { year: c.year + 1, month: 1 } : { ...c, month: c.month + 1 }))}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-white/70 text-ink-soft"
          >
            ›
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABEL.map((w, i) => (
            <span key={w} className={`pb-1.5 text-[10.5px] font-bold ${i === 0 ? "text-[#C98A73]" : i === 6 ? "text-[#6E93B8]" : "text-ink-faint"}`}>
              {w}
            </span>
          ))}
          {rows.flat().map((key, i) => {
            if (!key) return <span key={`empty-${i}`} />;
            const done = Boolean(state.charms[key]);
            const isToday = key === today;
            const isSelected = key === selected;
            const photos = photoCounts[key] ?? 0;
            const date = Number(key.slice(8));
            return (
              <div key={key} className="flex aspect-square items-center justify-center">
                <button
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-pressed={isSelected}
                  aria-label={`${key} 기록 보기${photos > 0 ? `, 인증샷 ${photos}장` : ""}`}
                  className={`relative flex size-full max-h-[42px] max-w-[42px] flex-col items-center justify-center rounded-xl text-[12px] font-semibold transition ${
                    done
                      ? "bg-leaf-soft text-leaf-strong"
                      : isToday
                        ? "border border-leaf/40 text-ink"
                        : "text-ink-soft hover:bg-cream-2/70"
                  } ${isSelected ? "ring-2 ring-leaf ring-offset-1" : ""}`}
                >
                  <span>{date}</span>
                  {photos > 0 && (
                    <span className="absolute right-0.5 top-0.5 text-[8px] leading-none" aria-hidden>
                      📷
                    </span>
                  )}
                  {done && (
                    <span className="absolute -bottom-0.5">
                      <Clover size={11} />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 고른 날의 카드와 인증샷 */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-extrabold text-ink">{formatKoreanDate(selected)}</p>
          {selectedCard ? (
            <span className="rounded-full bg-cream-2 px-2 py-0.5 text-[10px] font-bold text-[#8A7444]">
              {ELEMENT_META[selectedCard.element].name} 기운
            </span>
          ) : (
            <span className="text-[10.5px] text-ink-faint">카드 없음</span>
          )}
        </div>

        {selectedCard ? (
          <div className="mt-2">
            <p className="font-serif text-[15px] font-medium leading-snug text-[#2F4A3B]">{selectedCard.title}</p>
            <p className="mt-1 text-[11.5px] leading-[1.7] text-ink-soft">
              &ldquo;{selectedCard.quote}&rdquo; — {selectedCard.author}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
            이날은 두 퀘스트를 모두 마치지 않아 카드가 열리지 않았어요.
          </p>
        )}

        <div className="mt-3 border-t border-dashed border-line pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[11.5px] font-bold text-ink-soft">그날의 인증샷</p>
            <span className="text-[10.5px] text-ink-faint">{selectedPhotos.length}장</span>
          </div>
          {selectedPhotos.length > 0 ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {selectedPhotos.map((photo) => (
                <DayPhoto
                  key={photo.id}
                  blob={photo.blob}
                  label={`${formatKoreanDate(selected)} 인증샷`}
                />
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-ink-faint">남긴 인증샷이 없어요.</p>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
            인증샷은 서버로 보내지 않고 이 기기 브라우저에만 저장돼요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "이번 달", value: `${monthDone}일`, tint: "#E6F4EB", color: "#12805C" },
          { label: "연속", value: `${state.streak}일`, tint: "#FBF1D8", color: "#A9873C" },
          { label: "모은 카드", value: `${Object.keys(state.charms).length}장`, tint: "#EEF3FA", color: "#4A86B8" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl px-3 py-3 text-center" style={{ background: item.tint }}>
            <p className="text-[10.5px] font-semibold text-ink-soft">{item.label}</p>
            <p className="mt-0.5 text-[17px] font-extrabold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <p className="rounded-2xl bg-cream-2/70 px-4 py-3 text-[11.5px] leading-relaxed text-ink-soft">
        하루에 퀘스트 두 개를 모두 마치면 카드 한 장이 열리고, 그날이 달력에 남아요.
        하루 쉬어가도 괜찮아요 — 다시 시작하면 새 클로버가 피어나요.
      </p>
    </div>
  );
}

/* ── 카드 보관함 ───────────────────────────────────────── */

export function CharmsView({ state }: { state: AppState }) {
  const entries = Object.entries(state.charms).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="space-y-4 px-5 pb-8 pt-2">
      <div className="px-1">
        <p className="lq-overline">Card Archive</p>
        <h1 className="mt-1 font-serif text-[21px] font-medium tracking-[-0.015em] text-ink">행운 카드 보관함</h1>
        <p className="mt-1 text-[12px] text-ink-faint">지금까지 모은 카드 {entries.length}장</p>
      </div>

      {entries.length === 0 ? (
        <div className="lq-card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span aria-hidden className="lq-card-inner" />
          <StarMascot size={64} mood="idle" />
          <p className="font-serif text-[14.5px] text-ink">아직 모은 카드가 없어요</p>
          <p className="text-[12px] leading-[1.8] text-ink-soft">
            오늘의 퀘스트 두 개를 마치면
            <br />첫 번째 행운 카드가 열려요.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([key, charmId]) => {
            const charm = resolveCharm(key, charmId);
            if (!charm) return null;
            const meta = ELEMENT_META[charm.element];
            return (
              <article key={key} className="lq-card px-4 py-3.5">
                <span aria-hidden className="lq-card-inner" />
                <div className="relative flex items-start gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-line/45 bg-white/70"
                    style={{ boxShadow: `inset 0 0 0 3px ${meta.soft}` }}
                  >
                    <ElementIcon element={charm.element} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-[14px] leading-tight text-ink">{charm.title}</p>
                    <p className="mt-1 text-[10px] tracking-[0.03em] text-ink-soft">
                      {formatKoreanDate(key)} · {meta.name} 기운
                    </p>
                    <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-[#8C8064]">
                      &ldquo;{charm.quote}&rdquo;
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#94804F]">— {charm.author}</p>
                  </div>
                  <Clover size={18} tone="gold" className="mt-0.5 shrink-0 opacity-80" />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── My ───────────────────────────────────────────────── */

export function MeView({
  state,
  onEdit,
  onEditMbti,
  onReset,
  onToast,
}: {
  state: AppState;
  onEdit: () => void;
  /** MBTI 다시 테스트·변경 — Onboarding의 MBTI 구역을 펼친 채로 연다. */
  onEditMbti: () => void;
  onReset: () => void;
  onToast?: (message: string) => void;
}) {
  const chart = chartOf(state.profile);
  const meta = ELEMENT_META[chart.dayMaster];
  const mbti = state.profile.mbti;

  return (
    <div className="space-y-4 px-5 pb-8 pt-2">
      <div className="px-1">
        <h1 className="text-[21px] font-extrabold tracking-tight text-ink">My 럭키</h1>
        <p className="mt-0.5 text-[12px] text-ink-faint">나의 기운과 설정을 확인해요</p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-4" style={{ background: `linear-gradient(120deg, ${meta.soft}, #FFFDF7)` }}>
          <div className="flex size-14 items-center justify-center rounded-full bg-white/80" style={{ boxShadow: `0 0 0 1px ${meta.color}22` }}>
            <ElementIcon element={chart.dayMaster} size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-ink">
              {ELEMENT_META[chart.dayMaster].name} 기운 · {state.profile.mbti ?? "사주 중심"}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-soft">{chart.birthLabel} · {timeLabel(state.profile.time)}</p>
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-bold text-[#7A7057]">
            {chart.hourKnown ? "네 기둥" : "세 기둥"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <p className="text-[10.5px] font-semibold text-ink-faint">연령대 맞춤</p>
          <span className="rounded-full bg-cream-2 px-2 py-0.5 text-[10.5px] font-bold text-[#7A6444]">
            {AGE_GROUP_LABEL[ageGroupOf(state.profile.birth)]}
          </span>
        </div>

        <div className="border-t border-line px-4 py-3.5">
          <p className="mb-2 text-[11.5px] font-bold text-ink-soft">사주 기둥</p>
          <div className="grid grid-cols-4 gap-1.5">
            {chart.pillars.map((p) => (
              <div key={p.label} className={`rounded-xl border px-1 py-2 text-center ${p.known ? "border-line bg-cream-2/50" : "border-dashed border-line bg-white/40"}`}>
                <p className="text-[9.5px] text-ink-faint">{p.label}</p>
                <p className={`mt-0.5 text-[12.5px] font-extrabold ${p.known ? "text-ink" : "text-ink-faint"}`}>{p.value}</p>
                <p className="text-[9px] text-ink-faint">{p.hanja}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-line px-4 py-3.5">
          <p className="mb-2 text-[11.5px] font-bold text-ink-soft">오행 분포</p>
          <div className="space-y-1.5">
            {(["목", "화", "토", "금", "수"] as const).map((el) => {
              const percent = elementPercent(chart.counts[el], chart.total);
              return (
                <div key={el} className="flex items-center gap-2">
                  <span className="flex w-7 items-center gap-1 text-[12px] font-bold text-ink-soft">
                    <ElementIcon element={el} size={13} />{ELEMENT_HANJA[el]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-3/60">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(percent, 3)}%`, background: ELEMENT_META[el].color, opacity: 0.85 }} />
                  </div>
                  <span className="w-9 text-right text-[10px] tabular-nums text-ink-faint">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MBTI 성향 — 한 줄 소개와 함께, 다시 테스트하거나 바꾸는 길을 바로 보여 준다. */}
      <div className="card px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11.5px] font-bold text-ink-soft">MBTI 성향</p>
          {mbti ? (
            <button
              type="button"
              onClick={onEditMbti}
              className="flex items-center gap-1 rounded-full border border-line bg-white/80 px-2.5 py-1 text-[11px] font-bold text-ink-soft transition hover:border-[#cddcc9] hover:text-leaf active:scale-[0.98]"
            >
              다시 테스트 · 변경 <span aria-hidden className="text-ink-faint">›</span>
            </button>
          ) : (
            <span className="rounded-full bg-cream-2 px-2 py-0.5 text-[10.5px] font-bold text-[#7A6444]">사주 중심</span>
          )}
        </div>

        {mbti ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-xl bg-leaf-soft px-2.5 py-1 text-[14px] font-extrabold tracking-[0.04em] text-leaf-strong">
                {mbti}
              </span>
              <span className="text-[10.5px] text-ink-faint">맞춤 퀘스트에 반영 중</span>
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.7] text-ink-soft">{MBTI_SUMMARY[mbti]}</p>
          </>
        ) : (
          <>
            <p className="mt-2 text-[12.5px] font-bold leading-snug text-ink">아직 MBTI가 설정되지 않았어요</p>
            <p className="mt-1 text-[11.5px] leading-[1.7] text-ink-soft">
              4문항 간단 검사로 맞춤 퀘스트를 받아볼 수 있어요. 사주만으로도 계속 볼 수 있어요.
            </p>
            <button
              type="button"
              onClick={onEditMbti}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-leaf py-2.5 text-[13px] font-extrabold text-white shadow-[0_14px_24px_-18px_rgba(18,128,92,0.95)] transition active:scale-[0.99]"
            >
              <Sparkle size={13} color="#FFE27A" />
              MBTI 테스트하기
            </button>
          </>
        )}
      </div>

      <MorningPushCard onNotice={onToast} />

      <div className="space-y-2">
        <button type="button" onClick={onEdit} className="flex w-full items-center justify-between rounded-2xl border border-line bg-white/80 px-4 py-3.5 text-[13.5px] font-bold text-ink">
          내 정보 수정
          <span className="text-ink-faint">›</span>
        </button>
        <button type="button" onClick={onReset} className="flex w-full items-center justify-between rounded-2xl border border-line bg-white/60 px-4 py-3.5 text-[13.5px] font-bold text-[#9A7B63]">
          기록 초기화
          <span className="text-ink-faint">›</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
        <p className="text-[10.5px] text-ink-faint">입력한 정보는 이 기기에만 저장돼요</p>
        <Link
          href="/privacy"
          className="text-[10.5px] font-semibold text-ink-faint underline decoration-line underline-offset-2 transition hover:text-ink-soft"
        >
          개인정보 처리방침
        </Link>
      </div>

      <div className="flex items-start gap-2 rounded-2xl bg-cream-2/70 px-4 py-3">
        <Sparkle size={12} color="#C9A227" className="mt-1 shrink-0" />
        <p className="text-[11px] leading-relaxed text-ink-soft">
          사주는 만세력 라이브러리로 계산해요. 태어난 시간을 모르면 세 기둥으로 계산하고,
          그만큼 운세는 부드럽게 안내해요. 입력한 정보와 인증샷은 이 기기 안에만 저장돼요.
        </p>
      </div>
    </div>
  );
}
