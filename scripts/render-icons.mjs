import sharp from "sharp";
import fs from "node:fs";

const svg = fs.readFileSync("public/icon.svg", "utf8");
const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)[0];
const body = svg
  .slice(svg.indexOf("</defs>") + "</defs>".length, svg.lastIndexOf("</svg>"))
  .replace(/<rect width="512" height="512" fill="#FFFFFF"\/>/, "")
  .trim();

async function render(source, size, out) {
  await sharp(Buffer.from(source), { density: 384 })
    .resize(size, size, { fit: "contain", background: "#FFFFFF" })
    .png({ compressionLevel: 9 })
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log(out, `${meta.width}x${meta.height}`);
}

await render(svg, 192, "public/icons/icon-192.png");
await render(svg, 512, "public/icons/icon-512.png");
await render(svg, 180, "public/icons/apple-touch-icon.png");

// maskable — 중앙 80% 안전 영역 안에 그림이 들어오도록 0.88배로 줄인다.
// (별 꼭짓점 216×0.88=190 < 안전 반지름 204.8)
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${defs}
  <rect width="512" height="512" fill="#FFFFFF"/>
  <g transform="translate(256 256) scale(0.88) translate(-256 -256)">
    ${body}
  </g>
</svg>`;
await render(maskable, 512, "public/icons/icon-maskable-512.png");
console.log("maskable source kept defs:", maskable.includes("<defs>"), "| fill refs:", (maskable.match(/url\(#/g) || []).length);
