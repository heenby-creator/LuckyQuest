"use client";

import Link from "next/link";
import { useMorningPush, type MorningPushStatus } from "./useMorningPush";

/**
 * 'My' 탭의 아침 알림 설정 카드.
 * 제목 줄 오른쪽 스위치로 켜고 끄고, 아래 안내 박스가 지금 상태를 한 줄로 알려 준다.
 * 기본값은 꺼짐이고, 브라우저·기기 사정으로 켤 수 없을 때는 그 이유를 박스에 보여 준다.
 */

/** 아직 꺼져 있을 때 안내 박스에 두는 기본 문구 */
const GUIDE_TEXT = "오른쪽 버튼을 활성화하면, 매일 아침 운세와 퀘스트 2개를 알려드려요";

const STATUS_TEXT: Record<MorningPushStatus, string> = {
  checking: "알림 상태를 확인하고 있어요…",
  unsupported: "이 브라우저는 알림을 지원하지 않아요. 최신 크롬·사파리에서 켤 수 있어요.",
  "needs-install": "아이폰은 '홈 화면에 추가' 후 켤 수 있어요. 사파리 아래 공유 → 홈 화면에 추가.",
  unconfigured: GUIDE_TEXT,
  blocked: "브라우저에서 알림이 차단돼 있어요. 주소창 옆 설정 → 알림 → 허용으로 바꿔 주세요.",
  off: GUIDE_TEXT,
  on: "매일 아침 7시 알림이 켜져 있어요",
};

/** 스위치를 눌러도 켜지지 않고, 누른 자리에서 이유를 토스트로 알려 줄 상태 */
const BLOCKING: MorningPushStatus[] = ["unsupported", "needs-install", "blocked"];

export function MorningPushCard({ onNotice }: { onNotice?: (message: string) => void }) {
  const { view, toggle } = useMorningPush(onNotice);
  const on = view.status === "on";
  /** 확인 중이거나 저장 중일 때만 잠깐 누를 수 없게 한다 — 나머지는 눌러서 안내를 받는다. */
  const waiting = view.busy || view.status === "checking";

  const handleToggle = () => {
    if (waiting) return;
    if (BLOCKING.includes(view.status)) {
      onNotice?.(STATUS_TEXT[view.status]);
      return;
    }
    toggle(!on);
  };

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[16px]"
          >
            ☀️
          </span>
          <p className="text-[13.5px] font-extrabold leading-snug text-ink">
            매일 아침 7시, 운세 알림 받기
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="매일 아침 7시, 운세 알림 받기"
          disabled={waiting}
          onClick={handleToggle}
          className={`relative h-7 w-[50px] shrink-0 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${
            on ? "border-leaf-strong bg-leaf" : "border-[#8B7D62] bg-[#BDAC8C]"
          } ${waiting ? "cursor-default opacity-80" : "cursor-pointer hover:brightness-[1.04] active:brightness-95"}`}
        >
          <span
            aria-hidden
            className={`absolute left-[2px] top-[2px] size-[22px] rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform ${
              on ? "translate-x-[22px]" : "translate-x-0"
            } ${view.busy ? "animate-pulse" : ""}`}
          />
        </button>
      </div>

      <p
        className={`mt-3 break-keep rounded-2xl border px-3 py-2.5 text-[11.5px] leading-relaxed ${
          on
            ? "border-leaf/25 bg-leaf-soft/80 text-[#2C5B47]"
            : "border-line bg-cream-2/70 text-ink-soft"
        }`}
      >
        {STATUS_TEXT[view.status]}
      </p>

      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 break-keep px-0.5 text-[10px] leading-relaxed text-ink-faint">
        알림을 켜면 단말기 주소(익명)만 서버에 저장되고, 끄면 바로 지워져요.
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
