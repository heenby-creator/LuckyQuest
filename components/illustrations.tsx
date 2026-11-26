"use client";

import { useId } from "react";
import { ELEMENT_META } from "@/lib/content";
import type { Element } from "@/lib/types";

/* ── 별 캐릭터 ─────────────────────────────────────────── */

const STAR_POINTS = [
  [60, 18], [72.3, 45], [101.8, 48.4], [80, 68.5], [85.9, 97.6],
  [60, 83], [34.1, 97.6], [40, 68.5], [18.2, 48.4], [47.7, 45],
]
  .map(([x, y]) => `${x},${y}`)
  .join(" ");

export function StarMascot({
  size = 56,
  mood = "idle",
  className = "",
}: {
  size?: number;
  mood?: "idle" | "cheer" | "wave" | "sleep";
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const bodyClass = mood === "cheer" ? "anim-cheer" : mood === "sleep" ? "" : "anim-bob";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={`${bodyClass} ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`star-${uid}`} x1="30" y1="14" x2="90" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE887" />
          <stop offset="0.55" stopColor="#FFD447" />
          <stop offset="1" stopColor="#F5BE2E" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#FFE79B" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE79B" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="60" cy="62" r="56" fill={`url(#glow-${uid})`} />

      <polygon
        points={STAR_POINTS}
        fill={`url(#star-${uid})`}
        stroke={`url(#star-${uid})`}
        strokeWidth="13"
        strokeLinejoin="round"
      />

      {/* 얼굴 — 눈을 크게 키워 작은 크기에서도 표정이 살아난다 */}
      <g className="anim-blink">
        <ellipse cx="47.5" cy="60.5" rx="6" ry="8" fill="#6B4A22" />
        <ellipse cx="72.5" cy="60.5" rx="6" ry="8" fill="#6B4A22" />
        <circle cx="45.4" cy="57.4" r="2.1" fill="#FFF8E1" />
        <circle cx="70.4" cy="57.4" r="2.1" fill="#FFF8E1" />
        <circle cx="49.9" cy="64.2" r="1" fill="#FFF8E1" opacity="0.85" />
        <circle cx="74.9" cy="64.2" r="1" fill="#FFF8E1" opacity="0.85" />
      </g>
      <path
        d={mood === "cheer" ? "M51.5 73.5 Q60 83 68.5 73.5" : "M52.5 74 Q60 79.8 67.5 74"}
        stroke="#6B4A22"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="37.5" cy="73" r="4.4" fill="#FFB49E" opacity="0.55" />
      <circle cx="82.5" cy="73" r="4.4" fill="#FFB49E" opacity="0.55" />

      {/* 반짝이 */}
      <g fill="#FFDE6B">
        <path d="M100 22 L102.6 29.4 L110 32 L102.6 34.6 L100 42 L97.4 34.6 L90 32 L97.4 29.4 Z" className="anim-twinkle" />
        <path d="M17 44 L18.8 49 L23.8 50.8 L18.8 52.6 L17 57.6 L15.2 52.6 L10.2 50.8 L15.2 49 Z" className="anim-twinkle" style={{ animationDelay: "1.2s" }} />
      </g>
    </svg>
  );
}

/* ── 네잎클로버 ────────────────────────────────────────── */

export function Clover({
  size = 24,
  className = "",
  tone = "emerald",
}: {
  size?: number;
  className?: string;
  tone?: "emerald" | "gold" | "ivory";
}) {
  const uid = useId().replace(/:/g, "");
  const palette =
    tone === "gold"
      ? ["#F3D27C", "#D9AE41", "#B98E28"]
      : tone === "ivory"
        ? ["#FFFDF3", "#F0E6C8", "#D8C89C"]
        : ["#7ED09C", "#2E9A63", "#1B7A4B"];

  const leaf = "M0 0 C 8 -6 13.5 -15.5 9.5 -23.5 C 5.5 -30.5 -5.5 -30.5 -9.5 -23.5 C -13.5 -15.5 -8 -6 0 0 Z";

  return (
    <svg width={size} height={size} viewBox="-30 -30 60 74" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`clover-${uid}`} x1="0" y1="-30" x2="0" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor={palette[0]} />
          <stop offset="0.6" stopColor={palette[1]} />
          <stop offset="1" stopColor={palette[2]} />
        </linearGradient>
      </defs>
      {[0, 90, 180, 270].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <path d={leaf} fill={`url(#clover-${uid})`} />
          <path d="M0 -2 L0 -21" stroke={palette[0]} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </g>
      ))}
      <path d="M1 6 C 3 20 1 30 -2 40" stroke={palette[2]} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── 오행 아이콘 ───────────────────────────────────────── */

export function ElementIcon({
  element,
  size = 28,
  muted = false,
}: {
  element: Element;
  size?: number;
  muted?: boolean;
}) {
  const color = muted ? "#C9C0A8" : ELEMENT_META[element].color;
  const common = { stroke: color, strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {element === "목" && (
        <g {...common}>
          <path d="M12 21V10.5" />
          <path d="M12 12.2c0-4.1 2.6-6.9 6.9-7.4.2 4.8-2.7 7.6-6.9 7.4Z" />
          <path d="M12 17.2c-3.4 0-5.6-2-6.2-5.7 3.9-.2 6 1.9 6.2 5.7Z" />
          <path d="M9 21h6" />
        </g>
      )}
      {element === "화" && (
        <g {...common}>
          <path d="M12 21c3.3 0 5.6-2.2 5.6-5.2 0-4.2-4-5.9-3.4-10.8-2.4 1.4-3.8 3.6-3.8 5.6-1-.7-1.5-1.7-1.6-2.7C7.3 9.4 6.4 11.6 6.4 14c0 3.4 2.4 7 5.6 7Z" />
        </g>
      )}
      {element === "토" && (
        <g {...common}>
          <path d="M3 19h18" />
          <path d="M5 19l4.2-8.4L12 16l2.4-4.6L19 19" />
        </g>
      )}
      {element === "금" && (
        <g {...common}>
          <path d="M8 4h8l4 5.2L12 20.5 4 9.2 8 4Z" />
          <path d="M4 9.2h16" />
          <path d="M9.4 9.2 12 20.5l2.6-11.3" />
        </g>
      )}
      {element === "수" && (
        <g {...common}>
          <path d="M12 3.5c3.4 3.8 5.7 7 5.7 9.9a5.7 5.7 0 0 1-11.4 0c0-2.9 2.3-6.1 5.7-9.9Z" />
          <path d="M9.4 14.2c0 1.5 1.1 2.6 2.6 2.6" />
        </g>
      )}
    </svg>
  );
}

/* ── 내비게이션 아이콘 ─────────────────────────────────── */

export type NavKey = "today" | "calendar" | "charms" | "me";

export function NavIcon({ name, active, size = 22 }: { name: NavKey; active: boolean; size?: number }) {
  const color = active ? "#12805C" : "#A9A08B";
  const p = {
    stroke: color,
    strokeWidth: active ? 2.1 : 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: active ? "rgba(18,128,92,0.12)" : "none",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {name === "today" && (
        <path {...p} d="M12 3.4l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.7l6-.8L12 3.4Z" />
      )}
      {name === "calendar" && (
        <g {...p}>
          <rect x="3.6" y="5.4" width="16.8" height="15" rx="3.4" />
          <path d="M8 3.4v4M16 3.4v4M3.6 10h16.8" />
          <path d="M8.4 14.2h.01M12 14.2h.01M15.6 14.2h.01M8.4 17.4h.01M12 17.4h.01" strokeWidth="2.4" />
        </g>
      )}
      {name === "charms" && (
        <g {...p}>
          <rect x="4.2" y="3.8" width="12.6" height="16.4" rx="2.6" />
          <path d="M17 7.4h1.4a1.8 1.8 0 0 1 1.8 1.8v10a2.4 2.4 0 0 1-2.4 2.4h-8.2" opacity="0.5" />
          <path d="M10.5 12.1c.5-.5 1.3-.4 1.6.2.3-.6 1.1-.7 1.6-.2.5.5.4 1.1-.2 1.6L12.1 15l-1.4-1.3c-.6-.5-.7-1.1-.2-1.6Z" fill={color} stroke="none" />
        </g>
      )}
      {name === "me" && (
        <g {...p}>
          <circle cx="12" cy="8.4" r="3.6" />
          <path d="M5 20c.7-3.6 3.5-5.6 7-5.6s6.3 2 7 5.6" />
        </g>
      )}
    </svg>
  );
}

/* ── 오늘의 행운 카드 문양(CardEmblem) ─────────────────────── */

export function CardEmblem({
  size = 112,
  muted = false,
  className = "",
}: {
  size?: number;
  muted?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gold = muted ? "#C0AF88" : "#C7A862";

  // 잎의 결 — 위는 밝은 에메랄드, 아래로 갈수록 세이지 그린으로 가라앉는다.
  const frontTop = muted ? "#AEC6B6" : "#77CB9C";
  const frontMid = muted ? "#8DAF99" : "#3E9B69";
  const frontLow = muted ? "#76917F" : "#1C6B49";
  const backTop = muted ? "#9DB8A7" : "#5AB588";
  const backMid = muted ? "#82A490" : "#2E8A5C";
  const backLow = muted ? "#6B8878" : "#16583C";

  const leaf = "M0 0 C 8.6 -7 14.6 -17 10.1 -26.2 C 5.4 -33.8 -5.4 -33.8 -10.1 -26.2 C -14.6 -17 -8.6 -7 0 0 Z";
  const veining = "M0 -10 L4.2 -13.2 M0 -10 L-4.2 -13.2 M0 -15.2 L4.4 -18.4 M0 -15.2 L-4.4 -18.4 M0 -19.8 L3.5 -22 M0 -19.8 L-3.5 -22";

  const leafGroup = (deg: number) => {
    const isFront = deg % 180 === 0;
    return (
      <g key={deg} transform={`rotate(${deg})`}>
        {/* 잎이 만드는 그림자 — 접힌 듯한 두께를 준다 */}
        <path d={leaf} transform="translate(1.1 2.1)" fill="#123F2C" opacity={muted ? 0.07 : 0.14} />
        <path
          d={leaf}
          fill={isFront ? `url(#leaf-front-${uid})` : `url(#leaf-back-${uid})`}
          stroke={muted ? "#F8F4E9" : "#FCF8EC"}
          strokeWidth="1.15"
          strokeLinejoin="round"
        />
        {/* 잎맥 — 가운데 줄기와 곁가지 */}
        <path d="M0 -3.6 L0 -23.2" stroke={muted ? "#E4ECE4" : "#EAF7EF"} strokeWidth="1.15" strokeLinecap="round" opacity="0.6" />
        <path d={veining} stroke={muted ? "#E4ECE4" : "#E7F5EC"} strokeWidth="0.72" strokeLinecap="round" opacity="0.45" />
        {/* 표면 하이라이트와 그늘 */}
        <ellipse cx="-3.7" cy="-17" rx="3" ry="7.8" transform="rotate(-14 -3.7 -17)" fill="#FFFFFF" opacity={muted ? 0.14 : 0.26} />
        <ellipse cx="3.9" cy="-11.2" rx="1.9" ry="4.6" fill="#0E3F2C" opacity={muted ? 0.05 : 0.11} />
        <circle cx="0" cy="-24.6" r="1.15" fill="#FFFFFF" opacity={muted ? 0.2 : 0.4} />
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 168 168"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`disc-${uid}`} cx="0.46" cy="0.36" r="0.7">
          <stop stopColor={muted ? "#FCFAF2" : "#FFFFFB"} />
          <stop offset="0.62" stopColor={muted ? "#F6F1E4" : "#FBF6E8"} />
          <stop offset="1" stopColor={muted ? "#EFE9D9" : "#F3ECD8"} />
        </radialGradient>
        <linearGradient id={`leaf-front-${uid}`} x1="0" y1="-33" x2="0" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor={frontTop} />
          <stop offset="0.55" stopColor={frontMid} />
          <stop offset="1" stopColor={frontLow} />
        </linearGradient>
        <linearGradient id={`leaf-back-${uid}`} x1="0" y1="-33" x2="0" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor={backTop} />
          <stop offset="0.55" stopColor={backMid} />
          <stop offset="1" stopColor={backLow} />
        </linearGradient>
        <linearGradient id={`stem-${uid}`} x1="0" y1="0" x2="0" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor={frontMid} />
          <stop offset="1" stopColor={frontLow} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor={muted ? "#FFFFFF" : "#FFFFFF"} stopOpacity={muted ? 0.2 : 0.75} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 원반과 이중 테두리 */}
      <circle cx="84" cy="84" r="83" fill={`url(#disc-${uid})`} />
      <circle cx="84" cy="84" r="81.5" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.7" />
      <circle cx="84" cy="84" r="80.5" stroke={gold} strokeWidth="0.9" opacity="0.6" />
      <circle cx="84" cy="84" r="72" stroke={gold} strokeWidth="0.6" opacity="0.34" strokeDasharray="1 4.2" />

      {/* 위쪽의 작은 별 */}
      <path
        d="M84 19 L86.4 26.4 L93.8 28.8 L86.4 31.2 L84 38.6 L81.6 31.2 L74.2 28.8 L81.6 26.4 Z"
        fill={gold}
        opacity={muted ? 0.55 : 0.95}
      />
      <path d="M70 28.8 H64" stroke={gold} strokeWidth="0.7" opacity={muted ? 0.3 : 0.45} strokeLinecap="round" />
      <path d="M98 28.8 H104" stroke={gold} strokeWidth="0.7" opacity={muted ? 0.3 : 0.45} strokeLinecap="round" />

      {/* 가운데 네잎클로버 */}
      <g transform="translate(84 104)">
        <ellipse cx="0" cy="-2" rx="52" ry="46" fill={`url(#glow-${uid})`} />
        <ellipse cx="0" cy="29" rx="26" ry="5" fill="#123F2C" opacity={muted ? 0.03 : 0.05} />
        {[270, 90].map(leafGroup)}
        {[0, 180].map(leafGroup)}
        {/* 줄기 — 부드러운 곡선 */}
        <path
          d="M1.2 6 C 5.6 19 2.4 29.4 -3.2 40"
          stroke={`url(#stem-${uid})`}
          strokeWidth="2.7"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M-1.6 28 C -5.8 26 -8 22.6 -8.6 18.8 C -4.6 18.4 -2 21 -1.6 28 Z" fill={frontLow} opacity={muted ? 0.5 : 0.8} />
        <circle cx="0" cy="0" r="2.8" fill={muted ? "#F5EFE1" : "#FDF9EE"} />
        <circle cx="0" cy="0" r="1.3" fill={frontMid} opacity="0.55" />
      </g>

      {/* 아래쪽 장식 */}
      <path d="M62 146 Q84 154 106 146" stroke={gold} strokeWidth="0.8" opacity={muted ? 0.3 : 0.55} fill="none" />
      <circle cx="84" cy="150.5" r="1.1" fill={gold} opacity={muted ? 0.3 : 0.6} />
    </svg>
  );
}

/* ── 행운 카드 일러스트(잠금 미리보기) ──────────────── */

function LaurelBranch({ mirrored = false }: { mirrored?: boolean }) {
  const points = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    const theta = ((96 + t * 126) * Math.PI) / 180;
    const x = 110 + 76 * Math.cos(theta);
    const y = 152 + 98 * Math.sin(theta);
    const tangent = (Math.atan2(98 * Math.cos(theta), -76 * Math.sin(theta)) * 180) / Math.PI;
    return { x, y, rotation: tangent, scale: 0.7 + 0.4 * Math.sin(t * Math.PI) };
  });

  return (
    <g transform={mirrored ? "translate(220 0) scale(-1 1)" : undefined} opacity="0.92">
      <path
        d="M110 262 C 56 250 34 206 42 148"
        stroke="#B98E28"
        strokeWidth="1.1"
        fill="none"
        opacity="0.55"
      />
      {points.map((pt, i) => (
        <g key={i} transform={`translate(${pt.x} ${pt.y}) rotate(${pt.rotation}) scale(${pt.scale})`}>
          <ellipse cx="0" cy="-9" rx="4.6" ry="9.2" fill={i % 3 === 0 ? "#3E8F63" : "#2F7A54"} opacity={i % 3 === 0 ? 0.95 : 0.85} />
          <path d="M0 -1 L0 -16" stroke="#DCEBD8" strokeWidth="0.7" opacity="0.75" />
        </g>
      ))}
      {[2, 5, 8].map((i) => (
        <circle
          key={i}
          cx={points[i].x + 8}
          cy={points[i].y + 4}
          r="2.1"
          fill="#D3A93E"
          opacity="0.9"
        />
      ))}
    </g>
  );
}

export function CharmIllustration({
  accent = "emerald",
  className = "",
}: {
  accent?: "emerald" | "gold";
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const ring = accent === "gold" ? "#D3A93E" : "#2F7A54";

  return (
    <svg viewBox="0 0 220 300" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`paper-${uid}`} x1="0" y1="0" x2="220" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDF8E8" />
          <stop offset="1" stopColor="#F6EDD5" />
        </linearGradient>
        <radialGradient id={`halo-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#FFF4C9" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFF4C9" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0.5" y="0.5" width="219" height="299" rx="8" fill={`url(#paper-${uid})`} />
      <rect x="8" y="8" width="204" height="284" rx="4" stroke={ring} strokeWidth="0.9" opacity="0.55" />
      <rect x="13" y="13" width="194" height="274" rx="2" stroke={ring} strokeWidth="0.5" opacity="0.3" />

      {/* 위쪽 태양 */}
      <g transform="translate(110 58)">
        <circle r="30" fill={`url(#halo-${uid})`} />
        <circle r="9.5" fill="none" stroke="#C9A227" strokeWidth="1.1" opacity="0.85" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 14}
              y1={Math.sin(a) * 14}
              x2={Math.cos(a) * (i % 2 === 0 ? 24 : 20)}
              y2={Math.sin(a) * (i % 2 === 0 ? 24 : 20)}
              stroke="#C9A227"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.7"
            />
          );
        })}
      </g>

      <LaurelBranch />
      <LaurelBranch mirrored />

      {/* 가운데 클로버 */}
      <g transform="translate(110 168)">
        <circle r="46" fill="#FFFDF3" opacity="0.9" />
        <circle r="46" stroke={ring} strokeWidth="0.8" opacity="0.45" />
        <circle r="39" stroke={ring} strokeWidth="0.5" opacity="0.3" strokeDasharray="1.5 4" />
        <g transform="translate(0 6) scale(1.28)">
          <g transform="translate(-0.5 0)">
            {[0, 90, 180, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <path
                  d="M0 0 C 8 -6 13.5 -15.5 9.5 -23.5 C 5.5 -30.5 -5.5 -30.5 -9.5 -23.5 C -13.5 -15.5 -8 -6 0 0 Z"
                  fill={deg % 180 === 0 ? "#2F7A54" : "#3E8F63"}
                />
                <path d="M0 -2 L0 -20" stroke="#BFE0C6" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
              </g>
            ))}
            <path d="M1 5 C 3 16 1 24 -2 32" stroke="#2F7A54" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* 작은 별들 */}
      {[
        [44, 88, 0.9],
        [176, 118, 0.75],
        [186, 240, 0.8],
        [34, 210, 0.7],
      ].map(([x, y, s], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M0 -7 L1.7 -1.7 L7 0 L1.7 1.7 L0 7 L-1.7 1.7 L-7 0 L-1.7 -1.7 Z"
          fill="#D3A93E"
          opacity="0.8"
        />
      ))}

      {/* 아래 장식 */}
      <g opacity="0.65">
        <line x1="86" y1="262" x2="134" y2="262" stroke="#C9A227" strokeWidth="0.8" />
        <path d="M110 256.5 L112.4 261 L117 261 L113.4 264 L115 268.5 L110 265.8 L105 268.5 L106.6 264 L103 261 L107.6 261 Z" fill="#C9A227" transform="translate(0 -4)" />
      </g>
    </svg>
  );
}

/* ── 기타 아이콘 ───────────────────────────────────────── */

export function CheckMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15.4" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5V3.8M12 3.8 7.6 8.2M12 3.8l4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 13v5.2A2.3 2.3 0 0 0 7.8 20.5h8.4a2.3 2.3 0 0 0 2.3-2.3V13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function Sparkle({ size = 16, className = "", color = "#E0AE3E", style }: { size?: number; className?: string; color?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M12 2.5 14.3 9.7 21.5 12 14.3 14.3 12 21.5 9.7 14.3 2.5 12 9.7 9.7Z" fill={color} />
    </svg>
  );
}
