/**
 * 행운의 색(hex) 하나로 입체 구슬의 빛·그림자·바닥 그림자를 계산한다.
 * CSS(카드)와 Canvas(공유 이미지)가 같은 값을 쓰도록 순수 함수로 둔다.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(num)) return { r: 180, g: 170, b: 150 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) => clamp(Math.round(v)).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** a에서 b로 t만큼 섞는다. t=0이면 a, t=1이면 b. */
export function mix(a: string, b: string, t: number): string {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  const k = Math.min(1, Math.max(0, t));
  return rgbToHex({
    r: from.r + (to.r - from.r) * k,
    g: from.g + (to.g - from.g) * k,
    b: from.b + (to.b - from.b) * k,
  });
}

/** 명도를 k만큼 떨어뜨린다(0=그대로, 1=검정). 색상(hue)은 유지된다. */
export function shade(hex: string, k: number): string {
  return mix(hex, "#000000", Math.min(0.92, Math.max(0, k)));
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h, s, l };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return { r: channel(h + 1 / 3) * 255, g: channel(h) * 255, b: channel(h - 1 / 3) * 255 };
}

/**
 * 색을 짙게 — 밝기를 떨어뜨리면서 채도를 살짝 올린다.
 * 단순히 검게 섞으면 탁한 갈색이 되는데, 이렇게 하면 귤빛은 진한 주황, 물빛은 깊은 청색으로 남는다.
 */
export function deepen(hex: string, amount: number): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  const k = Math.min(0.95, Math.max(0, amount));
  return rgbToHex(
    hslToRgb({
      h,
      s: Math.min(1, s * (1 + k * 0.8) + k * 0.1),
      l: Math.max(0, l * (1 - k)),
    }),
  );
}

/** 0(검정)~1(흰색) 밝기. 아주 밝은 색을 판별하는 데 쓴다. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** 밝은 색일수록 1에 가깝다 — 음영을 얼마나 더 진하게 줄지 정하는 값. */
export function paleness(hex: string): number {
  return Math.min(1, Math.max(0, (luminance(hex) - 0.6) / 0.32));
}

/** 구슬 본체의 색 단계 — CSS(카드)와 Canvas(공유 이미지)가 같은 값을 쓴다. */
export interface SphereStops {
  /** 0에 가까우면 선명한 색, 1에 가까우면 아주 밝은 색 */
  pale: number;
  light1: string;
  light2: string;
  light3: string;
  core: string;
  deep1: string;
  deep2: string;
  deep3: string;
  deep4: string;
  /** 넓게 퍼지는 광택의 기준색 */
  gloss: string;
  /** 바닥에서 반사되는 빛의 기준색 */
  bounce: string;
  /** 안쪽 음영·바닥 그림자의 기준색 */
  shadowTone: string;
  /** 아주 밝은 색의 테두리 기준색 */
  ringTone: string;
}

export function sphereStops(colorHex: string): SphereStops {
  const base = colorHex;
  const pale = paleness(base);

  // 아주 밝은 색(진주빛·백합빛 등)은 그림자를 회색 쪽으로 빼야 탁한 갈색이 되지 않는다.
  const tone = (amount: number) => {
    const deep = deepen(base, amount);
    return pale > 0.3 ? mix(deep, "#8C877E", pale * 0.5) : deep;
  };

  return {
    pale,
    light1: mix(base, "#FFFFFF", 0.62),
    light2: mix(base, "#FFFFFF", 0.44),
    light3: mix(base, "#FFFFFF", 0.2),
    core: tone(0.14 * pale),
    deep1: tone(0.08 + 0.18 * pale),
    deep2: tone(0.2 + 0.24 * pale),
    deep3: tone(0.34 + 0.3 * pale),
    deep4: tone(0.48 + 0.3 * pale),
    gloss: mix(base, "#FFFFFF", 0.5),
    bounce: mix(base, "#FFFFFF", 0.45),
    shadowTone: shade(base, 0.62),
    ringTone: shade(base, 0.34),
  };
}

export interface SpherePaint {
  /** sphere 요소의 배경(스펙큘러 → 광택 → 바닥 반사광 → 본체) */
  background: string;
  /** sphere 요소의 box-shadow(안쪽 음영 + 바닥 낙하 그림자) */
  boxShadow: string;
  /** 구 뒤에 번지는 옅은 빛 */
  halo: string;
  /** 구 아래 넓은 그림자 */
  floor: string;
  /** 구가 바닥에 닿는 지점의 진한 그림자 */
  contact: string;
  /** 아주 밝은 색에 덧대는 얇은 테두리 (구분을 살린다) */
  ring: string | null;
  /** 하단 '행운의 색' 점 */
  dot: string;
  dotShadow: string;
  /** 카드 배경에 깔아 주는 옅은 틴트 (밝은 색도 존재감이 생긴다) */
  glow: string;
  pale: number;
}

/**
 * 입체 구슬의 색 표현을 만든다.
 * size는 지름(px) — 안쪽 음영과 바닥 그림자 두께가 size에 비례한다.
 */
export function spherePaint(colorHex: string, size = 100): SpherePaint {
  const base = colorHex;
  const s = size / 140; // 시안 2(140px)의 수치를 기준으로 삼는다
  const stops = sphereStops(base);
  const { pale, light1, light2, light3, core, deep1, deep2, deep3, deep4, gloss, bounce, shadowTone } = stops;

  const background = [
    // 1. 또렷한 스펙큘러 하이라이트 (왼쪽 위)
    `radial-gradient(ellipse 10.6% 10.6% at 33% 26%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.92) 26%, rgba(255,253,246,0.42) 58%, rgba(255,253,246,0) 100%)`,
    // 2. 넓게 퍼지는 광택
    `radial-gradient(circle at 33% 26%, ${rgba(gloss, 0.46)} 0%, ${rgba(gloss, 0.12)} 30%, ${rgba(gloss, 0)} 52%)`,
    // 3. 바닥에서 반사되는 빛 (오른쪽 아래)
    `radial-gradient(ellipse 48% 30% at 72% 85%, ${rgba(bounce, 0.24 + 0.2 * pale)} 0%, ${rgba(bounce, 0.08 + 0.08 * pale)} 45%, ${rgba(bounce, 0)} 78%)`,
    // 4. 구체 본체
    `radial-gradient(circle at 32% 26%, ${light1} 0%, ${light2} 12%, ${light3} 26%, ${core} 40%, ${deep1} 54%, ${deep2} 70%, ${deep3} 86%, ${deep4} 100%)`,
  ].join(", ");

  const boxShadow = [
    `inset ${-14 * s}px ${-18 * s}px ${30 * s}px ${rgba(shadowTone, 0.2 + 0.16 * pale)}`,
    `inset ${-32 * s}px ${-28 * s}px ${60 * s}px ${rgba(shadowTone, 0.1 + 0.12 * pale)}`,
    `inset ${6 * s}px ${8 * s}px ${14 * s}px rgba(255, 250, 240, ${0.16 + 0.06 * pale})`,
    `0 ${12 * s}px ${22 * s}px ${-16 * s}px ${rgba(shade(base, 0.55), 0.5 + 0.12 * pale)}`,
  ].join(", ");

  return {
    background,
    boxShadow,
    halo: `radial-gradient(circle at center, ${rgba(base, 0.18 - 0.05 * pale)} 0%, ${rgba(base, 0.08)} 42%, ${rgba(base, 0)} 68%)`,
    floor: `radial-gradient(ellipse at center, ${rgba(shadowTone, 0.36 + 0.16 * pale)} 0%, ${rgba(shadowTone, 0)} 70%)`,
    contact: `radial-gradient(ellipse at center, ${rgba(shade(base, 0.7), 0.22 + 0.12 * pale)} 0%, ${rgba(shade(base, 0.7), 0)} 70%)`,
    ring: pale > 0.35 ? `inset 0 0 0 1px ${rgba(stops.ringTone, 0.24 + 0.3 * pale)}` : null,
    dot: `radial-gradient(circle at 34% 28%, ${mix(base, "#FFFFFF", 0.68)} 0%, ${mix(base, "#FFFFFF", 0.22)} 30%, ${base} 66%, ${deepen(base, 0.22 + 0.16 * pale)} 100%)`,
    dotShadow: `0 0 0 1px rgba(255,255,255,0.9), 0 0 0 1.6px ${rgba(shade(base, 0.45), 0.1 + 0.32 * pale)}, 0 1px 1.5px ${rgba(shade(base, 0.55), 0.3)}`,
    glow: `radial-gradient(circle at 50% 50%, ${rgba(base, 0.1 - 0.04 * pale)} 0%, ${rgba(base, 0)} 62%)`,
    pale,
  };
}
