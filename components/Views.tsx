"use client";

import { useMemo, useState } from "react";
import { CHARMS, ELEMENT_META } from "@/lib/content";
import { chartOf, elementPercent, timeLabel } from "@/lib/saju";
import type { AppState } from "@/lib/types";
import { WEEKDAY_LABEL, dateKey, formatKoreanDate, monthMatrix } from "@/lib/utils";
import { Clover, ElementIcon, Sparkle, StarMascot } from "./illustrations";

/* ── 달력 ─────────────────────────────────────────────── */

export function CalendarView({ state }: { state: AppState }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const rows = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const prefix = `${cursor.year}-${`${cursor.month}`.padStart(2, "0")}`;

  const monthDone = Object.keys(state.charms).filter((k) => k.startsWith(prefix)).length;
  const today = dateKey(new Date());

  return (
    <div className="space-y-4 px-5 pb-8 pt-2">
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-[21px] font-extrabold tracking-tight text-ink">행운 달력</h1>
          <p className="mt-0.5 text-[12px] text-ink-faint">카드를 받은 날이 클로버로 남아요</p>
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
            const date = Number(key.slice(8));
            return (
              <div key={key} className="flex aspect-square items-center justify-center">
                <div
                  className={`relative flex size-full max-h-[42px] max-w-[42px] flex-col items-center justify-center rounded-xl text-[12px] font-semibold ${
                    done
                      ? "bg-leaf-soft text-leaf-strong"
                      : isToday
                        ? "border border-leaf/40 text-ink"
                        : "text-ink-soft"
                  }`}
                >
                  <span>{date}</span>
                  {done && (
                    <span className="absolute -bottom-0.5">
                      <Clover size={11} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
        <h1 className="mt-1 font-serif text-[21px] font-medium tracking-[-0.015em] text-ink">카드 보관함</h1>
        <p className="mt-1 text-[12px] text-ink-faint">지금까지 모은 카드 {entries.length}장</p>
      </div>

      {entries.length === 0 ? (
        <div className="lq-card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span aria-hidden className="lq-card-inner" />
          <StarMascot size={64} mood="idle" />
          <p className="font-serif text-[14.5px] text-ink">아직 모은 카드가 없어요</p>
          <p className="text-[12px] leading-[1.8] text-ink-soft">
            오늘의 퀘스트 두 개를 마치면
            <br />첫 번째 카드가 열려요.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([key, charmId]) => {
            const element = charmId.split("-").pop() as keyof typeof CHARMS;
            const charm = CHARMS[element];
            if (!charm) return null;
            const meta = ELEMENT_META[element];
            return (
              <article key={key} className="lq-card px-4 py-3.5">
                <span aria-hidden className="lq-card-inner" />
                <div className="relative flex items-center gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-line/45 bg-white/70"
                    style={{ boxShadow: `inset 0 0 0 3px ${meta.soft}` }}
                  >
                    <ElementIcon element={element} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-[14px] leading-tight text-ink">{charm.title}</p>
                    <p className="mt-1 text-[10px] tracking-[0.03em] text-ink-soft">
                      {formatKoreanDate(key)} · {meta.name} 기운
                    </p>
                  </div>
                  <Clover size={18} tone="gold" className="shrink-0 opacity-80" />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── 마이 ─────────────────────────────────────────────── */

export function MeView({
  state,
  onEdit,
  onReset,
}: {
  state: AppState;
  onEdit: () => void;
  onReset: () => void;
}) {
  const chart = chartOf(state.profile);
  const meta = ELEMENT_META[chart.dayMaster];

  return (
    <div className="space-y-4 px-5 pb-8 pt-2">
      <div className="px-1">
        <h1 className="text-[21px] font-extrabold tracking-tight text-ink">마이 럭키</h1>
        <p className="mt-0.5 text-[12px] text-ink-faint">나의 기운과 설정을 확인해요</p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-4" style={{ background: `linear-gradient(120deg, ${meta.soft}, #FFFDF7)` }}>
          <div className="flex size-14 items-center justify-center rounded-full bg-white/80" style={{ boxShadow: `0 0 0 1px ${meta.color}22` }}>
            <ElementIcon element={chart.dayMaster} size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-ink">{chart.dayMaster} 일간 · {state.profile.mbti}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-soft">{chart.birthLabel} · {timeLabel(state.profile.time)}</p>
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-bold text-[#7A7057]">
            {chart.hourKnown ? "네 기둥" : "세 기둥"}
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
                  <span className="flex w-6 items-center gap-1 text-[10.5px] font-bold text-ink-soft">
                    <ElementIcon element={el} size={13} />{el}
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

      <div className="flex items-start gap-2 rounded-2xl bg-cream-2/70 px-4 py-3">
        <Sparkle size={12} color="#C9A227" className="mt-1 shrink-0" />
        <p className="text-[11px] leading-relaxed text-ink-soft">
          사주는 만세력 라이브러리로 계산해요. 태어난 시간을 모르면 세 기둥으로 계산하고,
          그만큼 운세는 부드럽게 안내해요. 입력한 정보는 이 기기 안에만 저장돼요.
        </p>
      </div>
    </div>
  );
}
