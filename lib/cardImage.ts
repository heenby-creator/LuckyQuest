/**
 * 인증샷 포함 카드 이미지 — 클라이언트 Canvas로 오늘의 행운 카드와 사진을 한 장에 합성한다.
 * 사진은 브라우저 밖으로 나가지 않고, 만들어진 PNG만 사용자가 저장·공유한다.
 */
import type { CharmView } from "./engine";
import type { Element } from "./types";

const W = 1080;
const H = 1620;

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

function drawClover(ctx: CanvasRenderingContext2D, cx: number, cy: number, leaf: number) {
  const k = leaf / 30;
  const leafPath = (rot: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(8 * k, -6 * k, 13.5 * k, -15.5 * k, 9.5 * k, -23.5 * k);
    ctx.bezierCurveTo(5.5 * k, -30.5 * k, -5.5 * k, -30.5 * k, -9.5 * k, -23.5 * k);
    ctx.bezierCurveTo(-13.5 * k, -15.5 * k, -8 * k, -6 * k, 0, 0);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, -30 * k, 0, 0);
    gradient.addColorStop(0, rot % 180 === 0 ? "#5CAF7F" : "#3E8F63");
    gradient.addColorStop(1, rot % 180 === 0 ? "#2E7A55" : "#1F6A48");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(251,247,234,0.9)";
    ctx.lineWidth = 2.5 * k;
    ctx.stroke();
    // 잎맥
    ctx.beginPath();
    ctx.moveTo(0, -4 * k);
    ctx.lineTo(0, -22 * k);
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = 1.6 * k;
    ctx.stroke();
    ctx.restore();
  };

  [0, 90, 180, 270].forEach(leafPath);

  // 줄기
  ctx.beginPath();
  ctx.moveTo(cx + 2 * k, cy + 6 * k);
  ctx.bezierCurveTo(cx + 6 * k, cy + 22 * k, cx + 2 * k, cy + 30 * k, cx - 4 * k, cy + 42 * k);
  ctx.strokeStyle = "#1F6A48";
  ctx.lineWidth = 5 * k;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const r = 150;
  const disc = ctx.createRadialGradient(cx - 30, cy - 60, 10, cx, cy, r);
  disc.addColorStop(0, "#FFFEF9");
  disc.addColorStop(1, "#F5EFDD");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = disc;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(199,168,98,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([3, 12]);
  ctx.beginPath();
  ctx.arc(cx, cy, r - 22, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(199,168,98,0.32)";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  // 위쪽 작은 별
  const star = (x: number, y: number, s: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.28, y - s * 0.28);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x + s * 0.28, y + s * 0.28);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.28, y + s * 0.28);
    ctx.lineTo(x - s, y);
    ctx.lineTo(x - s * 0.28, y - s * 0.28);
    ctx.closePath();
    ctx.fillStyle = C.gold;
    ctx.fill();
  };
  star(cx, cy - r + 42, 16);

  // 클로버 뒤 은은한 빛
  const glow = ctx.createRadialGradient(cx, cy + 10, 20, cx, cy + 10, 130);
  glow.addColorStop(0, "rgba(255,255,255,0.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(cx, cy + 10, 130, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  drawClover(ctx, cx, cy + 44, 82);
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
    // 한 단어가 한 줄을 넘으면 글자 단위로 자른다.
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
  const sourceWidth = "width" in image ? image.width : 1;
  const sourceHeight = "height" in image ? image.height : 1;
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
  ctx.strokeStyle = "rgba(255,253,247,0.9)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = accent;
  ctx.fillRect(x + width / 2 - 26, y + height - 5, 52, 5);
  ctx.restore();
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
  ctx.font = `600 26px ${SERIF}`;
  ctx.fillStyle = C.goldDeep;
  ctx.fillText("TODAY'S LUCKY CARD", 108, 130);
  setLetterSpacing(ctx, "0px");

  ctx.font = `600 42px ${SERIF}`;
  ctx.fillStyle = C.forest;
  ctx.fillText("오늘의 행운 카드", 106, 188);

  ctx.textAlign = "right";
  ctx.font = `400 30px ${SERIF}`;
  ctx.fillStyle = C.inkFaint;
  ctx.fillText(input.dateLabel, W - 106, 186);

  ctx.textAlign = "center";

  // 문양
  drawEmblem(ctx, W / 2, 396);

  // 키워드
  ctx.font = `600 68px ${SERIF}`;
  ctx.fillStyle = C.leafDeep;
  ctx.fillText(input.charm.title, W / 2, 636);

  // 구분선
  ctx.strokeStyle = "rgba(212,184,118,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 118, 676);
  ctx.lineTo(W / 2 - 22, 676);
  ctx.moveTo(W / 2 + 22, 676);
  ctx.lineTo(W / 2 + 118, 676);
  ctx.stroke();
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(W / 2, 676, 5, 0, Math.PI * 2);
  ctx.fill();

  // 명언
  ctx.font = `400 40px ${SERIF}`;
  ctx.fillStyle = C.inkSoft;
  const quoteLines = wrapLines(ctx, `“${input.charm.quote}”`, 850);
  const quoteTop = 742;
  quoteLines.slice(0, 4).forEach((line, i) => {
    ctx.fillText(line, W / 2, quoteTop + i * 58);
  });

  // 저자
  ctx.font = `600 30px ${SERIF}`;
  ctx.fillStyle = C.goldDeep;
  ctx.fillText(`— ${input.charm.author}`, W / 2, quoteTop + quoteLines.slice(0, 4).length * 58 + 14);

  // 오늘의 기운
  ctx.font = `400 26px ${SERIF}`;
  ctx.fillStyle = C.inkFaint;
  ctx.fillText(`오늘의 기운 · ${input.elementName} · ${input.pillar}`, W / 2, quoteTop + quoteLines.slice(0, 4).length * 58 + 66);

  // 행운의 색 · 숫자 · 아이템
  const cells = [
    { label: "행운의 색", value: input.charm.colorName },
    { label: "행운의 숫자", value: input.charm.number },
    { label: "행운의 아이템", value: input.charm.item },
  ];
  const tableTop = 1060;
  const tableWidth = 864;
  const cellWidth = tableWidth / 3;
  const tableLeft = (W - tableWidth) / 2;

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(tableLeft, tableTop);
  ctx.lineTo(tableLeft + tableWidth, tableTop);
  ctx.moveTo(tableLeft, tableTop + 128);
  ctx.lineTo(tableLeft + tableWidth, tableTop + 128);
  ctx.stroke();

  cells.forEach((cell, index) => {
    const centerX = tableLeft + cellWidth * index + cellWidth / 2;
    if (index > 0) {
      ctx.beginPath();
      ctx.moveTo(tableLeft + cellWidth * index, tableTop);
      ctx.lineTo(tableLeft + cellWidth * index, tableTop + 128);
      ctx.strokeStyle = C.line;
      ctx.stroke();
    }
    ctx.textAlign = "center";
    setLetterSpacing(ctx, "3px");
    ctx.font = `600 22px ${SERIF}`;
    ctx.fillStyle = C.label;
    ctx.fillText(cell.label, centerX, tableTop + 46);
    setLetterSpacing(ctx, "0px");
    ctx.font = `600 38px ${SERIF}`;
    ctx.fillStyle = "#3E3A2C";
    ctx.fillText(cell.value, centerX, tableTop + 100);
  });

  // 인증샷
  const photoTop = 1236;
  const photoHeight = 268;
  const photoWidth = 420;
  const photoGap = 24;
  const images = await Promise.all(input.photos.slice(0, 2).map((blob) => loadBitmap(blob).catch(() => null)));
  const shown = images.filter(Boolean) as (ImageBitmap | HTMLImageElement)[];

  if (shown.length > 0) {
    const totalWidth = photoWidth * 2 + photoGap;
    const startX = (W - totalWidth) / 2;
    shown.forEach((image, index) => {
      const width = shown.length === 1 ? totalWidth : photoWidth;
      drawCover(
        ctx,
        image,
        shown.length === 1 ? startX : startX + index * (photoWidth + photoGap),
        photoTop,
        width,
        photoHeight,
        22,
        ELEMENT_ACCENT[input.charm.element],
      );
      if ("close" in image && typeof image.close === "function") image.close();
    });
    ctx.textAlign = "center";
    ctx.font = `400 22px ${SERIF}`;
    ctx.fillStyle = C.inkFaint;
    ctx.fillText("오늘 남긴 인증샷", W / 2, photoTop + photoHeight + 46);
  }

  // 꼬리말
  ctx.textAlign = "left";
  ctx.font = `600 26px ${SERIF}`;
  const brandWidth = ctx.measureText("Lucky Quest").width;
  ctx.font = `400 24px ${SERIF}`;
  const siteWidth = ctx.measureText("·  luckyquest.app").width;
  const footerStart = (W - (brandWidth + siteWidth)) / 2;
  ctx.font = `600 26px ${SERIF}`;
  ctx.fillStyle = C.leafDeep;
  ctx.fillText("Lucky Quest", footerStart, H - 96);
  ctx.font = `400 24px ${SERIF}`;
  ctx.fillStyle = C.inkFaint;
  ctx.fillText("·  luckyquest.app", footerStart + brandWidth, H - 96);
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
