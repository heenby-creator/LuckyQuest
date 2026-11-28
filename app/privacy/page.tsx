import type { Metadata } from "next";
import Link from "next/link";
import { Clover, Sparkle, StarMascot } from "@/components/illustrations";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

/**
 * 개인정보 처리방침 — Google Play 스토어 등록에 필요한 공개 URL.
 *
 * 앱의 실제 동작을 그대로 적는다.
 * - 회원가입·로그인·서버 계정이 없다(lib/storage.ts: localStorage 한 곳).
 * - 인증샷은 IndexedDB에만, 올릴 때 다시 그려 EXIF를 떨어뜨린다(lib/photos.ts).
 * - 이용 통계만 GA4로 나간다(lib/analytics.ts, app/layout.tsx).
 * - '아침 7시 알림'을 직접 켠 이용자에 한해, 발송용 기기 푸시 주소(익명 endpoint)만
 *   서버(Upstash Redis)에 보관하고, 끄면 즉시 지운다(lib/pushStore.ts, app/api/push/subscribe).
 * 앱 동작이 바뀌면 이 문서도 함께 고쳐야 한다.
 */

const EFFECTIVE_DATE = "2026년 11월 28일";
const CONTACT_EMAIL = "heenby@gmail.com";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description:
    "Lucky Quest는 회원가입과 로그인 없이, 입력한 생년월일·MBTI·퀘스트 기록과 인증샷을 이용자 기기 안에만 저장합니다. ‘아침 7시 알림’을 직접 켠 경우에만 발송용 기기 주소(익명)를 서버에 보관하고, 끄면 바로 지웁니다.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "article",
    locale: "ko_KR",
    url: "https://www.luckyquest.app/privacy",
    siteName: "Lucky Quest",
    title: "개인정보 처리방침 · Lucky Quest",
    description: "Lucky Quest가 어떤 정보를 어디에 담고, 무엇을 보내지 않는지 안내합니다.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Lucky Quest" }],
  },
  robots: { index: true, follow: true },
};

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <span className="mt-[2px] flex size-7 shrink-0 items-center justify-center rounded-full bg-leaf-soft text-[12px] font-extrabold tabular-nums text-leaf-strong">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">{title}</h2>
          <div className="mt-2 space-y-2.5 text-[14px] leading-[1.85] text-ink-soft">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1.5">{children}</ul>;
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className="mt-[9px] size-1 shrink-0 rounded-full bg-leaf/70" />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <div className="relative min-h-dvh">
      <div className="lq-backdrop" aria-hidden />

      <div className="relative mx-auto w-full max-w-[720px] break-keep px-4 pb-14 pt-[max(14px,env(safe-area-inset-top))] md:px-6 md:pt-8">
        {/* 상단 — 앱으로 돌아가기 */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border border-line bg-white/75 px-3 py-1.5 text-[12px] font-bold text-ink-soft transition hover:bg-white"
          >
            <span aria-hidden className="text-[15px] leading-none">‹</span>
            앱으로 돌아가기
          </Link>
          <span className="flex items-center gap-1.5">
            <StarMascot size={26} />
            <span className="text-[12.5px] font-extrabold tracking-tight text-leaf">Lucky Quest</span>
          </span>
        </div>

        {/* 제목 */}
        <header className="mt-5 rounded-[26px] border border-line bg-white/75 px-5 py-5">
          <p className="lq-overline">Privacy Policy</p>
          <h1 className="mt-2 font-serif text-[25px] font-medium leading-[1.25] tracking-[-0.02em] text-ink md:text-[29px]">
            개인정보 처리방침
          </h1>
          <p className="mt-3 text-[14px] leading-[1.85] text-ink-soft">
            Lucky Quest(이하 ‘서비스’)는 회원가입도 로그인도 없이 오늘의 운세와 작은 퀘스트를 건네는 웹 앱입니다.
            이용자가 입력한 정보는 서버로 보내지 않고 이용자의 기기 안에만 담깁니다.
            직접 켠 ‘아침 7시 알림’의 발송용 기기 주소만 예외로 서버에 보관합니다.
            이 문서는 어떤 정보가 어디에 어떻게 남는지를 사실대로 적은 것입니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-faint">
            <span>시행일 {EFFECTIVE_DATE}</span>
            <span className="text-line" aria-hidden>|</span>
            <span>
              문의{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-leaf underline decoration-leaf/30 underline-offset-2">
                {CONTACT_EMAIL}
              </a>
            </span>
          </div>
        </header>

        {/* 한눈에 보기 */}
        <div className="mt-3 rounded-[26px] border border-leaf/25 bg-leaf-soft/80 px-5 py-4">
          <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-leaf-strong">
            <Clover size={14} />
            한눈에 보기
          </p>
          <ul className="mt-2.5 space-y-1.5 text-[13.5px] leading-[1.8] text-[#2C5B47]">
            <Item>회원가입·로그인이 없어, 서비스에 이용자 계정이 만들어지지 않아요.</Item>
            <Item>생년월일·태어난 시간·MBTI·퀘스트 기록은 이용자 기기 브라우저에만 저장돼요.</Item>
            <Item>인증샷(선택)도 기기 안에만 저장하고, 저장 전에 촬영 위치 정보를 지워요.</Item>
            <Item>서비스 개선을 위한 익명 이용 통계만 Google Analytics 4로 전송돼요.</Item>
            <Item>‘아침 7시 알림’을 직접 켠 경우에만 알림 발송용 기기 주소(익명)가 서버에 보관되고, 끄면 바로 지워져요.</Item>
          </ul>
        </div>

        <div className="mt-3 space-y-3">
          <Section n="1" title="수집하지 않는 정보">
            <p>
              서비스는 이름, 전화번호, 주소, 이메일 주소, 주민등록번호, 계정 비밀번호, 연락처, 결제 정보를
              요구하지도 수집하지도 않습니다. 회원가입·로그인 절차가 없으므로 서버에 이용자 계정이나 프로필이
              만들어지지 않습니다.
            </p>
            <p>
              연락처·위치·사진첩 전체에 접근하는 권한을 요청하지 않으며, 광고 식별자를 이용한 맞춤형 광고도
              하지 않습니다.
            </p>
          </Section>

          <Section n="2" title="기기 안에만 저장되는 정보">
            <p>
              운세와 퀘스트를 만들려면 생년월일과 MBTI가 필요합니다. 이 값들은 이용자 기기의 브라우저 저장소에만
              남고, 서비스 운영자의 서버로 전송되거나 보관되지 않습니다.
            </p>
            <div className="space-y-2 rounded-2xl border border-line bg-cream/70 p-3.5">
              <div>
                <p className="text-[12px] font-extrabold text-ink">브라우저 저장소(localStorage)</p>
                <p className="mt-1 text-[12.5px] leading-[1.75] text-ink-soft">
                  생년월일(양력·음력, 윤달 여부), 태어난 시간(12시진 중 선택 또는 ‘모름’), MBTI,
                  날짜별 퀘스트 배정과 완료 체크, 연속 실천 일수, 모은 행운 카드의 날짜와 종류.
                  이용자가 기록을 지우거나 브라우저 저장소를 비울 때까지 남습니다.
                </p>
              </div>
              <div className="border-t border-dashed border-line pt-2">
                <p className="text-[12px] font-extrabold text-ink">브라우저 저장소(IndexedDB)</p>
                <p className="mt-1 text-[12.5px] leading-[1.75] text-ink-soft">
                  퀘스트에 곁들인 인증샷(선택). 이용자가 지울 때까지 남습니다.
                </p>
              </div>
            </div>
            <p>
              기기를 바꾸거나 다른 브라우저로 열면 이 정보는 따라오지 않습니다. 자동으로 동기화되지 않으며,
              서비스는 이용자의 기록을 대신 복구해 줄 수 없습니다.
            </p>
          </Section>

          <Section n="3" title="아침 7시 알림을 켰을 때 (웹 푸시)">
            <p>
              ‘마이’ 탭의 ‘아침 7시 운세 알림’을 직접 켠 경우에만, 알림을 보내기 위해 아래 정보를 서비스
              서버에 보관합니다. 스위치를 켜지 않았다면 알림을 위한 어떤 정보도 보내지 않습니다.
            </p>
            <div className="space-y-2 rounded-2xl border border-line bg-cream/70 p-3.5">
              <div>
                <p className="text-[12px] font-extrabold text-ink">서버에 보관하는 것</p>
                <p className="mt-1 text-[12.5px] leading-[1.75] text-ink-soft">
                  브라우저가 만든 기기 푸시 주소(endpoint, 익명 주소), 알림을 암호화할 때 쓰는 공개키 값,
                  알림을 켠 시각. 이름·연락처·생년월일·MBTI는 함께 보내지 않습니다.
                </p>
              </div>
              <div className="border-t border-dashed border-line pt-2">
                <p className="text-[12px] font-extrabold text-ink">보관 기간과 삭제</p>
                <p className="mt-1 text-[12.5px] leading-[1.75] text-ink-soft">
                  스위치를 끄면 서버에서 바로 삭제합니다. 기기 변경·앱 삭제로 브라우저가 구독을 버린 경우에는
                  다음 알림 발송 때 확인해 함께 정리합니다.
                </p>
              </div>
            </div>
            <Bullets>
              <Item>
                알림 문구에는 ‘오늘의 운세가 도착했다’는 안내만 담고, 오행 풀이·퀘스트 내용은 담지 않습니다.
                내용은 앱을 열어야 보입니다.
              </Item>
              <Item>
                구독 목록은 Upstash(Redis 호스팅)에 보관하고, 발송은 Vercel의 예약 실행으로 합니다. 두 사업자에게는
                푸시 주소와 발송 시각만 지나갑니다.
              </Item>
              <Item>
                기기 설정에서 알림을 꺼도 발송이 멈추며, 앱을 열면 스위치가 꺼진 상태로 보입니다.
              </Item>
            </Bullets>
          </Section>

          <Section n="4" title="인증샷은 어떻게 다루나요">
            <Bullets>
              <Item>인증샷은 선택 사항입니다. 올리지 않아도 모든 기능을 쓸 수 있어요.</Item>
              <Item>
                사진을 고르면 브라우저 안에서 긴 변 800픽셀 이내의 JPEG로 다시 그려 저장합니다. 이 과정에서
                원본 파일에 붙어 있던 촬영 위치·기기 정보(EXIF)는 함께 저장되지 않습니다.
              </Item>
              <Item>사진은 서버로 올라가지 않으며, 사진첩 전체가 아니라 이용자가 고른 사진 한 장만 읽습니다.</Item>
              <Item>‘인증샷 지우기’ 또는 ‘기록 초기화’로 언제든 지울 수 있습니다.</Item>
            </Bullets>
          </Section>

          <Section n="5" title="익명 이용 통계 (Google Analytics 4)">
            <p>
              어떤 화면과 기능이 도움이 되는지 알아보고 서비스를 다듬기 위해 Google Analytics 4(측정 ID{" "}
              <span className="font-mono text-[12.5px] text-ink">{GA_MEASUREMENT_ID}</span>)를 사용합니다.
            </p>
            <Bullets>
              <Item>
                자동으로 모이는 것: 방문한 화면, 접속 시각, 브라우저·기기 종류, 대략적인 지역(IP 기반),
                유입 경로, 쿠키(<span className="font-mono text-[12px]">_ga</span> 등)로 구분되는 무작위 식별자
              </Item>
              <Item>
                서비스가 보내는 사건: 온보딩 완료(선택한 MBTI, 태어난 시간 선택 여부, 음력 여부), 운세 주제 탭
                클릭, 퀘스트 완료, 인증샷 첨부, 카드 해금(날짜·연속 일수), 공유·저장 방식
              </Item>
              <Item>
                보내지 않는 것: 생년월일, 태어난 시각, 이름·연락처, 인증샷 이미지, 퀘스트 문장 내용
              </Item>
            </Bullets>
            <p>
              이 통계로 특정 개인을 알아보거나 광고에 활용하지 않습니다. 통계 정보는 Google LLC(미국)의
              서버로 전송·보관되며(국외 이전), 목적은 이용 통계 분석, 보유 기간은 Google 애널리틱스 보존
              설정에 따릅니다(기본 설정 기준 최대 14개월). 자세한 내용은 Google 개인정보처리방침
              (<a href="https://policies.google.com/privacy" className="font-semibold text-leaf underline decoration-leaf/30 underline-offset-2" target="_blank" rel="noreferrer">policies.google.com/privacy</a>)에서
              확인할 수 있습니다.
            </p>
            <p>
              통계 수집을 원하지 않으면 브라우저에서 쿠키를 차단하거나 Google 애널리틱스 차단 부가기능
              (<a href="https://tools.google.com/dlpage/gaoptout" className="font-semibold text-leaf underline decoration-leaf/30 underline-offset-2" target="_blank" rel="noreferrer">tools.google.com/dlpage/gaoptout</a>)을
              설치하면 됩니다. 이 경우에도 운세와 퀘스트는 그대로 쓸 수 있습니다.
            </p>
          </Section>

          <Section n="6" title="서비스 운영에 필요한 최소한의 접속 기록">
            <p>
              서비스는 정적 페이지를 호스팅 사업자(Vercel)를 통해 전달하고, 글꼴을 jsDelivr와 Google Fonts에서
              불러옵니다. 페이지를 내려받는 과정에서 이들 사업자에 접속 IP, 브라우저 정보, 접속 시각이 남을 수
              있으며, 이는 페이지 전달과 보안(비정상 접근 차단) 목적으로만 쓰입니다. 서비스는 이 기록으로
              이용자를 식별하지 않습니다.
            </p>
          </Section>

          <Section n="7" title="제3자 제공·판매">
            <p>
              이용자의 개인정보를 제3자에게 제공하거나 판매하지 않습니다. 법령에 따라 수사기관이 적법한 절차로
              요청하는 경우를 제외하고는 어떤 기관에도 제공하지 않습니다. 다만 3항의 알림 발송, 5항의 이용 통계,
              6항의 호스팅은 각 사업자의 정책에 따라 처리됩니다.
            </p>
          </Section>

          <Section n="8" title="보관 기간과 삭제 방법">
            <Bullets>
              <Item>서비스가 보관하는 계정 정보: 없습니다(계정을 만들지 않습니다).</Item>
              <Item>
                아침 알림 구독 정보: 알림을 켜 둔 동안만 보관하고, 스위치를 끄면 즉시 삭제합니다.
              </Item>
              <Item>기기 안의 기록: 이용자가 지울 때까지 기기에 남고, 서비스는 이를 보관하지 않습니다.</Item>
              <Item>
                지우는 방법: 오른쪽 위 메뉴 또는 ‘마이’ 탭의 ‘기록 초기화’로 기록을 한 번에 지우고, ‘내 정보
                수정’에서 입력값을 바꿀 수 있습니다. 브라우저 설정에서 이 사이트의 데이터를 삭제하거나 앱을
                지워도 함께 사라집니다.
              </Item>
              <Item>이용 통계: Google 애널리틱스 보존 설정에 따라 자동으로 사라집니다.</Item>
            </Bullets>
          </Section>

          <Section n="9" title="이용자의 권리">
            <p>
              이용자는 언제든 자신의 정보를 확인하고 고치거나 지울 수 있습니다. 정보가 기기 안에만 있고 알림
              주소는 스위치를 끄면 바로 지워지므로, 앱 화면에서 처리되며 서비스 운영자에게 따로 요청할 필요가
              없습니다. 처리에 궁금한 점이나 도움이 필요하면 아래 문의처로 알려주세요.
            </p>
          </Section>

          <Section n="10" title="아동의 개인정보">
            <p>
              서비스는 만 14세 미만 아동을 주 대상으로 하지 않으며, 아동의 개인정보를 알면서 수집하지 않습니다.
              보호자가 이와 관련해 문의하면 확인 후 필요한 조치를 하겠습니다.
            </p>
          </Section>

          <Section n="11" title="방침의 변경">
            <p>
              앱 기능이 바뀌어 이 문서를 고칠 때는 변경 내용과 시행일을 이 페이지와 앱 화면에 미리 알립니다.
              이용자 권리에 중대한 변경은 시행 30일 전, 그 밖의 변경은 7일 전에 안내합니다.
            </p>
            <div className="rounded-2xl border border-line bg-cream/70 px-3.5 py-3 text-[12.5px] leading-[1.8] text-ink-soft">
              <p><span className="font-bold text-ink">2026년 11월 28일</span> — ‘아침 7시 알림’ 도입에 따라 알림 발송용 기기 주소의 보관·삭제 조항(3항) 추가</p>
              <p><span className="font-bold text-ink">2026년 11월 25일</span> — 제정 및 시행</p>
            </div>
          </Section>

          <Section n="12" title="문의처">
            <p>
              개인정보 처리에 관한 문의는 아래로 보내주세요. 확인하는 대로 답장드립니다.
            </p>
            <div className="rounded-2xl border border-line bg-cream/70 px-3.5 py-3 text-[13px] leading-[1.9]">
              <p><span className="font-bold text-ink">서비스</span> · Lucky Quest</p>
              <p>
                <span className="font-bold text-ink">이메일</span> ·{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-leaf underline decoration-leaf/30 underline-offset-2">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </Section>
        </div>

        {/* 맺음 */}
        <div className="mt-4 flex items-start gap-2 rounded-[26px] border border-line bg-white/70 px-5 py-4">
          <Sparkle size={13} color="#C9A227" className="mt-1 shrink-0" />
          <p className="text-[12.5px] leading-[1.85] text-ink-soft">
            오늘의 운세는 재미로 보는 이야기이고, 이용자의 기록은 이용자의 것입니다.
            서비스는 그 기록을 들여다보지 않습니다.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between text-[11.5px] text-ink-faint">
          <span>시행일 {EFFECTIVE_DATE}</span>
          <Link href="/" className="font-bold text-leaf underline decoration-leaf/30 underline-offset-2">
            앱으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
