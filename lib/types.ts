export type Element = "목" | "화" | "토" | "금" | "수";

export type Mbti =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export type BirthTime =
  | { kind: "unknown" }
  | { kind: "jin"; index: number } // 0 = 자시 … 11 = 해시
  | { kind: "exact"; hour: number; minute: number };

export interface Birth {
  year: number;
  month: number;
  day: number;
  isLunar: boolean;
  isLeapMonth: boolean;
}

export interface Profile {
  birth: Birth;
  time: BirthTime;
  /** MBTI를 모르고 '사주 중심'으로 시작한 경우 null */
  mbti: Mbti | null;
  createdAt: string;
}

export interface DayRecord {
  /** 오늘 배정된 퀘스트 id (Quest1, Quest2) */
  quests: [string, string];
  checks: [boolean, boolean];
  /** 두 퀘스트를 모두 체크한 순간의 타임스탬프. 한 번 열린 카드는 그날 유지된다. */
  unlockedAt: string | null;
}

export interface AppState {
  profile: Profile;
  days: Record<string, DayRecord>;
  streak: number;
  lastCompleteDate: string | null;
  /** 모은 카드 (날짜 → 카드 id) */
  charms: Record<string, string>;
}
