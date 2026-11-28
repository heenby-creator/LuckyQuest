"use client";

import Link from "next/link";
import { useMorningPush, type MorningPushStatus } from "./useMorningPush";

/**
 * '마이' 탭의 아침 알림 설정 카드.
 * 기본값은 꺼짐이고, 브라우저·기기 사정으로 켤 수 없을 때는 그 이유를 한 줄로 알려 준다.
 */

const STATUS_TEXT: Record<MorningPushStatus, string> = {
  checking: "알림 상태를 확인하고 있어요…",
  unsupported: "이 브라우저는 알림을 지원하지 않아요. 최신 크롬·사파리에서 켤 수 있어요.",
  "needs-install": "아이폰은 '홈 화면에 추가' 후 켤 수 있어요. 사파리 아래 공유 → 홈 화면에 추가.",
  unconfigured: "알림 발송 서버를 준비하고 있어요. 곧 켤 수 있어요.",
  blocked: "브라우저에서 알림이 차단돼 있어요. 주소창 옆 설정 → 알림 → 허용으로 바꿔 주세요.",
  off: "꺼져 있어요 · 켜면 이 기기에서만 알림을 받아요.",
  on: "켜져 있어요 · 매일 오전 7시에 알려 드려요.",
};

export function MorningPushCard({ onNotice }: { onNotice?: (message: string) => void }) {
  const { view, toggle } = useMorningPush(onNotice);
  const on = view.status === "on";
  const locked =
    view.busy ||
    view.status === "checking" ||
    view.status === "unconfigured" ||
    view.status === "unsupported" ||
    view.status === "needs-install";

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[16px]"
          >
            ☀️
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-extrabold text-ink">아침 7시 운세 알림</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
              오늘의 운세와 작은 퀘스트 2개를 아침에 알려 드려요
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="아침 7시 운세 알림"
          disabled={locked}
          onClick={() => toggle(!on)}
          className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
            on ? "bg-leaf" : "bg-cream-3"
          } ${locked ? "opacity-45" : "hover:brightness-[0.98]"}`}
        >
          <span
            aria-hidden
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all ${
              on ? "left-[22px]" : "left-0.5"
            } ${view.busy ? "animate-pulse" : ""}`}
          />
        </button>
      </div>

      <p
        className={`mt-3 rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
          on ? "bg-leaf-soft/80 text-[#2C5B47]" : "bg-cream-2/70 text-ink-soft"
        }`}
      >
        {view.notice ?? STATUS_TEXT[view.status]}
      </p>

      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 px-0.5 text-[10px] leading-relaxed text-ink-faint">
        알림을 켜면 기기 푸시 주소(익명)만 서버에 저장되고, 끄면 바로 지워요.
        <Link
          href="/privacy"
          className="font-semibold text-ink-faint underline decoration-line underline-offset-2 transition hover:text-ink-soft"
        >
          자세히
        </Link>
      </p>
    </section>
  );
}
