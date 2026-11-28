import { spherePaint } from "@/lib/color";

/**
 * 오늘의 행운의 색을 담은 입체 구(공).
 * 이미지 없이 CSS 그라데이션만으로 그려서, 색(hex)만 바꾸면 60가지 색이 모두 같은 결로 보인다.
 * 훅을 쓰지 않으므로 서버 컴포넌트(공유 페이지)에서도 그대로 쓸 수 있다.
 */
export function LuckyColorSphere({
  colorHex,
  size = 100,
  className = "",
}: {
  colorHex: string;
  size?: number;
  className?: string;
}) {
  const paint = spherePaint(colorHex, size);
  const lift = Math.max(8, Math.round(size * 0.14));
  const haloSize = Math.round(size * 1.5);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size + lift }}
      aria-hidden="true"
    >
      {/* 구 뒤로 번지는 옅은 빛 */}
      <span
        className="absolute rounded-full"
        style={{
          width: haloSize,
          height: haloSize,
          left: (size - haloSize) / 2,
          top: (size - haloSize) / 2,
          background: paint.halo,
        }}
      />
      {/* 바닥 그림자 — 넓게 퍼지는 낙하 그림자와 접지 그림자 */}
      <span
        className="absolute rounded-[50%]"
        style={{
          width: size * 0.94,
          height: Math.max(8, size * 0.16),
          left: size * 0.03,
          top: size + lift * 0.28,
          background: paint.floor,
          filter: `blur(${Math.max(2, size * 0.036)}px)`,
        }}
      />
      <span
        className="absolute rounded-[50%]"
        style={{
          width: size * 0.53,
          height: Math.max(4, size * 0.065),
          left: size * 0.235,
          top: size + lift * 0.04,
          background: paint.contact,
          filter: `blur(${Math.max(1, size * 0.018)}px)`,
        }}
      />
      {/* 구 본체 */}
      <span
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          left: 0,
          top: 0,
          background: paint.background,
          boxShadow: [
            `inset 0 0 0 ${Math.max(0.5, size * 0.005)}px rgba(255,255,255,0.18)`,
            paint.ring,
            paint.boxShadow,
          ]
            .filter(Boolean)
            .join(", "),
        }}
      />
    </div>
  );
}

/** 하단 '행운의 색' 앞에 붙는 작은 색 점 — 구슬과 같은 색으로 그린다. */
export function LuckyColorDot({
  colorHex,
  size = 9,
  className = "",
}: {
  colorHex: string;
  size?: number;
  className?: string;
}) {
  const paint = spherePaint(colorHex, size);
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, background: paint.dot, boxShadow: paint.dotShadow }}
      aria-hidden="true"
    />
  );
}
