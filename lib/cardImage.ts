/**
 * 인증샷 포함 카드 이미지 — 클라이언트 Canvas로 오늘의 행운 카드와 사진을 한 장에 합성한다.
 * 사진은 브라우저 밖으로 나가지 않고, 만들어진 PNG만 이용자가 저장·공유한다.
 */
import type { CharmView } from "./engine";
import type { Element } from "./types";
import { mix, paleness, shade } from "./color";

const W = 1080;
const H = 1760;

const C = {
  paper: "#FFFDF7",
  paperDeep: "#FBF5E7",
  gold: "#C7A862",
  goldDeep: "#B09355",
  forest: "#12503C",
  leafDeep: "#2F4A3B",
  ink: "#2E2A22",
  inkSoft: "#6E6757",
  inkFaint: "#A29A86",
  line: "#E6DCC1",
  label: "#94804F",
};

const SERIF = '"Noto Serif KR", "Nanum Myeongjo", Georgia, serif';

export interface CardImageInput {
  charm: CharmView;
  /** 11월 24일 (화) */
  dateLabel: string;
  /** 수(水) */
  elementName: string;
  /** 임인 */
  pillar: string;
  photos: Blob[];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  const target = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in target) target.letterSpacing = value;
}

/** 잎 하나의 윤곽 — 중심(0,0)에서 위로 뻗는 하트 모양 잎 */
function leafPath(ctx: CanvasRenderingContext2D, k: number) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(8.6 * k, -7 * k, 14.6 * k, -17 * k, 10.1 * k, -26.2 * k);
  ctx.bezierCurveTo(5.4 * k, -33.8 * k, -5.4 * k, -33.8 * k, -10.1 * k, -26.2 * k);
  ctx.bezierCurveTo(-14.6 * k, -17 * k, -8.6 * k, -7 * k, 0, 0);
  ctx.closePath();
}

function drawClover(ctx: CanvasRenderingContext2D, cx: number, cy: number, leafLen: number) {
  const k = leafLen / 30;

  // 바닥 그림자
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + leafLen * 0.62, leafLen * 0.56, leafLen * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(18,63,44,0.10)";
  ctx.fill();
  ctx.restore();

  // 줄기 — 잎 뒤에서 아래로 부드럽게
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + leafLen * 0.02, cy + leafLen * 0.18);
  ctx.bezierCurveTo(
    cx + leafLen * 0.2,
    cy + leafLen * 0.55,
    cx + leafLen * 0.06,
    cy + leafLen * 0.85,
    cx - leafLen * 0.16,
    cy + leafLen * 1.06,
  );
  ctx.strokeStyle = "#1C6B49";
  ctx.lineWidth = Math.max(4, leafLen * 0.075);
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  for (const deg of [270, 90, 0, 180]) {
    const isFront = deg % 180 === 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((deg * Math.PI) / 180);

    // 두께 그림자
    ctx.save();
    ctx.translate(1.2 * k, 2 * k);
    leafPath(ctx, k);
    ctx.fillStyle = "rgba(18,63,44,0.14)";
    ctx.fill();
    ctx.restore();

    const gradient = ctx.createLinearGradient(0, -33 * k, 0, 0);
    gradient.addColorStop(0, isFront ? "#7BCFA0" : "#60B98C");
    gradient.addColorStop(0.55, isFront ? "#3E9B69" : "#2E8A5C");
    gradient.addColorStop(1, isFront ? "#1C6B49" : "#16583C");

    leafPath(ctx, k);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(252,248,236,0.95)";
    ctx.lineWidth = Math.max(1.2, 1.1 * k);
    ctx.stroke();

    // 잎맥
    ctx.beginPath();
    ctx.moveTo(0, -3.4 * k);
    ctx.lineTo(0, -23 * k);
    ctx.strokeStyle = "rgba(234,247,239,0.62)";
    ctx.lineWidth = Math.max(1, 1.0 * k);
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -10 * k);
    ctx.lineTo(4.1 * k, -13.2 * k);
    ctx.moveTo(0, -10 * k);
    ctx.lineTo(-4.1 * k, -13.2 * k);
    ctx.moveTo(0, -15.2 * k);
    ctx.lineTo(4.3 * k, -18.4 * k);
    ctx.moveTo(0, -15.2 * k);
    ctx.lineTo(-4.3 * k, -18.4 * k);
    ctx.strokeStyle = "rgba(231,245,236,0.42)";
    ctx.lineWidth = Math.max(0.7, 0.7 * k);
    ctx.stroke();

    // 하이라이트
    ctx.beginPath();
    ctx.ellipse(-3.6 * k, -17 * k, 2.9 * k, 7.6 * k, (-14 * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.fill();

    ctx.restore();
  }

  // 중심
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3.2, 2.6 * k), 0, Math.PI * 2);
  ctx.fillStyle = "#FDF9EE";
  ctx.fill();
}

/** 입체 행운색 구 — 카드(components/LuckyColorSphere)와 같은 결의 그라데이션을 Canvas로 옮긴다. */
function drawSphere(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, base: string) {
  const pale = paleness(base);
  const light = (t: number) => mix(base, "#FFFFFF", t);
  const TAU = Math.PI * 2;

  // 바닥 그림자 — 넓은 낙하 그림자와 접지 그림자
  ctx.save();
  ctx.translate(cx, cy + radius * 1.02);
  ctx.scale(1, 0.16);
  const floor = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 0.98);
  floor.addColorStop(0, `rgba(0,0,0,${0.16 + 0.06 * pale})`);
  floor.addColorStop(0.55, `rgba(0,0,0,${0.06 + 0.03 * pale})`);
  floor.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.98, 0, TAU);
  ctx.fillStyle = floor;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy + radius * 0.99);
  ctx.scale(1, 0.12);
  const contact = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 0.6);
  contact.addColorStop(0, `rgba(0,0,0,${0.2 + 0.08 * pale})`);
  contact.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.6, 0, TAU);
  ctx.fillStyle = contact;
  ctx.fill();
  ctx.restore();

  // 구 뒤 옅은 빛
  const halo = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 1.5);
  halo.addColorStop(0, `rgba(${hexTriplet(base)},${(0.16 - 0.05 * pale).toFixed(3)})`);
  halo.addColorStop(1, `rgba(${hexTriplet(base)},0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.5, 0, TAU);
  ctx.fillStyle = halo;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.clip();

  // 본체
  const body = ctx.createRadialGradient(
    cx - radius * 0.38,
    cy - radius * 0.5,
    radius * 0.04,
    cx,
    cy,
    radius * 1.04,
  );
  body.addColorStop(0, light(0.62));
  body.addColorStop(0.12, light(0.44));
  body.addColorStop(0.26, light(0.2));
  body.addColorStop(0.4, shade(base, 0.16 * pale));
  body.addColorStop(0.54, shade(base, 0.08 + 0.18 * pale));
  body.addColorStop(0.7, shade(base, 0.19 + 0.24 * pale));
  body.addColorStop(0.86, shade(base, 0.32 + 0.3 * pale));
  body.addColorStop(1, shade(base, 0.46 + 0.28 * pale));
  ctx.fillStyle = body;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  // 넓게 퍼지는 광택
  const gloss = ctx.createRadialGradient(
    cx - radius * 0.36,
    cy - radius * 0.48,
    0,
    cx - radius * 0.36,
    cy - radius * 0.48,
    radius * 0.95,
  );
  gloss.addColorStop(0, `rgba(255,255,255,${(0.46 - 0.16 * pale).toFixed(3)})`);
  gloss.addColorStop(0.35, "rgba(255,255,255,0.1)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  // 바닥 반사광 (오른쪽 아래)
  ctx.save();
  ctx.translate(cx + radius * 0.42, cy + radius * 0.7);
  ctx.scale(1, 0.6);
  const bounce = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.62);
  bounce.addColorStop(0, `rgba(255,255,255,${(0.24 + 0.2 * pale).toFixed(3)})`);
  bounce.addColorStop(0.45, "rgba(255,255,255,0.08)");
  bounce.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.62, 0, TAU);
  ctx.fillStyle = bounce;
  ctx.fill();
  ctx.restore();

  // 안쪽 음영 — 가장자리로 갈수록 짙어진다
  const inset = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius);
  inset.addColorStop(0, "rgba(0,0,0,0)");
  inset.addColorStop(1, `rgba(${hexTriplet(shade(base, 0.62))},${(0.26 + 0.2 * pale).toFixed(3)})`);
  ctx.fillStyle = inset;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  // 또렷한 스펙큘러 하이라이트
  const specular = ctx.createRadialGradient(
    cx - radius * 0.34,
    cy - radius * 0.48,
    0,
    cx - radius * 0.34,
    cy - radius * 0.48,
    radius * 0.15,
  );
  specular.addColorStop(0, "rgba(255,255,255,1)");
  specular.addColorStop(0.26, "rgba(255,255,255,0.9)");
  specular.addColorStop(0.58, "rgba(255,253,246,0.4)");
  specular.addColorStop(1, "rgba(255,253,246,0)");
  ctx.beginPath();
  ctx.arc(cx - radius * 0.34, cy - radius * 0.48, radius * 0.15, 0, TAU);
  ctx.fillStyle = specular;
  ctx.fill();
  ctx.restore();

  // 아주 밝은 색은 테두리를 얇게 그어 카드 배경과 구분한다.
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 0.8, 0, TAU);
  ctx.strokeStyle = pale > 0.35
    ? `rgba(${hexTriplet(shade(base, 0.34))},${(0.16 + 0.24 * pale).toFixed(3)})`
    : "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

/** '#RRGGBB' -> 'r,g,b' */
function hexTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const num = Number.parseInt(clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean, 16);
  return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (ctx.measureText(word).width > maxWidth) {
      let chunk = "";
      for (const char of word) {
        if (ctx.measureText(chunk + char).width > maxWidth) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk += char;
        }
      }
      line = chunk;
    } else {
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function loadBitmap(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 읽지 못했어요"));
    };
    image.src = url;
  });
}

/** 사진을 프레임에 꽉 차게(cover) 그린다. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: ImageBitmap | HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  accent: string,
) {
  const sourceWidth = image.width || 1;
  const sourceHeight = image.height || 1;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;

  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = "rgba(255,253,247,0.92)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(199,168,98,0.55)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - 5, y - 5, width + 10, height + 10, radius + 5);
  ctx.stroke();
  ctx.restore();
  void accent;
}

const ELEMENT_ACCENT: Record<Element, string> = {
  목: "#3E9B63",
  화: "#E2725B",
  토: "#C79A4B",
  금: "#B39A46",
  수: "#4A86B8",
};

export async function composeCardImage(input: CardImageInput): Promise<Blob> {
  if (typeof document === "undefined") throw new Error("이미지는 브라우저에서만 만들 수 있어요");
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* 폰트를 못 기다려도 시스템 글꼴로 그린다 */
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들지 못했어요");

  // 종이 바탕
  const paper = ctx.createLinearGradient(0, 0, W, H);
  paper.addColorStop(0, "#FFFEFA");
  paper.addColorStop(0.55, C.paper);
  paper.addColorStop(1, C.paperDeep);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  // 금빛 이중 테두리
  ctx.save();
  roundRect(ctx, 26, 26, W - 52, H - 52, 34);
  ctx.strokeStyle = "rgba(199,168,98,0.65)";
  ctx.lineWidth = 3;
  ctx.stroke();
  roundRect(ctx, 40, 40, W - 80, H - 80, 26);
  ctx.strokeStyle = "rgba(212,184,118,0.42)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.textBaseline = "alphabetic";

  // 머리글
  ctx.textAlign = "left";
  setLetterSpacing(ctx, "6px");
  ctx.font = `600 25px ${SERIF}`;
  ctx.fillStyle = C.goldDeep;
  ctx.fillText("TODAY'S LUCKY CARD", 106, 124);
  setLetterSpacing(ctx, "0px");

  ctx.font = `600 42px ${SERIF}`;
  ctx.fillStyle = C.forest;
  ctx.fillText("오늘의 행운 카드", 104, 182);

  ctx.textAlign = "right";
  ctx.font = `400 28px ${SERIF}`;
  ctx.fillStyle = C.inkFaint;
  ctx.fillText(input.dateLabel, W - 104, 180);

  ctx.textAlign = "center";

  // 오늘의 행운의 색 — 입체 구
  drawSphere(ctx, W / 2, 372, 122, input.charm.colorHex);

  // 키워드 — 왼쪽에 줄기 있는 네잎클로버를 나란히
  ctx.font = `600 64px ${SERIF}`;
  const titleWidth = ctx.measureText(input.charm.title).width;
  const cloverLeaf = 26;
  const cloverGap = 20;
  const titleRowWidth = cloverLeaf * 1.4 + cloverGap + titleWidth;
  const titleLeft = (W - titleRowWidth) / 2 + cloverLeaf * 1.4 + cloverGap;
  drawClover(ctx, titleLeft - cloverGap - cloverLeaf * 0.7, 606 - cloverLeaf * 0.4, cloverLeaf);
  ctx.textAlign = "left";
  ctx.fillStyle = C.leafDeep;
  ctx.fillText(input.charm.title, titleLeft, 606);
  ctx.textAlign = "center";

  // 구분선
  ctx.strokeStyle = "rgba(212,184,118,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 112, 644);
  ctx.lineTo(W / 2 - 20, 644);
  ctx.moveTo(W / 2 + 20, 644);
  ctx.lineTo(W / 2 + 112, 644);
  ctx.stroke();
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(W / 2, 644, 5, 0, Math.PI * 2);
  ctx.fill();

  // 명언
  ctx.font = `400 37px ${SERIF}`;
  ctx.fillStyle = C.inkSoft;
  const quoteLines = wrapLines(ctx, `“${input.charm.quote}”`, 850).slice(0, 3);
  const quoteTop = 708;
  quoteLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, quoteTop + i * 54);
  });

  // 저자
  const authorY = quoteTop + quoteLines.length * 54 + 10;
  ctx.font = `600 29px ${SERIF}`;
  ctx.fillStyle = C.goldDeep;
  ctx.fillText(`— ${input.charm.author}`, W / 2, authorY);

  // 오늘의 기운
  ctx.font = `400 24px ${SERIF}`;
  ctx.fillStyle = C.inkFaint;
  ctx.fillText(`오늘의 기운 · ${input.elementName} · ${input.pillar}일`, W / 2, authorY + 48);

  // 행운의 색 · 숫자 · 아이템
  const cells = [
    { label: "행운의 색", value: input.charm.colorName, dot: input.charm.colorHex },
    { label: "행운의 숫자", value: input.charm.number, dot: undefined },
    { label: "행운의 아이템", value: input.charm.item, dot: undefined },
  ];
  const tableTop = 990;
  const tableWidth = 864;
  const cellWidth = tableWidth / 3;
  const tableLeft = (W - tableWidth) / 2;

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(tableLeft, tableTop);
  ctx.lineTo(tableLeft + tableWidth, tableTop);
  ctx.moveTo(tableLeft, tableTop + 120);
  ctx.lineTo(tableLeft + tableWidth, tableTop + 120);
  ctx.stroke();

  cells.forEach((cell, index) => {
    const centerX = tableLeft + cellWidth * index + cellWidth / 2;
    if (index > 0) {
      ctx.beginPath();
      ctx.moveTo(tableLeft + cellWidth * index, tableTop);
      ctx.lineTo(tableLeft + cellWidth * index, tableTop + 120);
      ctx.strokeStyle = C.line;
      ctx.stroke();
    }
    ctx.textAlign = "center";
    setLetterSpacing(ctx, "3px");
    ctx.font = `600 21px ${SERIF}`;
    ctx.fillStyle = C.label;
    ctx.fillText(cell.label, centerX, tableTop + 44);
    setLetterSpacing(ctx, "0px");
    ctx.font = `600 36px ${SERIF}`;
    ctx.fillStyle = "#3E3A2C";
    if (cell.dot) {
      // 색 점 없이 글자만 가운데 두고, 점은 글자 앞에 붙인다.
      const valueWidth = ctx.measureText(cell.value).width;
      const dotSize = 18;
      const gap = 12;
      const rowWidth = dotSize + gap + valueWidth;
      const rowLeft = centerX - rowWidth / 2;
      const dotX = rowLeft + dotSize / 2;
      const dotY = tableTop + 94 - 12;
      const dotGradient = ctx.createRadialGradient(
        dotX - dotSize * 0.16,
        dotY - dotSize * 0.22,
        1,
        dotX,
        dotY,
        dotSize / 2,
      );
      dotGradient.addColorStop(0, mix(cell.dot, "#FFFFFF", 0.68));
      dotGradient.addColorStop(0.62, cell.dot);
      dotGradient.addColorStop(1, shade(cell.dot, 0.26));
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = dotGradient;
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.stroke();
      // 아주 밝은 색은 바깥에 옅은 회색 테를 둘러 카드 배경과 구분한다.
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = `rgba(${hexTriplet(shade(cell.dot, 0.45))},${(0.1 + 0.3 * paleness(cell.dot)).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotSize / 2 + 1.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#3E3A2C";
      ctx.textAlign = "left";
      ctx.fillText(cell.value, rowLeft + dotSize + gap, tableTop + 94);
      ctx.textAlign = "center";
    } else {
      ctx.fillText(cell.value, centerX, tableTop + 94);
    }
  });

  // 인증샷 — 한 장이면 4:3, 두 장이면 나란히
  const photoTop = 1150;
  const photoHeight = 480;
  const photoGap = 24;
  const images = await Promise.all(input.photos.slice(0, 2).map((blob) => loadBitmap(blob).catch(() => null)));
  const shown = images.filter(Boolean) as (ImageBitmap | HTMLImageElement)[];

  if (shown.length > 0) {
    const groupWidth = 864;
    const startX = (W - groupWidth) / 2;
    shown.forEach((image, index) => {
      const width = shown.length === 1 ? 640 : (groupWidth - photoGap) / 2;
      const x = shown.length === 1 ? (W - width) / 2 : startX + index * (width + photoGap);
      drawCover(ctx, image, x, photoTop, width, photoHeight, 24, ELEMENT_ACCENT[input.charm.element]);
      if ("close" in image && typeof image.close === "function") image.close();
    });
  }

  // 꼬리말
  ctx.textAlign = "left";
  ctx.font = `600 25px ${SERIF}`;
  const brandWidth = ctx.measureText("Lucky Quest").width;
  ctx.font = `400 23px ${SERIF}`;
  const siteWidth = ctx.measureText("·  luckyquest.app").width;
  const footerStart = (W - (brandWidth + siteWidth)) / 2;
  const footerY = H - 80;
  ctx.font = `600 25px ${SERIF}`;
  ctx.fillStyle = C.leafDeep;
  ctx.fillText("Lucky Quest", footerStart, footerY);
  ctx.font = `400 23px ${SERIF}`;
  ctx.fillStyle = C.inkFaint;
  ctx.fillText("·  luckyquest.app", footerStart + brandWidth, footerY);
  setLetterSpacing(ctx, "0px");

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("이미지를 만들지 못했어요");
  return blob;
}

/** 저장하거나(다운로드) 공유 시트로 넘긴다. */
export async function saveOrShareImage(blob: Blob, filename: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const navWithFiles = nav as (Navigator & { canShare?: (data: ShareData) => boolean }) | undefined;

  if (navWithFiles?.share && navWithFiles.canShare?.({ files: [file] })) {
    try {
      await navWithFiles.share({ files: [file], title: "Lucky Quest" });
      return "shared";
    } catch {
      /* 공유를 취소했으면 저장으로 넘어간다 */
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
