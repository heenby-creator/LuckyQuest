import type { AppState, DayRecord, Profile } from "./types";
import { addDays, dateKey } from "./utils";

const KEY = "luckyquest.state.v1";

export function todayKey(): string {
  return dateKey(new Date());
}

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !parsed.profile) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 저장 공간이 가득찼을 때는 조용히 넘어가요 */
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function freshState(profile: Profile): AppState {
  return { profile, days: {}, streak: 0, lastCompleteDate: null, charms: {} };
}

export function ensureDay(state: AppState, quests: [string, string]): AppState {
  const key = todayKey();
  if (state.days[key]) return state;
  const day: DayRecord = { quests, checks: [false, false], unlockedAt: null };
  return { ...state, days: { ...state.days, [key]: day } };
}

export function toggleCheck(state: AppState, index: 0 | 1, charmId: string): AppState {
  const key = todayKey();
  const day = state.days[key];
  if (!day) return state;

  const checks: [boolean, boolean] = [...day.checks] as [boolean, boolean];
  checks[index] = !checks[index];

  const bothDone = checks[0] && checks[1];
  const wasUnlocked = Boolean(day.unlockedAt);
  const unlockedAt = bothDone && !wasUnlocked ? new Date().toISOString() : day.unlockedAt;

  let streak = state.streak;
  let lastCompleteDate = state.lastCompleteDate;
  const charms = { ...state.charms };

  // 오늘 처음으로 두 퀘스트를 모두 마쳤을 때만 연속일수를 갱신해요.
  if (bothDone && !wasUnlocked) {
    if (state.lastCompleteDate === addDays(key, -1)) {
      streak = state.streak + 1;
    } else if (state.lastCompleteDate === key) {
      streak = Math.max(state.streak, 1);
    } else {
      streak = 1;
    }
    lastCompleteDate = key;
    charms[key] = charmId;
  }

  return {
    ...state,
    streak,
    lastCompleteDate,
    charms,
    days: { ...state.days, [key]: { ...day, checks, unlockedAt } },
  };
}

export function completedCount(state: AppState): number {
  return Object.keys(state.charms).length;
}
