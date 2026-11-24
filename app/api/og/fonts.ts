import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * OG 이미지용 한글 폰트(Noto Serif KR 서브셋, 400·600).
 * 로컬에서는 public/fonts 파일을 바로 읽고, 배포 환경에서 파일이 함수 번들에 없으면
 * 같은 배포의 /fonts/... 공개 경로에서 한 번 받아 메모리에 둔다.
 */
const FILES = {
  400: "og-serif-400.ttf",
  600: "og-serif-600.ttf",
} as const;

export type OgFontWeight = 400 | 600;

export interface OgFont {
  weight: OgFontWeight;
  data: ArrayBuffer;
}

let cache: OgFont[] | null = null;

async function readFont(name: string, origin: string): Promise<ArrayBuffer> {
  try {
    const buffer = await readFile(path.join(process.cwd(), "public", "fonts", name));
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  } catch {
    const response = await fetch(`${origin}/fonts/${name}`);
    if (!response.ok) throw new Error(`OG 폰트를 불러오지 못했습니다: ${name} (${response.status})`);
    return await response.arrayBuffer();
  }
}

export async function loadOgFonts(origin: string): Promise<OgFont[]> {
  if (cache) return cache;
  cache = await Promise.all([
    readFont(FILES[400], origin).then((data) => ({ weight: 400 as const, data })),
    readFont(FILES[600], origin).then((data) => ({ weight: 600 as const, data })),
  ]);
  return cache;
}
