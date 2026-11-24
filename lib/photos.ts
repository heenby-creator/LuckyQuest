/**
 * 선택형 퀘스트 인증샷 — 브라우저(IndexedDB)에만 저장한다.
 *
 * - 사진은 외부 서버로 보내지 않는다. 이 기기의 브라우저 안에만 남는다.
 * - 올릴 때 Canvas로 다시 그려(최대 800px, JPEG 0.82) 저장하므로
 *   원본에 붙어 있던 EXIF·촬영 위치 정보는 따라오지 않는다.
 */

export interface QuestPhoto {
  /** `${dateKey}#${index}` — 하루에 퀘스트별로 한 장 */
  id: string;
  dateKey: string;
  index: 0 | 1;
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  createdAt: number;
}

export const PHOTO_MAX_EDGE = 800;
export const PHOTO_QUALITY = 0.82;

const DB_NAME = "luckyquest.photos";
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("이 브라우저에서는 사진을 저장할 수 없어요"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("dateKey", "dateKey", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("사진 저장소를 열지 못했어요"));
  });
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("사진 저장에 실패했어요"));
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error ?? new Error("사진 저장에 실패했어요"));
      }),
  );
}

/** 올린 사진을 화면에 보여 줄 크기로 줄이고 다시 인코딩한다(EXIF 제거). */
export async function preparePhoto(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (!file.type.startsWith("image/")) throw new Error("사진 파일만 올릴 수 있어요");

  let source: ImageBitmap | HTMLImageElement;
  let width: number;
  let height: number;
  let revoke: string | null = null;

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      source = bitmap;
      width = bitmap.width;
      height = bitmap.height;
    } catch {
      source = await loadImageElement(file);
      width = (source as HTMLImageElement).naturalWidth;
      height = (source as HTMLImageElement).naturalHeight;
      revoke = (source as HTMLImageElement).dataset.objectUrl ?? null;
    }
  } else {
    source = await loadImageElement(file);
    width = (source as HTMLImageElement).naturalWidth;
    height = (source as HTMLImageElement).naturalHeight;
    revoke = (source as HTMLImageElement).dataset.objectUrl ?? null;
  }

  if (!width || !height) throw new Error("사진을 읽지 못했어요");

  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(width, height));
  const outWidth = Math.max(1, Math.round(width * scale));
  const outHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진을 다듬지 못했어요");
  // 투명한 PNG도 JPEG로 저장되므로 흰 바탕을 먼저 깔아 둔다.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, outWidth, outHeight);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, outWidth, outHeight);

  if ("close" in source && typeof source.close === "function") source.close();
  if (revoke) URL.revokeObjectURL(revoke);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", PHOTO_QUALITY));
  if (!blob) throw new Error("사진을 압축하지 못했어요");
  return { blob, width: outWidth, height: outHeight };
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.dataset.objectUrl = url;
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 읽지 못했어요"));
    };
    image.src = url;
  });
}

export async function saveQuestPhoto(
  dateKey: string,
  index: 0 | 1,
  photo: { blob: Blob; width: number; height: number },
): Promise<QuestPhoto> {
  const record: QuestPhoto = {
    id: `${dateKey}#${index}`,
    dateKey,
    index,
    blob: photo.blob,
    width: photo.width,
    height: photo.height,
    bytes: photo.blob.size,
    createdAt: Date.now(),
  };
  await run("readwrite", (store) => store.put(record));
  return record;
}

export async function getDayPhotos(dateKey: string): Promise<QuestPhoto[]> {
  try {
    const db = await openDb();
    return await new Promise<QuestPhoto[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).index("dateKey").getAll(dateKey);
      request.onsuccess = () => resolve((request.result as QuestPhoto[]).sort((a, b) => a.index - b.index));
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

export async function deleteQuestPhoto(dateKey: string, index: 0 | 1): Promise<void> {
  await run("readwrite", (store) => store.delete(`${dateKey}#${index}`));
}

/** 달력에서 사진이 있는 날을 표시하려고 날짜별 장수를 센다. */
export async function countPhotosByDate(): Promise<Record<string, number>> {
  try {
    const db = await openDb();
    return await new Promise<Record<string, number>>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => {
        const counts: Record<string, number> = {};
        for (const record of request.result as QuestPhoto[]) {
          counts[record.dateKey] = (counts[record.dateKey] ?? 0) + 1;
        }
        resolve(counts);
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return {};
  }
}
