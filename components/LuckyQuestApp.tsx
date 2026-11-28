"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CharmCard } from "./CharmCard";
import { FortuneCard } from "./FortuneCard";
import { Onboarding } from "./Onboarding";
import { QuestList } from "./QuestList";
import { CalendarView, CharmsView, MeView } from "./Views";
import { Clover, NavIcon, Sparkle, StarMascot, type NavKey } from "./illustrations";
import { buildDaily } from "@/lib/engine";
import { isKakaoTalkBrowser, trackEvent } from "@/lib/analytics";
import { deleteQuestPhoto, getDayPhotos, preparePhoto, saveQuestPhoto, type QuestPhoto } from "@/lib/photos";
import { shareText, shareUrl } from "@/lib/share";
import { clearState, ensureDay, freshState, loadState, saveState, todayKey, toggleCheck } from "@/lib/storage";
import type { AppState, Profile } from "@/lib/types";

const TABS: { key: NavKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "calendar", label: "달력" },
  { key: "charms", label: "보관함" },
  { key: "me", label: "My" },
];

export function LuckyQuestApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<NavKey>("today");
  const [editing, setEditing] = useState(false);
  const [focusMbti, setFocusMbti] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState<null | "menu" | "about">(null);
  const [mood, setMood] = useState<"idle" | "cheer">("idle");
  const [photos, setPhotos] = useState<QuestPhoto[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [tab, editing]);

  const daily = useMemo(() => {
    if (!state) return null;
    return buildDaily(state.profile);
  }, [state]);

  // 오늘의 퀘스트 기록이 없으면 만들어 둬요.
  useEffect(() => {
    if (!state || !daily) return;
    const next = ensureDay(state, [daily.quests[0].id, daily.quests[1].id]);
    if (next !== state) {
      setState(next);
      saveState(next);
    }
  }, [state, daily]);

  // 그날 남긴 인증샷 — 브라우저(IndexedDB)에서만 읽는다.
  useEffect(() => {
    if (!daily) return;
    let alive = true;
    void getDayPhotos(daily.dateKey).then((list) => {
      if (alive) setPhotos(list);
    });
    return () => {
      alive = false;
    };
  }, [daily]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (mood !== "cheer") return;
    const t = window.setTimeout(() => setMood("idle"), 1400);
    return () => window.clearTimeout(t);
  }, [mood]);

  const day = state && daily ? state.days[daily.dateKey] : undefined;

  const onSaveProfile = useCallback(
    (profile: Profile) => {
      const firstTime = !state;
      setState((prev) => {
        const base = prev ?? freshState(profile);
        const days = { ...base.days };
        // 생년월일·MBTI가 바뀌면 오늘 퀘스트를 새로 배정해요.
        delete days[todayKey()];
        const next: AppState = { ...base, profile, days };
        saveState(next);
        return next;
      });
      setEditing(false);
      setFocusMbti(false);
      setTab("today");
      setToast("정보를 저장했어요 ☘️");
      trackEvent("onboarding_complete", {
        first_time: firstTime,
        mbti: profile.mbti ?? "none",
        time_known: profile.time.kind === "jin",
        lunar: profile.birth.isLunar,
      });
    },
    [state],
  );

  const onToggle = useCallback(
    (index: 0 | 1) => {
      if (!state || !daily || !day) return;
      const next = toggleCheck(state, index, daily.charm.id);
      const willUnlock = !day.unlockedAt && Boolean(next.days[daily.dateKey]?.unlockedAt);
      const nowChecked = Boolean(next.days[daily.dateKey]?.checks[index]);
      setState(next);
      saveState(next);
      setMood("cheer");
      if (nowChecked) {
        trackEvent("quest_complete", {
          quest_index: (index + 1) as 1 | 2,
          quest_badge: daily.quests[index].badge,
        });
      }
      if (willUnlock) {
        trackEvent("card_unlock", { date: daily.dateKey, streak: next.streak });
        setJustUnlocked(true);
        setToast("오늘의 행운 카드가 열렸어요! 🍀");
        window.setTimeout(() => setJustUnlocked(false), 3200);
      }
    },
    [state, daily, day],
  );

  const onAddPhoto = useCallback(
    async (index: 0 | 1, file: File) => {
      if (!daily) return;
      try {
        const prepared = await preparePhoto(file);
        const saved = await saveQuestPhoto(daily.dateKey, index, prepared);
        setPhotos((prev) => [...prev.filter((photo) => photo.index !== index), saved].sort((a, b) => a.index - b.index));
        setToast("인증샷을 저장했어요 · 이 기기에만");
        trackEvent("photo_attach", { quest_index: (index + 1) as 1 | 2 });
      } catch {
        setToast("사진을 저장하지 못했어요");
      }
    },
    [daily],
  );

  const onRemovePhoto = useCallback(
    async (index: 0 | 1) => {
      if (!daily) return;
      try {
        await deleteQuestPhoto(daily.dateKey, index);
        setPhotos((prev) => prev.filter((photo) => photo.index !== index));
        setToast("인증샷을 지웠어요");
      } catch {
        setToast("인증샷을 지우지 못했어요");
      }
    },
    [daily],
  );

  const onShare = useCallback(async () => {
    if (!daily) return;
    const text = shareText({ title: daily.charm.title, quote: daily.charm.quote, author: daily.charm.author });
    // 카드의 날짜를 링크에 담아, 들어온 사람이 그 카드의 미리보기를 보게 한다.
    const url = shareUrl(daily.dateKey);
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const viaKakao = isKakaoTalkBrowser();
    if (nav?.share) {
      try {
        await nav.share({ title: "Lucky Quest", text, url });
        if (viaKakao) trackEvent("share_kakao", { date: daily.dateKey, method: "kakaotalk" });
        else trackEvent("share_link", { date: daily.dateKey, method: "native_share" });
        return;
      } catch {
        return;
      }
    }
    try {
      await nav?.clipboard?.writeText(`${text}\n${url}`);
      setToast("카드 링크를 복사했어요");
      trackEvent("share_link", { date: daily.dateKey, method: "clipboard" });
    } catch {
      setToast("luckyquest.app 에서 만나요");
    }
  }, [daily]);

  const onReset = useCallback(() => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("지금까지의 기록(연속일수·카드)을 지우고 처음부터 시작할까요?");
    if (!ok) return;
    clearState();
    setState(null);
    setEditing(false);
    setTab("today");
    setMenu(null);
  }, []);

  if (!loaded) {
    return (
      <div className="lq-backdrop flex min-h-dvh items-center justify-center p-4">
        <div className="lq-phone-shell flex h-dvh w-full max-w-[430px] flex-col items-center justify-center md:h-[860px]">
          <div className="anim-bob"><StarMascot size={64} /></div>
          <p className="mt-3 text-[13px] font-semibold text-ink-soft">오늘의 행운을 준비하고 있어요…</p>
        </div>
      </div>
    );
  }

  const showOnboarding = !state || editing;

  return (
    <div className="lq-backdrop flex min-h-dvh items-center justify-center md:p-6">
      <div className="lq-phone-shell relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden md:h-[880px] md:max-h-[calc(100dvh-48px)]">
        {showOnboarding ? (
          <main className="lq-scroll flex-1 overflow-y-auto">
            <Onboarding
              initial={state?.profile ?? null}
              onSave={onSaveProfile}
              onCancel={editing && state ? () => { setEditing(false); setFocusMbti(false); } : undefined}
              focusMbti={focusMbti}
            />
          </main>
        ) : (
          <>
            {/* 헤더 */}
            <header className="relative z-20 shrink-0 border-b border-line/60 bg-cream/85 px-4 pb-2 pt-[max(10px,env(safe-area-inset-top))] backdrop-blur">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="메뉴 열기"
                  onClick={() => setMenu("menu")}
                  className="flex size-8 shrink-0 flex-col items-center justify-center gap-[4px] rounded-lg text-ink-soft transition hover:bg-cream-2"
                >
                  <span className="block h-[1.6px] w-[15px] rounded-full bg-current" />
                  <span className="block h-[1.6px] w-[15px] rounded-full bg-current" />
                  <span className="block h-[1.6px] w-[10px] rounded-full bg-current" />
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <StarMascot size={40} mood={mood} />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1">
                      <h1 className="text-[20px] font-extrabold leading-none tracking-tight text-leaf">Lucky Quest</h1>
                    </div>
                    <p className="mt-1 flex items-center gap-1 truncate text-[10.5px] text-ink-soft">
                      오늘도 행운 가득한 하루 보내세요!
                      <Clover size={10} className="shrink-0" />
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTab("calendar")}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-extrabold transition ${
                    (state?.streak ?? 0) > 0
                      ? "border-[#F4D9A8] bg-[#FFF4DE] text-[#C1772A]"
                      : "border-line bg-white/70 text-ink-faint"
                  }`}
                >
                  <span className="text-[12px]">{(state?.streak ?? 0) > 0 ? "🔥" : "☘️"}</span>
                  {(state?.streak ?? 0) > 0 ? `${state?.streak}일 연속` : "첫 날"}
                </button>
              </div>
            </header>

            {/* 본문 */}
            <main ref={mainRef} className="lq-scroll relative flex-1 overflow-y-auto">
              {tab === "today" && daily && day && (
                <div className="space-y-4 px-4 pb-8 pt-3">
                  <FortuneCard
                    daily={daily}
                    onOpenMbti={() => {
                      setFocusMbti(true);
                      setEditing(true);
                    }}
                  />
                  <QuestList
                    quests={daily.quests}
                    checks={day.checks}
                    onToggle={onToggle}
                    photos={photos}
                    onAddPhoto={onAddPhoto}
                    onRemovePhoto={onRemovePhoto}
                  />
                  <CharmCard
                    daily={daily}
                    unlocked={Boolean(day.unlockedAt)}
                    justUnlocked={justUnlocked}
                    onShare={onShare}
                    done={day.checks.filter(Boolean).length}
                    photos={photos}
                    onToast={setToast}
                  />
                  <p className="flex items-center justify-center gap-1.5 pb-1 text-center text-[10.5px] text-ink-faint">
                    <Sparkle size={10} color="#C9B98C" />
                    매일 0시에 새로운 운세와 퀘스트가 열려요
                  </p>
                </div>
              )}

              {tab === "calendar" && state && <CalendarView state={state} />}
              {tab === "charms" && state && <CharmsView state={state} />}
              {tab === "me" && state && (
                <MeView
                  state={state}
                  onEdit={() => { setFocusMbti(false); setEditing(true); }}
                  onEditMbti={() => { setFocusMbti(true); setEditing(true); }}
                  onReset={onReset}
                  onToast={setToast}
                />
              )}
            </main>

            {/* 하단 탭 */}
            <nav className="relative z-20 shrink-0 border-t border-line/70 bg-cream/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
              <div className="flex items-center justify-around">
                {TABS.map((t) => {
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className="flex flex-1 flex-col items-center gap-0.5 py-0.5"
                      aria-current={active ? "page" : undefined}
                    >
                      <span className={`flex h-7 items-center justify-center rounded-full px-4 transition ${active ? "bg-leaf-soft" : ""}`}>
                        <NavIcon name={t.key} active={active} />
                      </span>
                      <span className={`text-[10px] font-bold ${active ? "text-leaf" : "text-ink-faint"}`}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        {/* 토스트 */}
        {toast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-24 z-40 flex justify-center px-6">
            <div className="anim-fade-up flex items-center gap-1.5 rounded-full bg-ink/90 px-4 py-2.5 text-[12px] font-semibold text-cream shadow-lg">
              <Clover size={13} tone="gold" />
              {toast}
            </div>
          </div>
        )}

        {/* 시트 */}
        {menu && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-ink/30 backdrop-blur-[2px]" onClick={() => setMenu(null)}>
            <div
              className="anim-fade-up rounded-t-[28px] bg-[#FFFDF7] px-5 pb-7 pt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
              {menu === "menu" ? (
                <div className="space-y-1.5">
                  <p className="mb-2 px-1 text-[11px] font-bold text-ink-faint">메뉴</p>
                  <button type="button" onClick={() => { setMenu(null); setFocusMbti(false); setEditing(true); }} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-[14px] font-bold text-ink hover:bg-cream-2">
                    내 정보 수정 <span className="text-ink-faint">›</span>
                  </button>
                  <button type="button" onClick={() => setMenu("about")} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-[14px] font-bold text-ink hover:bg-cream-2">
                    Lucky Quest 소개 <span className="text-ink-faint">›</span>
                  </button>
                  <button type="button" onClick={() => setMenu(null)} className="mt-1 w-full rounded-2xl bg-cream-2 py-3 text-[13.5px] font-bold text-ink-soft">
                    닫기
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <StarMascot size={38} />
                    <div>
                      <p className="text-[15px] font-extrabold text-ink">Lucky Quest</p>
                      <p className="text-[10.5px] text-ink-faint">luckyquest.app</p>
                    </div>
                  </div>
                  <p className="text-[12.5px] leading-[1.8] text-ink-soft">
                    오늘의 날씨가 되는 사주 오행과, 나다운 행동을 알려주는 MBTI를 담았어요.
                    하루 한두 걸음의 작은 퀘스트로 기운을 채우면 오늘의 행운 카드가 열립니다.
                  </p>
                  <p className="mt-2 text-[11px] text-ink-faint">
                    입력한 생년월일과 MBTI, 인증샷은 이 기기에만 저장되고 어디에도 보내지 않아요.
                  </p>
                  <button type="button" onClick={() => setMenu(null)} className="mt-4 w-full rounded-2xl bg-leaf py-3 text-[13.5px] font-bold text-white">
                    좋아요, 계속할게요
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
