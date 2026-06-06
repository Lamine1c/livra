#!/usr/bin/env node
/**
 * LIVRA — Brand asset generator
 * Reads SVG sources from public/brand/ and writes raster targets to public/.
 * Run: node scripts/generate-brand-assets.js
 * Idempotent — safe to re-run.
 */

const fs   = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT   = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BRAND  = path.join(PUBLIC, "brand");

// ── helpers ─────────────────────────────────────────────────────────────────

function svgBuf(name) {
  return fs.readFileSync(path.join(BRAND, name));
}

async function png(inputBuf, w, h) {
  return sharp(inputBuf)
    .resize(w, h)
    .png()
    .toBuffer();
}

/**
 * Build a .ico from an array of PNG buffers (multi-size).
 * Uses the PNG-inside-ICO container format (IE9+, all modern browsers).
 */
function buildIco(items) {
  const N = items.length;
  const headerSz = 6 + N * 16;

  let dataOffset = headerSz;
  const entries = items.map(({ buf, w, h }) => {
    const e = {
      buf,
      w:   w >= 256 ? 0 : w,
      h:   h >= 256 ? 0 : h,
      sz:  buf.length,
      off: dataOffset,
    };
    dataOffset += buf.length;
    return e;
  });

  const total = headerSz + items.reduce((s, i) => s + i.buf.length, 0);
  const out   = Buffer.alloc(total);
  let p = 0;

  // ICONDIR
  out.writeUInt16LE(0, p); p += 2; // reserved
  out.writeUInt16LE(1, p); p += 2; // type = ICO
  out.writeUInt16LE(N, p); p += 2; // count

  // ICONDIRENTRY × N
  for (const { w, h, sz, off } of entries) {
    out.writeUInt8(w,  p); p++;
    out.writeUInt8(h,  p); p++;
    out.writeUInt8(0,  p); p++; // colorCount
    out.writeUInt8(0,  p); p++; // reserved
    out.writeUInt16LE(1,  p); p += 2; // planes
    out.writeUInt16LE(32, p); p += 2; // bitCount
    out.writeUInt32LE(sz, p); p += 4;
    out.writeUInt32LE(off,p); p += 4;
  }

  // PNG payload
  for (const { buf } of entries) {
    buf.copy(out, p);
    p += buf.length;
  }
  return out;
}

/**
 * Custom OG-image SVG (1200×630).
 * Uses inline shield geometry to avoid font-dependency at rasterization time.
 * "LIVRA" and tagline render with system-ui/Inter (loaded at build time).
 */
function ogSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0E0E10"/>
  <!-- Shield symbol: 100×100 viewBox → scale 1.5 → 150×150 logical, centered x=600 -->
  <!-- Path y-span 20→82 = 62 units → 93 px at scale 1.5. Group top at y=195. -->
  <g transform="translate(525 195) scale(1.5)">
    <path fill-rule="evenodd" fill="#F5F0E8"
      d="M28 20 H72 Q76 20 76 24 V50 Q76 66 50 82 Q24 66 24 50 V24 Q24 20 28 20 Z
         M50 31 L69 49 L61 58 L50 48 L39 58 L31 49 Z"/>
    <circle cx="50" cy="61" r="8.5" fill="#D97757"/>
  </g>
  <!-- "LIVRA" — baseline y=358, font-size 52, letter-spacing 10 -->
  <text x="600" y="358"
    text-anchor="middle"
    font-family="Inter, system-ui, -apple-system, sans-serif"
    font-size="52"
    font-weight="600"
    letter-spacing="10"
    fill="#F5F0E8">LIVRA</text>
  <!-- Tagline — baseline y=398 -->
  <text x="600" y="398"
    text-anchor="middle"
    font-family="Inter, system-ui, -apple-system, sans-serif"
    font-size="22"
    font-weight="400"
    letter-spacing="1"
    fill="#8A8A8E">L'OS de votre e-commerce</text>
</svg>`);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const faviconSvg      = svgBuf("favicon.svg");
  const appIconSvg      = svgBuf("app-icon-source.svg");

  const jobs = [];

  // ── favicon.svg (copy — modern browsers, self-contained rounded tile) ──
  const favSvgOut = path.join(PUBLIC, "favicon.svg");
  fs.copyFileSync(path.join(BRAND, "favicon.svg"), favSvgOut);
  console.log("  ✓ favicon.svg  (copied)");

  // ── favicon PNGs ──
  jobs.push(
    png(faviconSvg, 16, 16).then(buf => {
      fs.writeFileSync(path.join(PUBLIC, "favicon-16x16.png"), buf);
      console.log("  ✓ favicon-16x16.png");
      return { buf, w: 16, h: 16 };
    }),
    png(faviconSvg, 32, 32).then(buf => {
      fs.writeFileSync(path.join(PUBLIC, "favicon-32x32.png"), buf);
      console.log("  ✓ favicon-32x32.png");
      return { buf, w: 32, h: 32 };
    }),
    png(faviconSvg, 48, 48).then(buf => {
      console.log("  ✓ favicon-48x48.png  (ICO frame only, not written separately)");
      return { buf, w: 48, h: 48 };
    }),
  );

  // ── app icon PNGs (from app-icon-source.svg — 1024×1024 with safe area built-in) ──
  jobs.push(
    png(appIconSvg, 180, 180).then(buf => {
      fs.writeFileSync(path.join(PUBLIC, "apple-touch-icon.png"), buf);
      console.log("  ✓ apple-touch-icon.png  (180×180)");
    }),
    png(appIconSvg, 192, 192).then(buf => {
      fs.writeFileSync(path.join(PUBLIC, "android-chrome-192x192.png"), buf);
      console.log("  ✓ android-chrome-192x192.png");
    }),
    png(appIconSvg, 512, 512).then(buf => {
      fs.writeFileSync(path.join(PUBLIC, "android-chrome-512x512.png"), buf);
      console.log("  ✓ android-chrome-512x512.png");
    }),
    png(appIconSvg, 1024, 1024).then(buf => {
      fs.writeFileSync(path.join(PUBLIC, "app-icon-1024.png"), buf);
      console.log("  ✓ app-icon-1024.png  (1024×1024)");
    }),
  );

  // ── OG image ──
  jobs.push(
    sharp(ogSvg())
      .resize(1200, 630)
      .png()
      .toBuffer()
      .then(buf => {
        fs.writeFileSync(path.join(PUBLIC, "og-image-livra.png"), buf);
        console.log("  ✓ og-image-livra.png  (1200×630)");
      }),
  );

  const results = await Promise.all(jobs);

  // ── favicon.ico (multi-size: 16 / 32 / 48) ──
  const pngFrames = results.slice(0, 3); // 16, 32, 48 from first 3 jobs
  const ico = buildIco(pngFrames);
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), ico);
  console.log("  ✓ favicon.ico  (16/32/48 px)");

  console.log("\nDone. All brand assets written to public/");
}

main().catch(err => { console.error(err); process.exit(1); });
