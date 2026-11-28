/**
 * Lucky Quest 서비스 워커 — 아침 7시 웹 푸시 알림만 담당한다.
 *
 * 일부러 오프라인 캐시(fetch 가로채기)는 하지 않는다.
 * 캐시가 끼면 새 배포가 바로 반영되지 않고, 이 앱은 화면이 모두 서버에서 오므로
 * 오프라인 캐시보다 "항상 최신"이 중요하다. 설치·활성화만 가볍게 처리한다.
 *
 * TWA(플레이스토어 앱)와 PWA 모두 같은 워커를 쓴다.
 */

const DEFAULT_ICON = "/icons/icon-192.png";
const DEFAULT_TAG = "lucky-quest-daily";

self.addEventListener("install", () => {
  // 새 워커를 기다리게 두지 않고 바로 대기 상태로 올린다.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // 이미 열려 있는 화면도 이 워커를 쓰도록 즉시 넘겨받는다.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      // JSON이 아니면 본문 문자열만 알림에 담는다.
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || "오늘의 행운 퀘스트가 도착했어요";
  const options = {
    body: payload.body || "오늘의 운세와 작은 퀘스트를 확인해 보세요!",
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_ICON,
    // 같은 태그를 쓰면 하루에 한 번만 쌓인다(어제 알림을 덮어쓴다).
    tag: payload.tag || DEFAULT_TAG,
    renotify: false,
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let target = "/";
  try {
    // 같은 사이트 안의 주소만 연다(외부 주소로 튕기는 일 방지).
    const url = new URL(data.url || "/", self.location.origin);
    target = url.origin === self.location.origin ? url.href : self.location.origin + "/";
  } catch {
    target = self.location.origin + "/";
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const opened = windows.find((client) => {
        try {
          return new URL(client.url).origin === self.location.origin;
        } catch {
          return false;
        }
      });

      if (opened) {
        await opened.focus();
        // 이미 열려 있으면 그 화면을 목적지로 옮긴다.
        if (opened.url !== target && "navigate" in opened) {
          try {
            await opened.navigate(target);
          } catch {
            /* TWA처럼 navigate를 막는 환경에서는 포커스만 한다 */
          }
        }
        return;
      }

      await self.clients.openWindow(target);
    })(),
  );
});
