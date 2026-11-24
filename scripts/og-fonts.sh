#!/usr/bin/env bash
# OG 이미지용 한글 폰트 서브셋을 다시 만든다.
#
#   bash scripts/og-fonts.sh
#
# 카드 문구(lib/content.ts)나 OG 이미지의 고정 문구를 고친 뒤 실행하고,
# 바뀐 public/fonts/og-serif-*.ttf 를 함께 커밋한다.
# 필요한 것: python3, fontTools(pip install fonttools), curl
set -euo pipefail

cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Noto Serif KR 400/600 내려받기"
curl -fsSL -o "$TMP/400.ttf" \
  "https://fonts.gstatic.com/s/notoserifkr/v32/3JnoSDn90Gmq2mr3blnHaTZXbOtLJDvui3JOncjmeM52.ttf"
curl -fsSL -o "$TMP/600.ttf" \
  "https://fonts.gstatic.com/s/notoserifkr/v32/3JnoSDn90Gmq2mr3blnHaTZXbOtLJDvui3JOncg4f852.ttf"

echo "→ 프로젝트에 나오는 글자 모으기"
python3 - "$TMP/charset.txt" <<'PY'
import sys

import glob

files = (
    sorted(glob.glob("lib/*.ts"))
    + sorted(glob.glob("components/*.tsx"))
    + [
        "app/layout.tsx", "app/page.tsx", "app/manifest.ts",
        "app/api/og/art.ts", "app/api/og/design.tsx", "app/api/og/route.tsx",
        "app/card/[date]/page.tsx",
    ]
)
chars = set()
for path in files:
    chars.update(open(path, encoding="utf-8").read())

# 일진 간지 22자와 OG 고정 문구·기호
chars.update("갑을병정무기경신임계자축인묘진사오미유술해")
chars.update("Lucky Quest TODAY'S CARD DAILY FORTUNE 0123456789.,:·—–‘’“”…%()/@#+-&'\"!?[]{}<>|~*^_= ")
chars = {c for c in chars if 32 <= ord(c) <= 0xFFFF}

with open(sys.argv[1], "w", encoding="utf-8") as f:
    f.write(",".join(f"U+{ord(c):04X}" for c in sorted(chars)))
print(f"  {len(chars)}자")
PY

mkdir -p public/fonts
for w in 400 600; do
  echo "→ 서브셋 $w"
  python3 -m fontTools.subset "$TMP/$w.ttf" \
    --unicodes="$(cat "$TMP/charset.txt")" \
    --layout-features='*' --no-hinting --desubroutinize \
    --output-file="public/fonts/og-serif-$w.ttf"
  python3 -c "import os,sys; p=sys.argv[1]; print('  %dKB  %s' % (os.path.getsize(p)//1024, p))" "public/fonts/og-serif-$w.ttf"
done

echo "완료 — public/fonts/og-serif-400.ttf, og-serif-600.ttf"
