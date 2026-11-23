# 🍀 Lucky Quest

> 오늘의 운세와 작은 퀘스트 — 사주 오행(오늘의 날씨) × MBTI(나다운 행동 방식)

**luckyquest.kr** 1차 모바일 웹 프로토타입입니다.

## 무엇을 하나요

1. **5초 온보딩 (로그인 없음)** — 생년월일(양력/음력·윤달), 태어난 시간(12시진 또는 '모름'), MBTI 16유형(모르면 4문항 간단 검사). 입력값은 `localStorage`에만 저장됩니다.
2. **진짜 사주 계산** — [`manseryeok`](https://www.npmjs.com/package/manseryeok) (한국천문연구원 정본 데이터 기반 만세력)으로 연·월·일·시 기둥과 오행 분포(목·화·토·금·수)를 계산합니다. 태어난 시간을 모르면 **세 기둥**으로 계산합니다.
3. **오늘의 운세** — 오늘 일진의 오행과 내 일간(日干)의 관계로 65~95% 사이의 기운 점수, 오행 밸런스, 3줄 리딩, 그리고 퀘스트를 고른 이유를 보여줍니다.
4. **오늘의 퀘스트 2개** — Quest 1은 부족한 오행을 채우는 1분 행동(오행 5 × 10가지), Quest 2는 MBTI 유형에 맞춘 하루 한 걸음(16유형 × 8가지). 날짜 시드로 매일 다른 조합이 나옵니다.
5. **오늘의 카드** — 두 퀘스트를 모두 체크하면 잠겨 있던 카드가 반짝이며 열립니다. 행운의 색·숫자·키워드와 한 줄 메시지, Web Share(또는 링크 복사) 버튼. 아이보리 종이 톤과 가는 금빛 이중 테두리의 에디토리얼 카드 디자인.
6. **달력 / 보관함 / 마이** — 카드를 받은 날은 달력에 클로버로 남고, 모은 카드를 다시 볼 수 있습니다. 사주 기둥과 오행 분포도 확인할 수 있습니다.

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 4
- `manseryeok` 2.0 — 런타임 의존성 0, 클라이언트에서 계산
- 손으로 그린 SVG 일러스트 (별 캐릭터, 네잎클로버, 오행 아이콘, 카드 문양)
- 서버·DB·로그인 없음: 모든 상태는 브라우저 `localStorage` (`luckyquest.state.v1`)

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
components/
  LuckyQuestApp.tsx 앱 셸(헤더·탭·시트·토스트)과 상태 관리
  Onboarding.tsx    5초 설정(생년월일·시간·MBTI·간단 검사)
  FortuneCard.tsx   기운 게이지·오행 밸런스·리딩
  QuestList.tsx     퀘스트 카드·체크 애니메이션
  CharmCard.tsx     잠금/해제 오늘의 카드·공유
  Views.tsx         달력·보관함·마이
  illustrations.tsx SVG 일러스트
lib/
  saju.ts           manseryeok 래퍼(사주 기둥·오행·일진)
  content.ts        퀘스트·카드 콘텐츠 풀(오행 50 + MBTI 128)
  engine.ts         오늘의 운세 조합 로직
  storage.ts        localStorage 상태
  utils.ts          날짜·해시 유틸
```

## 톤 가이드

- 한국어 경어체, 밝고 산뜻한 말투. '이용자'라는 말을 씁니다.
- 겁주는 말(질병·사고·이별·손실·재난, '반드시'·'절대')은 쓰지 않습니다. 운세 점수는 65% 아래로 내려가지 않습니다.

## 다음 단계 후보

- 퀘스트 완료 기록의 서버 동기화(기기 변경 대응)
- 오늘의 카드 이미지 저장(PNG 내보내기)
- 주간/월간 운세 리포트
- OG 이미지 자동 생성, 실제 도메인 연결
