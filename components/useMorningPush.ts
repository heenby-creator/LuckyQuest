"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * '아침 7시 운세 알림' 스위치의 상태와 동작을 모아 둔 훅.
 *
 * 브라우저 알림은 이용자가 직접 켜야 하고(옵트인), 기본값은 꺼짐이다.
 * 서버(Redis·VAPID)가 아직 준비되지 않았거나 아이폰에서 '홈 화면에 추가'를 하지 않은
 * 경우에는 스위치를 켜지 않고 이유를 알려 준다 — 여기서 예외가 나도 화면은 그대로 보인다.
 */

const SW_URL = "/sw.js";
/** 서버가 알려 주기 전에 쓸 수 있는 공개키(빌드 시 주입). */
const ENV_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export type MorningPushStatus =
  /** 브라우저 상태를 살피는 중 */
  | "checking"
  /** 이 브라우저에는 웹 푸시가 없다 */
  | "unsupported"
  /** 아이폰·아이패드에서 홈 화면에 추가하지 않은 상태 */
  | "needs-install"
  /** 서버(저장소·VAPID 키)가 아직 준비되지 않음 */
  | "unconfigured"
  /** 브라우저에서 알림을 차단해 둠 */
  | "blocked"
  /** 꺼짐 */
  | "off"
  /** 켜짐 */
  | "on";

export type MorningPushView = {
  status: MorningPushStatus;
  busy: boolean;
  /** 켜기·끄기 직후 보여 줄 한 줄 안내 */
  notice: string | null;
};

const INITIAL: MorningPushView = { status: "checking", busy: false, notice: null };

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // 아이패드OS는 UA가 Mac으로 나오므로 터치 지원으로 함께 가른다.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** VAPID 공개키(base64url)를 구독에 넣을 바이트 배열로 바꾼다. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

type ServerStatus = { configured: boolean; publicKey: string | null };

async function fetchServerStatus(): Promise<ServerStatus> {
  try {
    const response = await fetch("/api/push/subscribe", { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as { configured?: unknown; publicKey?: unknown };
    return {
      configured: data.configured === true,
      publicKey: typeof data.publicKey === "string" && data.publicKey ? data.publicKey : ENV_PUBLIC_KEY || null,
    };
  } catch {
    // 서버에 닿지 않으면 빌드에 심어 둔 공개키로 시도하고, 저장소 여부는 서버 응답으로 다시 판단한다.
    return { configured: Boolean(ENV_PUBLIC_KEY), publicKey: ENV_PUBLIC_KEY || null };
  }
}

class PushSetupError extends Error {}

export function useMorningPush(onNotice?: (message: string) => void) {
  const [view, setView] = useState<MorningPushView>(INITIAL);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const serverRef = useRef<ServerStatus>({ configured: false, publicKey: ENV_PUBLIC_KEY || null });
  const busyRef = useRef(false);

  const notify = useCallback(
    (message: string) => {
      setView((prev) => ({ ...prev, notice: message }));
      onNotice?.(message);
    },
    [onNotice],
  );

  const refresh = useCallback(async () => {
    if (!pushSupported()) {
      setView({
        status: isIosDevice() && !isStandalone() ? "needs-install" : "unsupported",
        busy: false,
        notice: null,
      });
      return;
    }

    // 아이폰의 사파리 탭에서는 푸시가 없고, 홈 화면에 추가한 앱에서만 쓸 수 있다.
    if (isIosDevice() && !isStandalone() && !("PushManager" in window)) {
      setView({ status: "needs-install", busy: false, notice: null });
      return;
    }

    const current = Notification.permission;
    setPermission(current);

    const server = await fetchServerStatus();
    serverRef.current = server;

    let subscribed = false;
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      subscribed = Boolean(subscription);
    } catch {
      subscribed = false;
    }

    if (current === "denied") {
      setView({ status: "blocked", busy: false, notice: null });
      return;
    }
    if (!server.configured || !server.publicKey) {
      setView({ status: "unconfigured", busy: false, notice: null });
      return;
    }
    setView({ status: subscribed ? "on" : "off", busy: false, notice: null });
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await refresh();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  const enable = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setView((prev) => ({ ...prev, busy: true, notice: null }));

    try {
      const server = serverRef.current.configured ? serverRef.current : await fetchServerStatus();
      serverRef.current = server;

      if (!server.publicKey) {
        throw new PushSetupError("알림 발송 서버가 아직 준비 중이에요. 준비되면 다시 켜 주세요.");
      }

      if (Notification.permission === "denied") {
        setView({ status: "blocked", busy: false, notice: "브라우저 설정에서 알림을 허용으로 바꾼 뒤 다시 시도해 주세요." });
        return;
      }

      const result =
        Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setView({
          status: "blocked",
          busy: false,
          notice:
            result === "denied"
              ? "알림이 차단됐어요. 브라우저 설정 → 알림에서 이 사이트를 허용으로 바꿔 주세요."
              : "알림을 허용해야 아침 알림을 보낼 수 있어요.",
        });
        return;
      }

      await navigator.serviceWorker.register(SW_URL, { scope: "/" });
      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      const created = !subscription;
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(server.publicKey),
        });
      }

      let response: Response;
      try {
        response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {
        response = new Response(null, { status: 0 });
      }

      if (!response.ok) {
        // 이번에 새로 만든 구독이라면 서버에 못 남긴 주소를 기기에만 두지 않는다.
        if (created) await subscription.unsubscribe().catch(() => {});
        let message = "알림을 켜지 못했어요. 잠시 뒤 다시 시도해 주세요.";
        try {
          const data = (await response.json()) as { message?: unknown };
          if (typeof data.message === "string" && data.message) message = data.message;
        } catch {
          /* 안내 문구가 없으면 기본 문구를 쓴다 */
        }
        throw new PushSetupError(message);
      }

      setView({ status: "on", busy: false, notice: "매일 아침 7시에 오늘의 운세를 알려 드릴게요 ☀️" });
      trackEvent("push_toggle", { enabled: true });
    } catch (error) {
      const message =
        error instanceof PushSetupError
          ? error.message
          : "알림을 켜지 못했어요. 브라우저가 알림을 막고 있지는 않은지 확인해 주세요.";
      setView((prev) => ({
        // 실패해도 켜진 것처럼 보이지 않게 'off'로 되돌린다. 단 서버 미설정은 그대로 알린다.
        status: prev.status === "unconfigured" ? "unconfigured" : "off",
        busy: false,
        notice: message,
      }));
    } finally {
      busyRef.current = false;
    }
  }, []);

  const disable = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setView((prev) => ({ ...prev, busy: true, notice: null }));

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = registration ? await registration.pushManager.getSubscription() : null;

      if (subscription) {
        const endpoint = subscription.endpoint;
        // 기기에서 먼저 끊든 서버에서 먼저 지우든, 둘 다 시도하고 한쪽이 실패해도 진행한다.
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
        await subscription.unsubscribe().catch(() => {});
      }

      setView({ status: "off", busy: false, notice: "아침 알림을 껐어요. 저장된 알림 주소도 지웠어요." });
      trackEvent("push_toggle", { enabled: false });
    } catch {
      setView((prev) => ({ ...prev, busy: false, notice: "알림을 끄지 못했어요. 잠시 뒤 다시 시도해 주세요." }));
    } finally {
      busyRef.current = false;
    }
  }, []);

  const toggle = useCallback(
    (next: boolean) => {
      if (next) void enable();
      else void disable();
    },
    [disable, enable],
  );

  return { view, permission, toggle, refresh };
}
