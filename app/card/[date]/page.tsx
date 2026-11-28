import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ELEMENT_META } from "@/lib/content";
import { LuckyColorDot, LuckyColorSphere } from "@/components/LuckyColorSphere";
import { cardForDate, isShareableDate, ogImageUrl, parseCardDate, shareUrl } from "@/lib/share";

type PageProps = { params: Promise<{ date: string }> };

const CLOVER_LEAF_PATH = "M0 0 C 8 -6 13.5 -15.5 9.5 -23.5 C 5.5 -30.5 -5.5 -30.5 -9.5 -23.5 C -13.5 -15.5 -8 -6 0 0 Z";

/** 서버에서 그리는 작은 네잎클로버 — 키워드 옆에 붙인다. */
function CloverMark({
  size = 24,
  tone = "emerald",
  className = "",
}: {
  size?: number;
  tone?: "gold" | "emerald";
  className?: string;
}) {
  const palette = tone === "gold" ? ["#F3D27C", "#D9AE41", "#B98E28"] : ["#7ED09C", "#2E9A63", "#1B7A4B"];
  const gradientId = `share-clover-leaf-${tone}`;
  return (
    <svg width={size} height={size} viewBox="-30 -30 60 74" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="-30" x2="0" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor={palette[0]} />
          <stop offset="0.6" stopColor={palette[1]} />
          <stop offset="1" stopColor={palette[2]} />
        </linearGradient>
      </defs>
      {[0, 90, 180, 270].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <path d={CLOVER_LEAF_PATH} fill={`url(#${gradientId})`} />
          <path d="M0 -2 L0 -21" stroke={palette[0]} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </g>
      ))}
      <path d="M1 6 C 3 20 1 30 -2 40" stroke={palette[2]} strokeWidth="3" strokeLinecap="round" fill="none" />
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

            <div className="mt-2.5 flex justify-center">
              <LuckyColorSphere colorHex={card.colorHex} size={108} />
            </div>

            <h2 className="mt-1.5 flex items-center justify-center gap-2.5 font-serif text-[24px] font-medium leading-snug tracking-[-0.015em] text-[#2F4A3B]">
              <CloverMark size={27} className="shrink-0 translate-y-[3px]" />
              <span>{card.title}</span>
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
                { label: "행운의 색", value: card.colorName, dot: card.colorHex },
                { label: "행운의 숫자", value: card.number, dot: undefined },
                { label: "행운의 아이템", value: card.item, dot: undefined },
              ].map((item) => (
                <div key={item.label} className="px-1 text-center">
                  <dt className="text-[9px] font-semibold tracking-[0.12em] text-[#94804F]">{item.label}</dt>
                  <dd className="mt-1 flex items-center justify-center gap-1.5 font-serif text-[13.5px] font-medium leading-tight text-[#3E3A2C]">
                    {item.dot && <LuckyColorDot colorHex={item.dot} size={9} />}
                    <span>{item.value}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-3 text-center text-[10.5px] text-[#94804F]">
              오늘의 기운 · {element.name} · {card.pillar}일
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
