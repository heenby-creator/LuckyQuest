/**
 * OG 이미지에 쓰는 손그림 일러스트(SVG)를 data URI로 만든다.
 * 앱의 components/illustrations.tsx와 같은 도형을 쓰되, satori(ImageResponse)가
 * 읽을 수 있도록 그라디언트 id를 고정하고 ASCII만 담는다.
 */

const toBase64 = (svg: string) => Buffer.from(svg, "utf8").toString("base64");
const toUri = (svg: string) => `data:image/svg+xml;base64,${toBase64(svg)}`;

const STAR_POINTS = [
  [60, 18], [72.3, 45], [101.8, 48.4], [80, 68.5], [85.9, 97.6],
  [60, 83], [34.1, 97.6], [40, 68.5], [18.2, 48.4], [47.7, 45],
]
  .map(([x, y]) => `${x},${y}`)
  .join(" ");

/** 별 캐릭터 — 앱 헤더의 마스코트 */
export const STAR_URI = toUri(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
<defs>
<linearGradient id="st" x1="30" y1="14" x2="90" y2="104" gradientUnits="userSpaceOnUse">
<stop stop-color="#FFE887"/><stop offset="0.55" stop-color="#FFD447"/><stop offset="1" stop-color="#F5BE2E"/>
</linearGradient>
<radialGradient id="gl" cx="0.5" cy="0.5" r="0.5">
<stop stop-color="#FFE79B" stop-opacity="0.55"/><stop offset="1" stop-color="#FFE79B" stop-opacity="0"/>
</radialGradient>
</defs>
<circle cx="60" cy="62" r="56" fill="url(#gl)"/>
<polygon points="${STAR_POINTS}" fill="url(#st)" stroke="url(#st)" stroke-width="13" stroke-linejoin="round"/>
<ellipse cx="47.5" cy="60.5" rx="6" ry="8" fill="#6B4A22"/>
<ellipse cx="72.5" cy="60.5" rx="6" ry="8" fill="#6B4A22"/>
<circle cx="45.4" cy="57.4" r="2.1" fill="#FFF8E1"/>
<circle cx="70.4" cy="57.4" r="2.1" fill="#FFF8E1"/>
<circle cx="49.9" cy="64.2" r="1" fill="#FFF8E1" opacity="0.85"/>
<circle cx="74.9" cy="64.2" r="1" fill="#FFF8E1" opacity="0.85"/>
<path d="M52.5 74 Q60 79.8 67.5 74" stroke="#6B4A22" stroke-width="2.4" stroke-linecap="round" fill="none"/>
<circle cx="37.5" cy="73" r="4.4" fill="#FFB49E" opacity="0.55"/>
<circle cx="82.5" cy="73" r="4.4" fill="#FFB49E" opacity="0.55"/>
<path d="M100 22 L102.6 29.4 L110 32 L102.6 34.6 L100 42 L97.4 34.6 L90 32 L97.4 29.4 Z" fill="#FFDE6B"/>
<path d="M17 44 L18.8 49 L23.8 50.8 L18.8 52.6 L17 57.6 L15.2 52.6 L10.2 50.8 L15.2 49 Z" fill="#FFDE6B"/>
</svg>`);

const CLOVER_LEAF = "M0 0 C 8 -6 13.5 -15.5 9.5 -23.5 C 5.5 -30.5 -5.5 -30.5 -9.5 -23.5 C -13.5 -15.5 -8 -6 0 0 Z";

/** 네 갈래 반짝이 */
export function sparkleUri(color = "#D3A93E"): string {
  return toUri(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
<path d="M12 1.6 L14.5 9.5 L22.4 12 L14.5 14.5 L12 22.4 L9.5 14.5 L1.6 12 L9.5 9.5 Z" fill="${color}"/>
</svg>`);
}

/** 네잎클로버 — tone: emerald | gold | ivory */
export function cloverUri(tone: "emerald" | "gold" | "ivory" = "emerald"): string {
  const [top, mid, low] =
    tone === "gold"
      ? ["#F3D27C", "#D9AE41", "#B98E28"]
      : tone === "ivory"
        ? ["#FFFDF3", "#F0E6C8", "#D8C89C"]
        : ["#7ED09C", "#2E9A63", "#1B7A4B"];

  const leaves = [0, 90, 180, 270]
    .map(
      (deg) => `<g transform="rotate(${deg})"><path d="${CLOVER_LEAF}" fill="url(#cv)"/>
<path d="M0 -2 L0 -21" stroke="${top}" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/></g>`,
    )
    .join("");

  return toUri(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="74" viewBox="-30 -30 60 74" fill="none">
<defs><linearGradient id="cv" x1="0" y1="-30" x2="0" y2="10" gradientUnits="userSpaceOnUse">
<stop stop-color="${top}"/><stop offset="0.6" stop-color="${mid}"/><stop offset="1" stop-color="${low}"/>
</linearGradient></defs>
${leaves}
<path d="M1 6 C 3 20 1 30 -2 40" stroke="${low}" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`);
}

/** 오늘의 행운 카드 문양 — 입체감 있는 네잎클로버(그라데이션·잎맥·하이라이트) */
const LEAF_PATH = "M0 0 C 8.6 -7 14.6 -17 10.1 -26.2 C 5.4 -33.8 -5.4 -33.8 -10.1 -26.2 C -14.6 -17 -8.6 -7 0 0 Z";
const VEIN_PATH = "M0 -10 L4.2 -13.2 M0 -10 L-4.2 -13.2 M0 -15.2 L4.4 -18.4 M0 -15.2 L-4.4 -18.4 M0 -19.8 L3.5 -22 M0 -19.8 L-3.5 -22";

function emblemLeaf(deg: number): string {
  const fill = deg % 180 === 0 ? "url(#lf)" : "url(#lb)";
  return `<g transform="rotate(${deg})">
<path d="${LEAF_PATH}" transform="translate(1.1 2.1)" fill="#123F2C" opacity="0.14"/>
<path d="${LEAF_PATH}" fill="${fill}" stroke="#FCF8EC" stroke-width="1.15" stroke-linejoin="round"/>
<path d="M0 -3.6 L0 -23.2" stroke="#EAF7EF" stroke-width="1.15" stroke-linecap="round" opacity="0.6"/>
<path d="${VEIN_PATH}" stroke="#E7F5EC" stroke-width="0.72" stroke-linecap="round" opacity="0.45"/>
<ellipse cx="-3.7" cy="-17" rx="3" ry="7.8" transform="rotate(-14 -3.7 -17)" fill="#FFFFFF" opacity="0.26"/>
<ellipse cx="3.9" cy="-11.2" rx="1.9" ry="4.6" fill="#0E3F2C" opacity="0.11"/>
<circle cx="0" cy="-24.6" r="1.15" fill="#FFFFFF" opacity="0.4"/>
</g>`;
}

export const EMBLEM_URI = toUri(`<svg xmlns="http://www.w3.org/2000/svg" width="168" height="168" viewBox="0 0 168 168" fill="none">
<defs>
<radialGradient id="dc" cx="0.46" cy="0.36" r="0.7">
<stop stop-color="#FFFFFB"/><stop offset="0.62" stop-color="#FBF6E8"/><stop offset="1" stop-color="#F3ECD8"/>
</radialGradient>
<linearGradient id="lf" x1="0" y1="-33" x2="0" y2="2" gradientUnits="userSpaceOnUse">
<stop stop-color="#77CB9C"/><stop offset="0.55" stop-color="#3E9B69"/><stop offset="1" stop-color="#1C6B49"/>
</linearGradient>
<linearGradient id="lb" x1="0" y1="-33" x2="0" y2="2" gradientUnits="userSpaceOnUse">
<stop stop-color="#5AB588"/><stop offset="0.55" stop-color="#2E8A5C"/><stop offset="1" stop-color="#16583C"/>
</linearGradient>
<linearGradient id="st" x1="0" y1="0" x2="0" y2="42" gradientUnits="userSpaceOnUse">
<stop stop-color="#3E9B69"/><stop offset="1" stop-color="#1C6B49"/>
</linearGradient>
<radialGradient id="gw" cx="0.5" cy="0.5" r="0.5">
<stop stop-color="#FFFFFF" stop-opacity="0.75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
</radialGradient>
</defs>
<circle cx="84" cy="84" r="83" fill="url(#dc)"/>
<circle cx="84" cy="84" r="81.5" stroke="#FFFFFF" stroke-width="1.4" opacity="0.7"/>
<circle cx="84" cy="84" r="80.5" stroke="#C7A862" stroke-width="0.9" opacity="0.6"/>
<circle cx="84" cy="84" r="72" stroke="#C7A862" stroke-width="0.6" opacity="0.34" stroke-dasharray="1 4.2"/>
<path d="M84 19 L86.4 26.4 L93.8 28.8 L86.4 31.2 L84 38.6 L81.6 31.2 L74.2 28.8 L81.6 26.4 Z" fill="#C7A862" opacity="0.95"/>
<path d="M70 28.8 H64" stroke="#C7A862" stroke-width="0.7" opacity="0.45" stroke-linecap="round"/>
<path d="M98 28.8 H104" stroke="#C7A862" stroke-width="0.7" opacity="0.45" stroke-linecap="round"/>
<g transform="translate(84 104)">
<ellipse cx="0" cy="-2" rx="52" ry="46" fill="url(#gw)"/>
<ellipse cx="0" cy="29" rx="26" ry="5" fill="#123F2C" opacity="0.05"/>
${emblemLeaf(270)}
${emblemLeaf(90)}
${emblemLeaf(0)}
${emblemLeaf(180)}
<path d="M1.2 6 C 5.6 19 2.4 29.4 -3.2 40" stroke="url(#st)" stroke-width="2.7" stroke-linecap="round" fill="none"/>
<path d="M-1.6 28 C -5.8 26 -8 22.6 -8.6 18.8 C -4.6 18.4 -2 21 -1.6 28 Z" fill="#1C6B49" opacity="0.8"/>
<circle cx="0" cy="0" r="2.8" fill="#FDF9EE"/>
<circle cx="0" cy="0" r="1.3" fill="#3E9B69" opacity="0.55"/>
</g>
<path d="M62 146 Q84 154 106 146" stroke="#C7A862" stroke-width="0.8" opacity="0.55" fill="none"/>
<circle cx="84" cy="150.5" r="1.1" fill="#C7A862" opacity="0.6"/>
</svg>`);
