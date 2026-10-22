// Renders the social profile banners (LinkedIn, WhatsApp Business) into brand/social/.
// Same look as the site, in both modes: dark (void background, cyan hologram, amber accent)
// and light (white background, the hologram as teal ink), with Oxanium + Instrument Sans.
// Usage: node scripts/make-banners.mjs   (needs Playwright with a Chromium build)
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { markSvg, markWidth, markHeight, palettes } from '../src/data/mark.js';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright'));
}

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'brand/social');
mkdirSync(out, { recursive: true });

const file = (p) => pathToFileURL(resolve(root, p)).href;
const font = (pkg, name) => file(`node_modules/@fontsource/${pkg}/files/${name}.woff2`);
const head = file('public/holo/fallback.webp');

const text = {
  es: {
    name: 'Dr. Juan García Arteaga',
    role: 'Otorrinolaringólogo',
    areas: 'Oído · Nariz · Garganta · Cabeza y cuello',
  },
  en: {
    name: 'Dr. Juan García Arteaga',
    role: 'Otolaryngologist',
    areas: 'Ear · Nose · Throat · Head and neck',
  },
};
const site = 'jgarciaarteaga.pro';

const css = `
@font-face { font-family: Oxanium; font-weight: 600; src: url(${font('oxanium', 'oxanium-latin-600-normal')}); }
@font-face { font-family: Oxanium; font-weight: 500; src: url(${font('oxanium', 'oxanium-latin-500-normal')}); }
@font-face { font-family: 'Instrument Sans'; font-weight: 400; src: url(${font('instrument-sans', 'instrument-sans-latin-400-normal')}); }
@font-face { font-family: 'Instrument Sans'; font-weight: 500; src: url(${font('instrument-sans', 'instrument-sans-latin-500-normal')}); }
:root { --void:#03070c; --void-2:#071019; --holo:#74f1ff; --holo-line:rgba(116,241,255,.16); --flare:#ffc46b; --ink:#e2f5f8; --ink-soft:#94b6be;
  --glow:rgba(116,241,255,.13); --name-glow:rgba(116,241,255,.35); }
/* light mode: the site's light tokens (src/styles/global.css) */
.light { --void:#ffffff; --void-2:#e8f3f5; --holo:#0b7285; --holo-line:rgba(11,114,133,.2); --flare:#a85a00; --ink:#14272d; --ink-soft:#4a6670;
  --glow:rgba(11,114,133,.08); --name-glow:transparent; }
* { box-sizing: border-box; margin: 0; }
html, body { width: var(--w); height: var(--h); overflow: hidden; background: var(--void); }
.stage { position: relative; width: 100%; height: 100%; overflow: hidden;
  background:
    radial-gradient(ellipse 38% 70% at var(--glow-x) 55%, var(--glow), transparent 70%),
    linear-gradient(180deg, var(--void-2), var(--void) 70%); }
/* faint projection grid, fading out towards the text side */
.grid { position: absolute; inset: 0;
  background-image: linear-gradient(var(--holo-line) 1px, transparent 1px), linear-gradient(90deg, var(--holo-line) 1px, transparent 1px);
  background-size: var(--cell) var(--cell); opacity: .35;
  -webkit-mask-image: radial-gradient(ellipse 55% 80% at var(--glow-x) 50%, #000, transparent 75%); }
.head { position: absolute; mix-blend-mode: screen;
  -webkit-mask-image: radial-gradient(ellipse 50% 52% at 50% 46%, #000 62%, transparent 100%); }
/* the head picture is light on black: inverted, it reads as ink on paper */
.light .head { mix-blend-mode: multiply; filter: invert(1) hue-rotate(180deg); }
.text { position: absolute; font-family: 'Instrument Sans', sans-serif; color: var(--ink); }
.mono { display: block; }
.name { font-family: Oxanium, sans-serif; font-weight: 600; color: var(--holo); letter-spacing: .01em; line-height: 1.05;
  text-shadow: 0 0 .5em var(--name-glow); white-space: nowrap; }
.role { font-weight: 500; text-transform: uppercase; color: var(--ink-soft); }
.rule { display: block; height: 3px; background: var(--flare); }
.areas { color: var(--ink); }
.areas i { font-style: normal; color: var(--holo); margin: 0 .45em; }
.site { font-family: Oxanium, sans-serif; font-weight: 500; color: var(--holo); letter-spacing: .04em; }
`;

// The JGA isotipo from the site, `width` wide, in the palette of the current mode.
let palette = palettes.dark;
const svgMono = (width) =>
  `<svg class="mono" width="${width}" height="${(width * markHeight) / markWidth}" viewBox="0 0 ${markWidth} ${markHeight}">${markSvg(palette)}</svg>`;

// Each banner places the head image and the text block for its own safe zones.
const banners = [
  {
    // LinkedIn personal cover, 1584×396. The profile photo covers the lower left on desktop
    // and the left-centre on mobile, so the text starts past it and the head sits at the far right.
    name: 'linkedin-banner',
    w: 1584, h: 396,
    vars: '--glow-x:84%; --cell:33px;',
    body: (t) => `
      <img class="head" src="${head}" style="height:500px; right:50px; top:6px;">
      <div class="text" style="left:560px; top:78px;">
        ${svgMono(118)}
        <p class="name" style="font-size:54px; margin-top:20px;">${t.name}</p>
        <p class="role" style="font-size:19px; letter-spacing:.32em; margin-top:16px;">${t.role}</p>
        <span class="rule" style="width:72px; margin-top:20px;"></span>
        <p class="areas" style="font-size:20px; margin-top:20px;">${t.areas.replaceAll(' · ', '<i>·</i>')}</p>
        <p class="site" style="font-size:19px; margin-top:12px;">${site}</p>
      </div>`,
  },
  {
    // WhatsApp Business cover, 16:9 (uploads well at 1920×1080 and scales to 1211×681).
    // The profile photo overlaps the bottom centre, so text stays upper left and the head right.
    name: 'whatsapp-banner',
    w: 1920, h: 1080,
    vars: '--glow-x:76%; --cell:60px;',
    body: (t) => `
      <img class="head" src="${head}" style="height:1180px; right:120px; top:-40px;">
      <div class="text" style="left:150px; top:250px; width:820px;">
        ${svgMono(190)}
        <p class="name" style="font-size:88px; margin-top:40px; white-space:normal;">${t.name}</p>
        <p class="role" style="font-size:30px; letter-spacing:.32em; margin-top:28px;">${t.role}</p>
        <span class="rule" style="width:110px; margin-top:34px;"></span>
        <p class="areas" style="font-size:32px; margin-top:34px;">${t.areas.replaceAll(' · ', '<i>·</i>')}</p>
        <p class="site" style="font-size:32px; margin-top:22px;">${site}</p>
      </div>`,
  },
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage();
// Loaded from a file so the page may read the local fonts and image.
const tmp = mkdtempSync(resolve(tmpdir(), 'banners-'));
const html = resolve(tmp, 'banner.html');
// Dark banners keep their original names; light ones end in -light.
for (const mode of ['dark', 'light']) {
  palette = palettes[mode];
  for (const b of banners) {
    for (const lang of ['es', 'en']) {
      await page.setViewportSize({ width: b.w, height: b.h });
      writeFileSync(
        html,
        `<!doctype html><html lang="${lang}" class="${mode}"><head><meta charset="utf-8"><style>${css}</style></head>
         <body style="--w:${b.w}px; --h:${b.h}px; ${b.vars}"><div class="stage"><div class="grid"></div>${b.body(text[lang])}</div></body></html>`,
      );
      await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const path = resolve(out, `${b.name}-${lang}${mode === 'light' ? '-light' : ''}.png`);
      await page.screenshot({ path });
      console.log(path);
    }
  }
}
await browser.close();
rmSync(tmp, { recursive: true });
