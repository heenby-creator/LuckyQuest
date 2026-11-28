import { NextResponse } from "next/server";
import {
  isPushConfigured,
  isPushStorageConfigured,
  normalizeSubscription,
  removeSubscription,
  saveSubscription,
} from "@/lib/pushStore";

/**
 * 아침 알림 구독 등록·해제·상태 확인.
 *
 * 이 앱은 회원가입이 없다. 저장하는 건 브라우저가 만든 익명 푸시 주소(endpoint)와
 * 알림 암호화용 키뿐이고, 알림을 끄면 그 자리에서 지운다.
 *
 * Redis(Upstash)가 연결되기 전에는 503과 안내 문구를 돌려준다 — 화면은 이걸 받아
 * "준비 중"이라고만 말하고, 저장이나 발송을 시도하지 않는다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORAGE_MESSAGE =
  "알림 저장소가 아직 연결되지 않았어요. 준비되면 다시 시도해 주세요.";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** 클라이언트가 켜기 전에 확인하는 상태 — 서버 설정 여부와 VAPID 공개키. */
export async function GET() {
  return json(
    {
      configured: isPushConfigured(),
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    },
    200,
  );
}

export async function POST(request: Request) {
  if (!isPushStorageConfigured()) {
    return json({ ok: false, configured: false, message: NO_STORAGE_MESSAGE }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "요청 형식을 읽지 못했어요." }, 400);
  }

  const subscription = normalizeSubscription(body);
  if (!subscription) {
    return json({ ok: false, message: "푸시 구독 정보가 올바르지 않아요." }, 400);
  }

  try {
    await saveSubscription(subscription);
    return json({ ok: true }, 200);
  } catch {
    return json({ ok: false, message: "알림 구독을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." }, 502);
  }
}

export async function DELETE(request: Request) {
  if (!isPushStorageConfigured()) {
    return json({ ok: false, configured: false, message: NO_STORAGE_MESSAGE }, 503);
  }

  // 본문(JSON)으로도, 주소 끝의 ?endpoint=로도 받는다. 푸시 주소는 길어서 본문을 우선한다.
  let endpoint = new URL(request.url).searchParams.get("endpoint") ?? "";
  if (!endpoint) {
    try {
      const body = (await request.json()) as { endpoint?: unknown };
      if (typeof body?.endpoint === "string") endpoint = body.endpoint;
    } catch {
      /* 본문이 없으면 쿼리만 본다 */
    }
  }

  if (!endpoint.trim()) {
    return json({ ok: false, message: "지울 구독 주소가 없어요." }, 400);
  }

  try {
    const removed = await removeSubscription(endpoint.trim());
    return json({ ok: true, removed }, 200);
  } catch {
    return json({ ok: false, message: "알림 구독을 지우지 못했어요. 잠시 뒤 다시 시도해 주세요." }, 502);
  }
}
