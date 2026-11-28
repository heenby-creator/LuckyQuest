/**
 * 웹 푸시 구독 저장소 — Upstash Redis REST API를 fetch로만 다룬다.
 *
 * 왜 SDK를 쓰지 않나: 서버리스 함수 한 번 도는 데 필요한 건 HSET/HDEL/HGETALL 세 가지뿐이라
 * 의존성을 늘리지 않고 REST를 직접 부른다.
 *
 * 환경변수는 두 이름을 모두 받는다(Vercel의 Upstash 연동은 KV_*, Upstash 콘솔은 UPSTASH_REDIS_REST_*).
 *   - KV_REST_API_URL / KV_REST_API_TOKEN
 *   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * 아직 연결 전이면 isPushConfigured()가 false를 돌려주고, 부르는 쪽이 503으로 안내한다.
 * 이 파일은 빌드 때 값이 없어도 절대 throw하지 않는다(모든 확인은 호출 시점).
 */

/** Redis 해시 하나에 endpoint를 field로, 구독 JSON을 value로 담는다. 같은 기기는 자연히 한 건으로 유지된다. */
const SUBS_KEY = "lq:push:subs";

export type StoredSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  /** 구독을 켠 시각(ISO). 운영 중 만료 구독을 가려낼 때 참고한다. */
  createdAt: string;
};

type RedisConfig = { url: string; token: string };

function redisConfig(): RedisConfig | null {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/** 구독 목록을 담아 둘 Redis가 연결됐는지. */
export function isPushStorageConfigured(): boolean {
  return redisConfig() !== null;
}

/** VAPID 키(알림 서명에 쓰는 키 쌍)가 준비됐는지. */
export function hasVapidKeys(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/** 저장소와 VAPID 키가 모두 있어야 실제 발송이 가능하다. */
export function isPushConfigured(): boolean {
  return isPushStorageConfigured() && hasVapidKeys();
}

/** 발송자 표기. VAPID subject는 mailto: 또는 https: 여야 한다. */
export function vapidSubject(): string {
  const subject = (process.env.VAPID_SUBJECT || "").trim();
  if (subject.startsWith("mailto:") || subject.startsWith("https://")) return subject;
  return "mailto:heenby@gmail.com";
}

/**
 * Upstash REST에 명령 하나를 보낸다.
 * 응답은 { result } 또는 { error } 모양이고, 네트워크가 막히면 예외가 난다.
 */
async function redisCommand(args: (string | number)[]): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new Error("push store is not configured");

  let response: Response;
  try {
    response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      // 발송 함수가 오래 매달리지 않도록 짧게 끊는다.
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch {
    throw new Error("push store request failed");
  }

  if (!response.ok) throw new Error(`push store responded ${response.status}`);

  const body = (await response.json()) as { result?: unknown; error?: string };
  if (body.error) throw new Error(`push store error: ${body.error}`);
  return body.result;
}

/** 구독 하나를 저장한다(같은 endpoint면 덮어쓴다). */
export async function saveSubscription(subscription: StoredSubscription): Promise<void> {
  await redisCommand(["HSET", SUBS_KEY, subscription.endpoint, JSON.stringify(subscription)]);
}

/** 구독 하나를 지운다. 지운 건수를 돌려준다. */
export async function removeSubscription(endpoint: string): Promise<number> {
  const result = await redisCommand(["HDEL", SUBS_KEY, endpoint]);
  return typeof result === "number" ? result : 0;
}

/** 저장된 구독 전체를 읽는다. 깨진 값은 조용히 건너뛴다. */
export async function listSubscriptions(): Promise<StoredSubscription[]> {
  const result = await redisCommand(["HGETALL", SUBS_KEY]);
  if (!result) return [];

  // Upstash는 [field, value, field, value...] 평면 배열로 준다. 객체로 주는 경우도 받아 둔다.
  const values: unknown[] = Array.isArray(result)
    ? result.filter((_, index) => index % 2 === 1)
    : Object.values(result as Record<string, unknown>);

  const subscriptions: StoredSubscription[] = [];
  for (const value of values) {
    const parsed = typeof value === "string" ? safeParse(value) : value;
    const subscription = normalizeSubscription(parsed);
    if (subscription) subscriptions.push(subscription);
  }
  return subscriptions;
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * 들어온 값(요청 본문이든 저장된 값이든)을 구독 모양으로 다듬는다.
 * 모양이 어긋나면 null — 라우트는 이걸로 400을 돌려준다.
 */
export function normalizeSubscription(input: unknown): StoredSubscription | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as {
    endpoint?: unknown;
    expirationTime?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
    createdAt?: unknown;
  };

  const endpoint = typeof raw.endpoint === "string" ? raw.endpoint.trim() : "";
  if (!endpoint || endpoint.length > 2048) return null;
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }

  const p256dh = typeof raw.keys?.p256dh === "string" ? raw.keys.p256dh.trim() : "";
  const auth = typeof raw.keys?.auth === "string" ? raw.keys.auth.trim() : "";
  if (!p256dh || !auth || p256dh.length > 255 || auth.length > 255) return null;

  const expirationTime = typeof raw.expirationTime === "number" ? raw.expirationTime : null;
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt ? raw.createdAt : new Date().toISOString();

  return { endpoint, expirationTime, keys: { p256dh, auth }, createdAt };
}
