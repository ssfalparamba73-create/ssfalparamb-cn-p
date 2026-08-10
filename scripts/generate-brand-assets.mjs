import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import opentype from "opentype.js";
import sharp from "sharp";

const root = process.cwd();
const sourceLogo = path.join(root, "public", "logo", "logo-transparent.svg");
const pwaIconsDirectory = path.join(root, "public", "icons");
const socialDirectory = path.join(root, "public", "social");
const appDirectory = path.join(root, "src", "app");

await mkdir(pwaIconsDirectory, { recursive: true });
await mkdir(socialDirectory, { recursive: true });

const renderedLogo = await sharp(sourceLogo)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let index = 0; index < renderedLogo.data.length; index += 4) {
  const red = renderedLogo.data[index];
  const green = renderedLogo.data[index + 1];
  const blue = renderedLogo.data[index + 2];
  if (red < 32 && green < 32 && blue < 32) {
    renderedLogo.data[index + 3] = 0;
  }
}

const trimmedLogo = await sharp(renderedLogo.data, {
  raw: renderedLogo.info,
})
  .trim({ threshold: 12 })
  .png()
  .toBuffer();

function iconBackground(size) {
  const radius = Math.round(size * 0.22);
  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1D4ED8"/>
          <stop offset="1" stop-color="#2563EB"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${radius}" fill="url(#brand)"/>
      <circle cx="${Math.round(size * 0.86)}" cy="${Math.round(size * 0.14)}" r="${Math.round(size * 0.28)}" fill="#22C55E" opacity="0.22"/>
      <circle cx="${Math.round(size * 0.12)}" cy="${Math.round(size * 0.9)}" r="${Math.round(size * 0.3)}" fill="#0F172A" opacity="0.12"/>
      <rect x="${Math.round(size * 0.16)}" y="${Math.round(size * 0.12)}" width="${Math.round(size * 0.68)}" height="${Math.round(size * 0.76)}" rx="${Math.round(size * 0.18)}" fill="#FFFFFF"/>
    </svg>
  `);
}

async function createIcon(size, logoScale = 0.54) {
  const logo = await sharp(trimmedLogo)
    .resize({
      width: Math.round(size * logoScale),
      height: Math.round(size * logoScale),
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  return sharp(iconBackground(size))
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, png]);
}

const icon192 = await createIcon(192);
const icon512 = await createIcon(512);
const maskable512 = await createIcon(512, 0.46);
const appleIcon = await createIcon(180);
const faviconPng = await createIcon(64, 0.58);

await Promise.all([
  writeFile(path.join(pwaIconsDirectory, "pwa-192.png"), icon192),
  writeFile(path.join(pwaIconsDirectory, "pwa-512.png"), icon512),
  writeFile(path.join(pwaIconsDirectory, "pwa-maskable-512.png"), maskable512),
  writeFile(path.join(appDirectory, "icon.png"), icon512),
  writeFile(path.join(appDirectory, "apple-icon.png"), appleIcon),
  writeFile(path.join(appDirectory, "favicon.ico"), pngToIco(faviconPng, 64)),
]);

const logoForShare = await sharp(trimmedLogo)
  .resize({
    width: 235,
    height: 310,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();
const logoData = logoForShare.toString("base64");
const cooperFontBuffer = readFileSync(path.join(root, "public", "font", "COOPBL.ttf"));
const cooperFont = opentype.parse(
  cooperFontBuffer.buffer.slice(
    cooperFontBuffer.byteOffset,
    cooperFontBuffer.byteOffset + cooperFontBuffer.byteLength
  )
);
const ssfWordmarkPath = cooperFont.getPath("SSF", 510, 238, 112).toPathData(2);

const shareCard = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shareBrand" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0F172A"/>
        <stop offset="0.55" stop-color="#1E3A8A"/>
        <stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#020617" flood-opacity="0.25"/>
      </filter>
      <style>.ui { font-family: Arial, Helvetica, sans-serif; }</style>
    </defs>
    <rect width="1200" height="630" fill="url(#shareBrand)"/>
    <circle cx="1120" cy="50" r="260" fill="#22C55E" opacity="0.12"/>
    <circle cx="80" cy="620" r="220" fill="#3B82F6" opacity="0.16"/>
    <path d="M760 0L1200 0L1200 330Z" fill="#FFFFFF" opacity="0.035"/>

    <rect x="82" y="87" width="356" height="456" rx="54" fill="#FFFFFF" filter="url(#shadow)"/>
    <image href="data:image/png;base64,${logoData}" x="142" y="160" width="235" height="310" preserveAspectRatio="xMidYMid meet"/>

    <path d="${ssfWordmarkPath}" fill="#FFFFFF"/>
    <text x="510" y="309" class="ui" font-size="56" font-weight="700" fill="#FFFFFF">Alparamba Unit</text>
    <rect x="510" y="348" width="104" height="8" rx="4" fill="#22C55E"/>
    <text x="510" y="411" class="ui" font-size="29" font-weight="500" fill="#DBEAFE">Digital Varisankhya Collection Portal</text>
    <text x="510" y="468" class="ui" font-size="23" fill="#BFDBFE">Secure  •  Transparent  •  Community-focused</text>
  </svg>
`);

await sharp(shareCard)
  .png({ compressionLevel: 9 })
  .toFile(path.join(socialDirectory, "ssf-alparamba-share.png"));

console.log("Brand icons and social sharing image generated.");
