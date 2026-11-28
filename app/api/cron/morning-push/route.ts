import { NextResponse } from "next/server";
import {
  hasVapidKeys,
  isPushConfigured,
  listSubscriptions,
  removeSubscription,
  vapidSubject,
} from "@/lib/pushStore";

/**
 * 아침 7시(KST) 운세 알림 발송 — Vercel Cron이 부르는 곳.
 *
 * vercel.json의 크론은 `0 22 * * *`(UTC) = 매일 07:00 KST 한 번이다.
 * Vercel Cron은 GET으로 부르고, CRON_SECRET을 설정해 두면
 * `Authorization: Bearer <CRON_SECRET>` 헤더를 자동으로 붙여 준다.
 *
 * 문구는 스포일 없이 "도착했다"까지만 알린다 — 무슨 기운인지, 어떤 퀘스트인지는
 * 앱을 열어야 보이게 둔다. 만료된 구독(404/410)은 그 자리에서 지운다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 구독이 늘어도 한 번에 끝나도록 여유를 둔다(Hobby 상한 60초).
export const maxDuration = 60;

const NOTIFICATION = {
  title: "☀️ 오늘의 행운 퀘스트가 도착했어요",
  body: "오전 7시, 오늘의 운세와 작은 퀘스트 2개를 확인해 보세요!",
  url: "/",
  icon: "/icons/icon-192.png",
  tag: "lucky-quest-daily",
};

/** 한 번에 보내는 개수 — 푸시 서비스가 느려도 전체가 매달리지 않게 나눈다. */
const CONCURRENCY = 10;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) {
    return json(
      { ok: false, message: "CRON_SECRET이 설정되지 않아 발송하지 않았어요." },
      503,
    );
  }

  const authorization = request.headers.get("authorization") || "";
  if (authorization !== `Bearer ${secret}`) {
    return json({ ok: false, message: "인증되지 않은 요청이에요." }, 401);
  }

  if (!isPushConfigured()) {
    const missing = [
      !hasVapidKeys() ? "VAPID 키" : null,
      !process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL ? "Redis(KV)" : null,
    ].filter(Boolean);
    return json(
      {
        ok: false,
        message: `알림 발송 설정이 아직 없어요: ${missing.join(", ")}`,
      },
      503,
    );
  }

  let subscriptions;
  try {
    subscriptions = await listSubscriptions();
  } catch {
    return json({ ok: false, message: "구독 목록을 읽지 못했어요." }, 502);
  }

  if (subscriptions.length === 0) {
    return json({ ok: true, total: 0, sent: 0, removed: 0, failed: 0 }, 200);
  }

  const webpush = await import("web-push");
  webpush.setVapidDetails(
    vapidSubject(),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );

  const payload = JSON.stringify(NOTIFICATION);
  let sent = 0;
  const expired: string[] = [];
  let failed = 0;

  for (let index = 0; index < subscriptions.length; index += CONCURRENCY) {
    const batch = subscriptions.slice(index, index + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            { endpoint: subscription.endpoint, keys: subscription.keys, expirationTime: subscription.expirationTime ?? null },
            payload,
            { TTL: 60 * 60 * 6, urgency: "normal" },
          );
          return { endpoint: subscription.endpoint, status: 201 as number };
        } catch (error) {
          const statusCode =
            typeof (error as { statusCode?: unknown }).statusCode === "number"
              ? ((error as { statusCode: number }).statusCode)
              : 0;
          return { endpoint: subscription.endpoint, status: statusCode };
        }
      }),
    );

    for (const result of results) {
      if (result.status >= 200 && result.status < 300) sent += 1;
      // 404·410은 브라우저가 구독을 버린 경우 — 저장소에서 지운다.
      // 그 밖의 실패(일시적 5xx, 네트워크)는 다음 날 다시 시도한다.
      else if (result.status === 404 || result.status === 410) expired.push(result.endpoint);
      else failed += 1;
    }
  }

  let removed = 0;
  for (const endpoint of expired) {
    try {
      removed += await removeSubscription(endpoint);
    } catch {
      /* 지우지 못해도 발송 결과에는 영향이 없다 — 다음 실행에서 다시 정리된다 */
    }
  }

  return json({ ok: true, total: subscriptions.length, sent, removed, failed }, 200);
}
