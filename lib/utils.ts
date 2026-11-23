/** 결정적 해시 — 같은 날·같은 프로필이면 항상 같은 결과가 나오도록 */
export function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function pick<T>(items: readonly T[], seed: string): T {
  return items[hash(seed) % items.length];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 로컬 기준 YYYY-MM-DD */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return dateKey(date);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatKoreanDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}월 ${d}일 (${WEEKDAYS[date.getDay()]})`;
}

export function monthMatrix(year: number, month: number): (string | null)[][] {
  // month: 1-12
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const lastDay = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: startOffset }, () => null);
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(
      `${year}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export const WEEKDAY_LABEL = WEEKDAYS;
