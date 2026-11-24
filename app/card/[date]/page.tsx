import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ELEMENT_META } from "@/lib/content";
import { cardForDate, isShareableDate, ogImageUrl, parseCardDate, shareUrl } from "@/lib/share";

type PageProps = { params: Promise<{ date: string }> };

/** 서버에서 그린 문양 — 공유 페이지는 자바스크립트 없이도 그대로 보이게 한다. */
function Emblem({ size = 128 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 168 168" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="share-disc" cx="0.5" cy="0.4" r="0.66">
          <stop stopColor="#FFFDF7" />
          <stop offset="1" stopColor="#F5EFDD" />
        </radialGradient>
        <linearGradient id="share-leaf" x1="84" y1="60" x2="84" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3E8F63" />
          <stop offset="1" stopColor="#1F6A48" />
        </linearGradient>
      </defs>
      <circle cx="84" cy="84" r="83" fill="url(#share-disc)" />
      <circle cx="84" cy="84" r="80.5" stroke="#C7A862" strokeWidth="0.9" opacity="0.55" />
      <circle cx="84" cy="84" r="72" stroke="#C7A862" strokeWidth="0.6" opacity="0.32" strokeDasharray="1 4.2" />
      <path d="M84 19 L86.4 26.4 L93.8 28.8 L86.4 31.2 L84 38.6 L81.6 31.2 L74.2 28.8 L81.6 26.4 Z" fill="#C7A862" opacity="0.92" />
      <path d="M70 28.8 H64" stroke="#C7A862" strokeWidth="0.7" opacity="0.45" strokeLinecap="round" />
      <path d="M98 28.8 H104" stroke="#C7A862" strokeWidth="0.7" opacity="0.45" strokeLinecap="round" />
      <g transform="translate(84 100)">
        <ellipse cx="0" cy="-6" rx="44" ry="40" fill="#FFFFFF" opacity="0.22" />
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <path
              d="M0 0 C 8.5 -7 14.5 -17 10 -26 C 5.5 -33.5 -5.5 -33.5 -10 -26 C -14.5 -17 -8.5 -7 0 0 Z"
              fill={deg % 180 === 0 ? "url(#share-leaf)" : "#1F6A48"}
              stroke="#FBF7EA"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M0 -4 L0 -22" stroke="#FFFFFF" strokeOpacity="0.32" strokeWidth="1" strokeLinecap="round" />
          </g>
        ))}
        <path d="M1 7 C 3 18 2 26 0 34" stroke="#1F6A48" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="0" r="2.6" fill="#FCF8EC" />
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
    return { title: "오늘의 카드", robots: { index: false, follow: false } };
  }

  const { key, card } = resolved;
  const url = shareUrl(key);
  const title = `오늘의 카드 — ${card.title}`;
  const description = `${card.dateLabel}의 오늘의 카드. "${card.message}" 사주 오행과 MBTI로 만나는 Lucky Quest.`;
  const image = { url: ogImageUrl(key), width: 1200, height: 630, type: "image/png", alt: `오늘의 카드 — ${card.title}` };

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

        <p className="mt-5 px-1 text-[12.5px] font-semibold text-ink-soft">친구가 보내온 오늘의 카드예요</p>

        <article className="lq-card mt-2.5">
          <span aria-hidden className="lq-card-inner" />
          <div className="relative px-5 pb-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="lq-overline">Today&apos;s Card</p>
                <h1 className="mt-1 font-serif text-[16px] font-medium leading-none tracking-[-0.01em] text-[#3D4136]">
                  오늘의 카드
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
            <p className="mx-auto mt-3 max-w-[19rem] text-center text-[13px] leading-[1.85] text-[#6E6757]">
              {card.message}
            </p>

            <dl className="mt-5 grid grid-cols-3 divide-x divide-[#E6DCC1] border-y border-[#E6DCC1] py-3">
              {[
                { label: "행운의 색", value: card.colorName },
                { label: "숫자", value: card.number },
                { label: "키워드", value: card.keyword },
              ].map((item) => (
                <div key={item.label} className="px-1 text-center">
                  <dt className="text-[9px] font-semibold tracking-[0.16em] text-[#94804F]">{item.label}</dt>
                  <dd className="mt-1 font-serif text-[14px] font-medium leading-none text-[#3E3A2C]">{item.value}</dd>
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
            작은 퀘스트 두 개를 마치면 오늘의 카드가 열려요.
          </p>
          <Link
            href="/"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[14px] bg-forest py-3.5 text-[13.5px] font-semibold tracking-[0.02em] text-[#FBF7EA] shadow-[inset_0_0_0_1px_rgba(212,184,118,0.32)]"
          >
            나도 오늘의 카드 열기
          </Link>
          <p className="mt-3 text-[10.5px] text-ink-faint">로그인 없이 30초, 입력한 정보는 이 기기에만 저장돼요.</p>
        </section>

        <p className="mt-6 text-center text-[10.5px] text-ink-faint">luckyquest.app</p>
      </main>
    </div>
  );
}
