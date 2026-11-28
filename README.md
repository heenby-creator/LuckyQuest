# 🍀 Lucky Quest

> 오늘의 운세와 작은 퀘스트 — 사주 오행(오늘의 날씨) × MBTI(나다운 행동 방식)

**luckyquest.app** 1차 모바일 웹 프로토타입입니다.

## 무엇을 하나요

1. **5초 온보딩 (로그인 없음)** — 생년월일(양력/음력·윤달), 태어난 시간(12시진 또는 '모름'), MBTI 16유형(모르면 4문항 간단 검사). 입력값은 `localStorage`에만 저장됩니다.
2. **진짜 사주 계산** — [`manseryeok`](https://www.npmjs.com/package/manseryeok) (한국천문연구원 정본 데이터 기반 만세력)으로 연·월·일·시 기둥과 오행 분포(목·화·토·금·수)를 계산합니다. 태어난 시간을 모르면 **세 기둥**으로 계산합니다.
3. **오늘의 운세** — 오늘 일진의 겉·속 오행과 내가 타고난 기운의 관계로 55~97% 사이의 기운 점수, 오행 밸런스(木·火·土·金·水), 3줄 리딩(46세 이후는 5줄+성향 1줄), 그리고 퀘스트를 고른 이유를 보여줍니다. 재물·연애·대인·일·학업 네 탭에는 각 분야의 지수(%)와 상태 배지, '오늘의 흐름 1줄 + 바로 챙길 조언 1줄'이 들어갑니다.
4. **오늘의 퀘스트 2개** — Quest 1은 부족한 오행을 채우는 1분 행동입니다. 오행이 하나 비면 그 기운을(오행 5 × 10가지), 두 기운이 함께 비거나 가장 적으면 두 기운을 함께 채우는 복합 퀘스트를 고릅니다(복합 10쌍 × 4가지). Quest 2는 MBTI 유형에 맞춘 하루 한 걸음(16유형 × 8가지)입니다. 날짜 시드로 매일 다른 조합이 나오고, 두 퀘스트의 행동은 겹치지 않습니다.
5. **오늘의 행운 카드** — 두 퀘스트를 모두 체크하면 잠겨 있던 카드가 반짝이며 열립니다. 오행마다 4장씩 모두 20장의 카드 풀에서 날짜 시드로 한 장이 정해지고, 키워드(예: 흐름과 지혜)와 그 기운에 맞닿은 명언·저자, 행운의 색·숫자·아이템이 담깁니다. Web Share(또는 링크 복사) 버튼과 아이보리 종이 톤·금빛 이중 테두리의 에디토리얼 카드 디자인.
6. **선택형 인증샷** — 완료한 퀘스트에 `📷 인증샷 남기기(선택)` 버튼이 붙습니다. 올린 사진은 브라우저 Canvas로 최대 800px·JPEG 0.82로 다시 그려(EXIF·촬영 위치 제거) **서버 전송 없이 IndexedDB에만** 저장됩니다. 퀘스트 카드에서 썸네일 확인·교체·삭제가 되고, 달력 탭에서 지난 날짜를 누르면 그날의 인증샷을 함께 봅니다. 공유는 기본이 카드 링크이고, 인증샷을 남긴 날에만 `인증샷 포함 카드 저장(PNG)` 버튼이 따로 열립니다(클라이언트 Canvas 합성).
7. **달력 / 보관함 / 마이** — 카드를 받은 날은 달력에 클로버로, 인증샷을 남긴 날은 카메라로 남고, 모은 카드를 다시 볼 수 있습니다. 사주 기둥과 오행 분포도 확인할 수 있습니다.

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 4
- `manseryeok` 2.0 — 런타임 의존성 0, 클라이언트에서 계산
- 손으로 그린 SVG 일러스트 (별 캐릭터, 네잎클로버, 오행 아이콘, 카드 문양)
- 서버·DB·로그인 없음: 모든 상태는 브라우저 `localStorage` (`luckyquest.state.v1`). 단, 선택 기능인 ‘아침 7시 알림’을 켠 경우에만 푸시 구독 목록(익명 endpoint)을 Upstash Redis에 보관한다.

## 개발

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

> Node.js **22 이상**이 필요합니다 (Tailwind CSS 4의 빌드 요구사항).

## 구조

```
app/
  layout.tsx        메타데이터·PWA 매니페스트·폰트
  page.tsx          앱 진입점
  manifest.ts       PWA manifest (/manifest.webmanifest)
  globals.css       디자인 토큰·애니메이션
  card/[date]/      공유 링크 착지 페이지 — 그날의 카드 + 동적 OG 메타(SSR)
  api/og/route.tsx  OG 이미지 엔드포인트(/api/og, /api/og?card=YYYY-MM-DD)
  api/push/subscribe/route.ts  아침 알림 구독 등록·해제·상태
  api/cron/morning-push/route.ts  매일 07:00 KST 알림 발송(Vercel Cron)
components/
  LuckyQuestApp.tsx 앱 셸(헤더·탭·시트·토스트)과 상태 관리
  Onboarding.tsx    5초 설정(생년월일·시간·MBTI·간단 검사)
  FortuneCard.tsx   기운 게이지·오행 밸런스·리딩
  QuestList.tsx     퀘스트 카드·체크 애니메이션
  CharmCard.tsx     잠금/해제 오늘의 행운 카드·공유·인증샷 카드 저장
  Views.tsx         달력·보관함·마이
  MorningPushCard.tsx  마이 탭의 ‘아침 7시 운세 알림’ 스위치
  useMorningPush.ts 알림 켜기·끄기(권한·서비스워커·구독)
  illustrations.tsx SVG 일러스트
lib/
  saju.ts           manseryeok 래퍼(사주 기둥·오행·일진)
  content.ts        퀘스트·카드 콘텐츠 풀(오행 50 + 복합 40 + MBTI 128 + 행운 카드 20)
  engine.ts         오늘의 운세·퀘스트 매칭 로직(복합 오행 결핍 판정 포함)
  share.ts          공유 링크·OG 메타용 카드 복원(날짜 → 오늘의 행운 카드)
  photos.ts         인증샷 리사이즈·IndexedDB 저장(서버 전송 없음)
  cardImage.ts      인증샷 포함 카드 PNG 합성(클라이언트 Canvas)
  storage.ts        localStorage 상태
  pushStore.ts      푸시 구독 저장소(Upstash REST, SDK 없이 fetch)
  utils.ts          날짜·해시 유틸
public/
  og-default.png    대표 OG 이미지(1200×630)
  sw.js             서비스 워커(푸시 수신·알림 클릭만, 캐시 없음)
  fonts/            OG 이미지용 Noto Serif KR 서브셋(scripts/og-fonts.sh로 생성)
```

## 공유 미리보기 (OG 이미지 · 동적 공유)

카톡·페이스북·X에 링크를 붙였을 때 그림과 문구가 뜨도록 두 갈래로 만들었습니다.

| 주소 | 무엇 |
| --- | --- |
| `https://www.luckyquest.app/` | 대표 이미지 `public/og-default.png`(1200×630) |
| `https://www.luckyquest.app/card/2026-11-24` | 그날 '오늘의 행운 카드'의 키워드·명언·문양이 담긴 동적 OG 메타 |
| `https://www.luckyquest.app/api/og?card=2026-11-24` | 위 페이지의 OG 이미지(1200×630 PNG, `next/og`) |

- **기준 주소는 `www.luckyquest.app`** — apex(`luckyquest.app`)는 Vercel이 www로 308 리다이렉트하므로, 크롤러가 곧장 200을 받도록 `metadataBase`와 공유 URL을 www로 맞췄습니다.
- 카드는 (날짜 · 그날의 일진 오행)으로만 정해지므로, 공유 링크에 생년월일·MBTI 같은 개인 정보가 들어가지 않습니다. `lib/share.ts`의 `cardForDate()`가 앱과 똑같은 카드를 복원합니다.
- 오늘의 행운 카드 '공유하기'는 `https://www.luckyquest.app/card/<날짜>`를 넘깁니다(Web Share → 없으면 링크 복사).
- 공유 페이지는 자바스크립트 없이 서버에서 그려지고(`app/card/[date]/page.tsx`), 아래에 '나도 오늘의 행운 카드 열기' 버튼으로 앱(`/`)에 바로 들어갑니다.
- 미래 날짜·잘못된 날짜(`/card/2027-01-01`, `/card/abc`)는 404입니다.

### OG 폰트

`next/og`(satori)는 웹폰트를 스스로 불러오지 못합니다. 그래서 Noto Serif KR에서 **이 프로젝트에 실제로 쓰이는 글자만** 뽑아 `public/fonts/og-serif-{400,600}.ttf`(각 336KB)로 두었습니다. 카드 문구나 OG 문구를 고쳐 글자가 늘면 다시 만들어 커밋합니다.

```bash
bash scripts/og-fonts.sh   # python3 + fontTools 필요
```

### 대표 이미지 다시 만들기

`public/og-default.png`는 `/api/og`(파라미터 없음) 응답을 그대로 저장한 것입니다. 디자인을 고치면:

```bash
npm run build && npm start
curl -sS -o public/og-default.png "http://localhost:3000/api/og"
```

### 카톡·페이스북 기존 캐시 지우기

이미 한 번 공유한 링크는 각 서비스가 예전 미리보기를 들고 있습니다. 배포 후 아래에서 주소를 넣고 캐시를 비웁니다.

- 카카오: <https://developers.kakao.com/tool/debugger/sharing> — 주소 입력 → 캐시 초기화
- 페이스북: <https://developers.facebook.com/tools/debug/> — 주소 입력 → `Scrape Again`
- X: 새 글에 주소를 붙여 미리보기를 확인합니다(예전 카드 밸리데이터는 종료).

OG 이미지 주소에는 `v=2`(`lib/share.ts`의 `OG_CARD_VERSION`)이 붙어 있습니다. 카드 이미지 디자인을 바꾸면
이 숫자를 올려 크롤러·CDN이 새 이미지를 받게 합니다.

## 아침 7시 알림 (웹 푸시)

| 조각 | 하는 일 |
| --- | --- |
| `components/MorningPushCard.tsx` + `useMorningPush.ts` | ‘마이’ 탭 스위치. 켜면 알림 권한 → `public/sw.js` 등록 → `pushManager.subscribe` → 서버 등록, 끄면 서버에서 지우고 `unsubscribe` |
| `public/sw.js` | `push` 수신 → 알림 표시, `notificationclick` → 열린 창 포커스(없으면 열기). 오프라인 캐시는 하지 않는다 |
| `app/api/push/subscribe` | `GET` 설정 상태·공개키 / `POST` 구독 저장 / `DELETE` 구독 삭제 |
| `app/api/cron/morning-push` | Vercel Cron이 하루 한 번 호출. `Authorization: Bearer $CRON_SECRET` 확인 후 전체 구독에 발송, 404·410 만료 구독은 삭제 |
| `lib/pushStore.ts` | Upstash Redis REST(HSET/HDEL/HGETALL)를 `fetch`로 직접 호출 |
| `vercel.json` | `{"path":"/api/cron/morning-push","schedule":"0 22 * * *"}` (UTC 22:00 = KST 07:00) |

### 필요한 환경변수 (Vercel → Settings → Environment Variables)

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<공개키>
VAPID_PRIVATE_KEY=<비밀키>
VAPID_SUBJECT=mailto:heenby@gmail.com
CRON_SECRET=<임의의 긴 문자열>
KV_REST_API_URL=<Upstash REST URL>
KV_REST_API_TOKEN=<Upstash REST 토큰>
```

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`는 빌드 때 클라이언트에 들어가므로 **값을 바꾸면 재배포**해야 합니다.
- Upstash는 Vercel 마켓플레이스에서 Redis를 붙이면 `KV_REST_API_*`가 자동으로 들어옵니다. 직접 만들었다면 `UPSTASH_REDIS_REST_URL`·`UPSTASH_REDIS_REST_TOKEN`도 같은 값으로 인식합니다(`lib/pushStore.ts`).
- 환경변수가 하나라도 비어 있으면 빌드는 그대로 되고, 화면에는 ‘알림 발송 서버를 준비하고 있어요’만 뜨며 발송 API는 503을 돌려줍니다.

### 발송 확인

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://www.luckyquest.app/api/cron/morning-push
# → {"ok":true,"total":..,"sent":..,"removed":..,"failed":..}
```

개발 중에는 `npx web-push generate-vapid-keys --json`으로 키를 새로 만들어 `.env.local`에 넣고 씁니다(키를 저장소에 올리지 않습니다).

## 검증

```bash
npm run verify
```

- 퀘스트 218개 전수 문구 검사: 제목이 `~하기`로 끝나는 완결된 행동인지, 제목·설명·이유 문장이 서로 맞물리는지, 이유 문장이 퀘스트마다 고유한지, 오행·MBTI 근거가 들어 있는지.
- 실제 만세력으로 나올 수 있는 오행 분포 **485가지 × 16유형 × 6날짜 = 46,560건**의 매칭 검사: 0인 오행이 둘 이상이면 반드시 두 오행을 함께 채우는 퀘스트가 나오는지, Quest 1·2의 행동이 겹치지 않는지.

## 톤 가이드

- 한국어 경어체, 밝고 산뜻한 말투. '이용자'라는 말을 씁니다.
- 겁주는 말(질병·사고·이별·손실·재난, '반드시'·'절대')은 쓰지 않습니다. 운세 점수는 55% 아래로 내려가지 않습니다.
- 퀘스트 제목은 '~하기'로 끝나는 완결된 동작으로 씁니다. 명사만 남은 제목('노래 한 곡과 창밖' 같은)은 쓰지 않습니다.
- 퀘스트는 **하루 중 어느 시간·장소에서도** 해볼 수 있는 생활 밀착 실행과제로 씁니다. 집·특정 시간대에만 가능한 행동(발 담그기, 세수하기, 유리컵 닦기 같은)이나 단순 동작만 있는 퀘스트는 피하고, '따뜻한 차 한 잔 마시기'처럼 사무실·외출 중에도 바로 체크할 수 있는 행동으로 씁니다.
- 운세 문장은 명리 용어를 그대로 쓰지 않습니다. '일간' 대신 '타고난 기운', '바탕 기운' 대신 '속 기운', '같음·보탬·버팀·누름' 같은 관계 이름 대신 '내 기운과 비슷해 고집이 세지기 쉬운 쪽'처럼 생활에서 바로 그려지는 말로 풉니다. 오행 한자 병기(`수(水)`)는 유지합니다.
- '왜 이 퀘스트인가요?'에는 퀘스트마다 그 행동에 맞춘 고유한 이유 한 문장을 둡니다. 여러 퀘스트가 같은 이유 문장을 돌려 쓰지 않습니다.

## 다음 단계 후보

- 퀘스트 완료 기록의 서버 동기화(기기 변경 대응)
- 인증샷의 기기 간 동기화(로그인 도입 시 — 서버 저장·접근 권한 분리·개인정보 처리방침 정비 후)
- 주간/월간 운세 리포트
- 공유 링크 통계(어떤 카드가 많이 퍼지는지)
