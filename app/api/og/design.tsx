import type { CSSProperties } from "react";
import { ELEMENT_META } from "@/lib/content";
import type { ShareCard } from "@/lib/share";
import { EMBLEM_URI, STAR_URI, cloverUri, sparkleUri } from "./art";

const SERIF = "Noto Serif KR";

const C = {
  cream: "#FFFDF7",
  creamDeep: "#F7E9C9",
  forest: "#12503C",
  leafDeep: "#2F4A3B",
  gold: "#C7A862",
  goldDeep: "#B09355",
  goldPale: "#D4B876",
  ink: "#2E2A22",
  inkSoft: "#6E6757",
  inkFaint: "#A29A86",
  label: "#94804F",
  line: "#E6DCC1",
};

/** 네 갈래 반짝이 — 앱의 Sparkle과 같은 도형 */
function Sparkle({ size = 10, color = "#D3A93E" }: { size?: number; color?: string }) {
  return <img src={sparkleUri(color)} width={size} height={size} alt="" />;
}

function Divider({ width = 46 }: { width?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ width, height: 1, background: C.goldPale, opacity: 0.75 }} />
      <div style={{ display: "flex", margin: "0 10px" }}>
        <Sparkle size={9} color={C.gold} />
      </div>
      <div style={{ width, height: 1, background: C.goldPale, opacity: 0.75 }} />
    </div>
  );
}

const text = (style: CSSProperties): CSSProperties => ({ display: "flex", fontFamily: SERIF, ...style });

/** 기본 대표 이미지 — 1200×630 브랜드 카드 */
export function OgDefault() {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: 1200,
        height: 630,
        overflow: "hidden",
        background: "linear-gradient(158deg, #FFFDF7 0%, #FDF7E7 54%, #F8ECCF 100%)",
        fontFamily: SERIF,
      }}
    >
      {/* 은은한 민트·레몬 빛 번짐 */}
      <div
        style={{
          position: "absolute",
          right: -110,
          top: -170,
          width: 660,
          height: 660,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(178,226,197,0.60) 0%, rgba(178,226,197,0) 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -170,
          bottom: -240,
          width: 640,
          height: 640,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(255,226,122,0.55) 0%, rgba(255,226,122,0) 70%)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", width: "100%", height: "100%", padding: "0 74px" }}>
        {/* 왼쪽 — 문구 */}
        <div style={{ display: "flex", flexDirection: "column", width: 690 }}>
          <div style={text({ fontSize: 19, fontWeight: 600, letterSpacing: 7, color: C.goldDeep })}>
            DAILY FORTUNE
          </div>

          <div style={text({ fontSize: 102, fontWeight: 600, lineHeight: 1.06, letterSpacing: -2, color: C.forest, marginTop: 16 })}>
            Lucky Quest
          </div>

          <div style={text({ fontSize: 40, fontWeight: 600, lineHeight: 1.3, color: C.goldDeep, marginTop: 14 })}>
            오늘의 행운을 한 걸음씩
          </div>

          <div style={{ display: "flex", marginTop: 24, marginBottom: 20 }}>
            <Divider width={52} />
          </div>

          <div style={text({ fontSize: 26, fontWeight: 400, lineHeight: 1.72, color: C.inkSoft, width: 580 })}>
            사주 오행으로 읽는 오늘의 기운,
          </div>
          <div style={text({ fontSize: 26, fontWeight: 400, lineHeight: 1.72, color: C.inkSoft, width: 580 })}>
            MBTI로 고른 작은 퀘스트.
          </div>
          <div style={text({ fontSize: 26, fontWeight: 400, lineHeight: 1.72, color: C.inkSoft, width: 580, marginTop: 4 })}>
            두 걸음이면 오늘의 카드가 열려요.
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 40 }}>
            <img src={cloverUri("emerald")} width={26} height={32} alt="" />
            <div style={text({ fontSize: 22, fontWeight: 600, letterSpacing: 1, color: C.leafDeep, marginLeft: 12 })}>
              luckyquest.app
            </div>
            <div style={{ width: 4, height: 4, borderRadius: 4, background: C.inkFaint, margin: "0 14px" }} />
            <div style={text({ fontSize: 20, fontWeight: 400, color: C.inkFaint })}>로그인 없이 30초</div>
          </div>
        </div>

        {/* 오른쪽 — 별 캐릭터와 클로버 */}
        <div style={{ display: "flex", position: "relative", flex: 1, height: "100%", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              position: "absolute",
              width: 430,
              height: 430,
              borderRadius: 999,
              background: "radial-gradient(circle, rgba(255,244,201,0.95) 0%, rgba(255,244,201,0) 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 384,
              height: 384,
              borderRadius: 999,
              border: "1px solid rgba(199,168,98,0.55)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 348,
              height: 348,
              borderRadius: 999,
              border: "1px solid rgba(199,168,98,0.30)",
            }}
          />
          <img src={STAR_URI} width={292} height={292} alt="" style={{ marginTop: -6 }} />
          <div style={{ position: "absolute", right: 44, bottom: 66, display: "flex" }}>
            <img src={cloverUri("emerald")} width={78} height={96} alt="" />
          </div>
          <div style={{ position: "absolute", left: 34, top: 74, display: "flex" }}>
            <Sparkle size={22} color="#E4BE5A" />
          </div>
          <div style={{ position: "absolute", right: 66, top: 108, display: "flex" }}>
            <Sparkle size={14} color="#D3A93E" />
          </div>
          <div style={{ position: "absolute", left: 86, bottom: 96, display: "flex" }}>
            <Sparkle size={12} color="#CBB478" />
          </div>
        </div>
      </div>
    </div>
  );
}

const META_LABEL: CSSProperties = {
  display: "flex",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 3,
  color: C.label,
};

/** 날짜별 '오늘의 카드' — 1200×630 에디토리얼 카드 */
export function OgCard({ card }: { card: ShareCard }) {
  const elementName = ELEMENT_META[card.element].name;
  const cells = [
    { label: "행운의 색", value: card.colorName },
    { label: "숫자", value: card.number },
    { label: "키워드", value: card.keyword },
  ];

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: 1200,
        height: 630,
        overflow: "hidden",
        padding: 26,
        background: "linear-gradient(160deg, #FFFEFA 0%, #FBF7ED 58%, #F5EDDA 100%)",
        fontFamily: SERIF,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -140,
          top: -190,
          width: 560,
          height: 560,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(255,232,160,0.45) 0%, rgba(255,232,160,0) 70%)",
        }}
      />

      {/* 이중 금빛 테두리 */}
      <div
        style={{
          display: "flex",
          position: "relative",
          alignItems: "center",
          width: "100%",
          height: "100%",
          padding: "0 62px",
          border: `2px solid rgba(199,168,98,0.62)`,
          borderRadius: 26,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 9,
            left: 9,
            width: 1130,
            height: 560,
            border: "1px solid rgba(212,184,118,0.42)",
            borderRadius: 20,
          }}
        />

        {/* 카드 문양 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 300 }}>
          <img src={EMBLEM_URI} width={284} height={284} alt="" />
          <div style={text({ fontSize: 17, fontWeight: 600, letterSpacing: 4, color: C.goldDeep, marginTop: 18 })}>
            TODAY&apos;S CARD
          </div>
          <div style={text({ fontSize: 21, fontWeight: 400, color: C.inkFaint, marginTop: 10 })}>{card.dateLabel}</div>
        </div>

        {/* 카드 내용 */}
        <div style={{ display: "flex", flexDirection: "column", width: 660, marginLeft: 62 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={text({ fontSize: 19, fontWeight: 600, letterSpacing: 6, color: C.goldDeep })}>
              오늘의 카드
            </div>
            <div style={{ width: 5, height: 5, borderRadius: 5, background: C.goldPale, margin: "0 14px" }} />
            <div style={text({ fontSize: 21, fontWeight: 400, color: C.label })}>
              {elementName} 기운 · {card.pillar}
            </div>
          </div>

          <div style={text({ fontSize: 74, fontWeight: 600, lineHeight: 1.16, letterSpacing: -1, color: C.leafDeep, marginTop: 14 })}>
            {card.title}
          </div>

          <div style={{ display: "flex", marginTop: 18 }}>
            <Divider width={40} />
          </div>

          <div style={text({ fontSize: 30, fontWeight: 400, lineHeight: 1.68, color: C.inkSoft, width: 620, marginTop: 16 })}>
            {card.message}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              borderTop: `1px solid ${C.line}`,
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            {cells.map((cell, index) => (
              <div
                key={cell.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 206,
                  padding: "15px 0",
                  borderLeft: index === 0 ? "none" : `1px solid ${C.line}`,
                }}
              >
                <div style={META_LABEL}>{cell.label}</div>
                <div style={text({ fontSize: 27, fontWeight: 600, color: "#3E3A2C", marginTop: 9 })}>{cell.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
            <div style={text({ fontSize: 21, fontWeight: 600, letterSpacing: 1, color: C.leafDeep })}>Lucky Quest</div>
            <div style={{ width: 4, height: 4, borderRadius: 4, background: C.inkFaint, margin: "0 13px" }} />
            <div style={text({ fontSize: 19, fontWeight: 400, color: C.inkFaint })}>luckyquest.app</div>
          </div>
        </div>
      </div>
    </div>
  );
}
