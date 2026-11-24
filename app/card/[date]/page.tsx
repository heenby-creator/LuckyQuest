import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ELEMENT_META } from "@/lib/content";
import { cardForDate, isShareableDate, ogImageUrl, parseCardDate, shareUrl } from "@/lib/share";

type PageProps = { params: Promise<{ date: string }> };

const LEAF_PATH = "M0 0 C 8.6 -7 14.6 -17 10.1 -26.2 C 5.4 -33.8 -5.4 -33.8 -10.1 -26.2 C -14.6 -17 -8.6 -7 0 0 Z";
const VEIN_PATH = "M0 -10 L4.2 -13.2 M0 -10 L-4.2 -13.2 M0 -15.2 L4.4 -18.4 M0 -15.2 L-4.4 -18.4 M0 -19.8 L3.5 -22 M0 -19.8 L-3.5 -22";

/** 서버에서 그린 문양 — 공유 페이지는 자바스크립트 없이도 그대로 보이게 한다. */
function Emblem({ size = 128 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 168 168" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="share-disc" cx="0.46" cy="0.36" r="0.7">
          <stop stopColor="#FFFFFB" />
          <stop offset="0.62" stopColor="#FBF6E8" />
          <stop offset="1" stopColor="#F3ECD8" />
        </radialGradient>
        <linearGradient id="share-leaf-front" x1="0" y1="-33" x2="0" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#77CB9C" />
          <stop offset="0.55" stopColor="#3E9B69" />
          <stop offset="1" stopColor="#1C6B49" />
        </linearGradient>
        <linearGradient id="share-leaf-back" x1="0" y1="-33" x2="0" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AB588" />
          <stop offset="0.55" stopColor="#2E8A5C" />
          <stop offset="1" stopColor="#16583C" />
        </linearGradient>
        <linearGradient id="share-stem" x1="0" y1="0" x2="0" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3E9B69" />
          <stop offset="1" stopColor="#1C6B49" />
        </linearGradient>
        <radialGradient id="share-glow" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="84" cy="84" r="83" fill="url(#share-disc)" />
      <circle cx="84" cy="84" r="81.5" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.7" />
      <circle cx="84" cy="84" r="80.5" stroke="#C7A862" strokeWidth="0.9" opacity="0.6" />
      <circle cx="84" cy="84" r="72" stroke="#C7A862" strokeWidth="0.6" opacity="0.34" strokeDasharray="1 4.2" />
      <path d="M84 19 L86.4 26.4 L93.8 28.8 L86.4 31.2 L84 38.6 L81.6 31.2 L74.2 28.8 L81.6 26.4 Z" fill="#C7A862" opacity="0.95" />
      <path d="M70 28.8 H64" stroke="#C7A862" strokeWidth="0.7" opacity="0.45" strokeLinecap="round" />
      <path d="M98 28.8 H104" stroke="#C7A862" strokeWidth="0.7" opacity="0.45" strokeLinecap="round" />
      <g transform="translate(84 104)">
        <ellipse cx="0" cy="-2" rx="52" ry="46" fill="url(#share-glow)" />
        <ellipse cx="0" cy="30" rx="30" ry="6.5" fill="#123F2C" opacity="0.09" />
        {[270, 90, 0, 180].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path d={LEAF_PATH} transform="translate(1.1 2.1)" fill="#123F2C" opacity="0.14" />
            <path
              d={LEAF_PATH}
              fill={deg % 180 === 0 ? "url(#share-leaf-front)" : "url(#share-leaf-back)"}
              stroke="#FCF8EC"
              strokeWidth="1.15"
              strokeLinejoin="round"
            />
            <path d="M0 -3.6 L0 -23.2" stroke="#EAF7EF" strokeWidth="1.15" strokeLinecap="round" opacity="0.6" />
            <path d={VEIN_PATH} stroke="#E7F5EC" strokeWidth="0.72" strokeLinecap="round" opacity="0.45" />
            <ellipse cx="-3.7" cy="-17" rx="3" ry="7.8" transform="rotate(-14 -3.7 -17)" fill="#FFFFFF" opacity="0.26" />
            <ellipse cx="3.9" cy="-11.2" rx="1.9" ry="4.6" fill="#0E3F2C" opacity="0.11" />
            <circle cx="0" cy="-24.6" r="1.15" fill="#FFFFFF" opacity="0.4" />
          </g>
        ))}
        <path d="M1.2 6 C 5.6 19 2.4 29.4 -3.2 40" stroke="url(#share-stem)" strokeWidth="2.7" strokeLinecap="round" fill="none" />
        <path d="M-1.6 28 C -5.8 26 -8 22.6 -8.6 18.8 C -4.6 18.4 -2 21 -1.6 28 Z" fill="#1C6B49" opacity="0.8" />
        <circle cx="0" cy="0" r="2.8" fill="#FDF9EE" />
        <circle cx="0" cy="0" r="1.3" fill="#3E9B69" opacity="0.55" />
      </g>
      <path d="M62 146 Q84 154 106 146" stroke="#C7A862" strokeWidth="0.8" opacity="0.55" fill="none" />
      <circle cx="84" cy="150.5" r="1.1" fill="#C7A862" opacity="0.6" />
    </svg>
  );
}

function resolve(date: string) {
  const key = parseCardDate(date);
  if (!key || !isShareableDate(key)) return null;
  return { key, card: cardForDate(key) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const resolved = resolve(date);
  if (!resolved) {
    return { title: "오늘의 행운 카드", robots: { index: false, follow: false } };
  }

  const { key, card } = resolved;
  const url = shareUrl(key);
  const title = `오늘의 행운 카드 — ${card.title}`;
  const description = `${card.dateLabel}의 오늘의 행운 카드. "${card.quote}" — ${card.author}. 사주 오행과 MBTI로 만나는 Lucky Quest.`;
  const image = { url: ogImageUrl(key), width: 1200, height: 630, type: "image/png", alt: `오늘의 행운 카드 — ${card.title}` };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url,
      siteName: "Lucky Quest",
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

export default async function SharedCardPage({ params }: PageProps) {
  const { date } = await params;
  const resolved = resolve(date);
  if (!resolved) notFound();

  const { card } = resolved;
  const element = ELEMENT_META[card.element];

  return (
    <div className="flex min-h-dvh w-full justify-center px-4 py-8">
      <main className="w-full max-w-[430px]">
        <div className="flex items-center gap-2 px-1">
          <svg width="22" height="27" viewBox="-30 -30 60 74" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="share-clover" x1="0" y1="-30" x2="0" y2="10" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7ED09C" />
                <stop offset="0.6" stopColor="#2E9A63" />
                <stop offset="1" stopColor="#1B7A4B" />
              </linearGradient>
            </defs>
            {[0, 90, 180, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <path
                  d="M0 0 C 8 -6 13.5 -15.5 9.5 -23.5 C 5.5 -30.5 -5.5 -30.5 -9.5 -23.5 C -13.5 -15.5 -8 -6 0 0 Z"
                  fill="url(#share-clover)"
                />
              </g>
            ))}
            <path d="M1 6 C 3 20 1 30 -2 40" stroke="#1B7A4B" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
          <span className="text-[17px] font-extrabold tracking-tight text-leaf">Lucky Quest</span>
        </div>

        <p className="mt-5 px-1 text-[12.5px] font-semibold text-ink-soft">친구가 보내온 오늘의 행운 카드예요</p>

        <article className="lq-card mt-2.5">
          <span aria-hidden className="lq-card-inner" />
          <div className="relative px-5 pb-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="lq-overline">Today&apos;s Lucky Card</p>
                <h1 className="mt-1 font-serif text-[16px] font-medium leading-none tracking-[-0.01em] text-[#3D4136]">
                  오늘의 행운 카드
                </h1>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold-line/65 bg-[#FBF6E7]/85 px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-[#8E7234]">
                {card.dateLabel}
              </span>
            </div>

            <div className="mt-3 flex justify-center">
              <Emblem size={132} />
            </div>

            <h2 className="mt-2 text-center font-serif text-[24px] font-medium leading-snug tracking-[-0.015em] text-[#2F4A3B]">
              {card.title}
            </h2>
            <div className="mt-2.5 flex items-center justify-center gap-2 text-gold-line">
              <span className="h-px w-10 bg-current opacity-70" />
              <span className="text-[10px] text-[#C7A862]">✦</span>
              <span className="h-px w-10 bg-current opacity-70" />
            </div>
            <blockquote className="mx-auto mt-3 max-w-[19rem] text-center">
              <p className="text-[13px] leading-[1.85] text-[#6E6757]">&ldquo;{card.quote}&rdquo;</p>
              <footer className="mt-1.5 font-serif text-[11px] tracking-[0.02em] text-[#94804F]">— {card.author}</footer>
            </blockquote>

            <dl className="mt-5 grid grid-cols-3 divide-x divide-[#E6DCC1] border-y border-[#E6DCC1] py-3">
              {[
                { label: "행운의 색", value: card.colorName },
                { label: "행운의 숫자", value: card.number },
                { label: "행운의 아이템", value: card.item },
              ].map((item) => (
                <div key={item.label} className="px-1 text-center">
                  <dt className="text-[9px] font-semibold tracking-[0.12em] text-[#94804F]">{item.label}</dt>
                  <dd className="mt-1 font-serif text-[13.5px] font-medium leading-tight text-[#3E3A2C]">{item.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-3 text-center text-[10.5px] text-[#94804F]">
              오늘의 기운 · {element.name} · {card.pillar}
            </p>
          </div>
        </article>

        <section className="mt-5 rounded-[22px] border border-line bg-white/70 px-5 py-5 text-center">
          <p className="font-serif text-[15px] font-medium leading-relaxed text-[#2F4A3B]">
            내일은 나에게 어떤 카드가 열릴까요?
          </p>
          <p className="mt-1.5 text-[12px] leading-[1.75] text-ink-soft">
            생년월일과 MBTI로 오늘의 운세를 읽고,
            <br />
            작은 퀘스트 두 개를 마치면 오늘의 행운 카드가 열려요.
          </p>
          <Link
            href="/"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[14px] bg-forest py-3.5 text-[13.5px] font-semibold tracking-[0.02em] text-[#FBF7EA] shadow-[inset_0_0_0_1px_rgba(212,184,118,0.32)]"
          >
            나도 오늘의 행운 카드 열기
          </Link>
          <p className="mt-3 text-[10.5px] text-ink-faint">로그인 없이 30초, 입력한 정보는 이 기기에만 저장돼요.</p>
        </section>

        <p className="mt-6 text-center text-[10.5px] text-ink-faint">luckyquest.app</p>
      </main>
    </div>
  );
}
