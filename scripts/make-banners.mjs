// Renders the social profile images (LinkedIn, WhatsApp Business, YouTube) into brand/social/.
// Same look as the site: void background, cyan hologram, amber accent, Oxanium + Instrument Sans.
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
    kinds: 'Enfermedades · Pruebas · Cirugías · Cuidados',
    channel: 'Otorrinolaringología explicada para pacientes',
  },
  en: {
    name: 'Dr. Juan García Arteaga',
    role: 'Otolaryngologist',
    areas: 'Ear · Nose · Throat · Head and neck',
    kinds: 'Conditions · Tests · Surgery · Self-care',
    channel: 'Ear, nose and throat explained for patients',
  },
};
const site = 'jgarciaarteaga.pro';

const css = `
@font-face { font-family: Oxanium; font-weight: 600; src: url(${font('oxanium', 'oxanium-latin-600-normal')}); }
@font-face { font-family: Oxanium; font-weight: 500; src: url(${font('oxanium', 'oxanium-latin-500-normal')}); }
@font-face { font-family: 'Instrument Sans'; font-weight: 400; src: url(${font('instrument-sans', 'instrument-sans-latin-400-normal')}); }
@font-face { font-family: 'Instrument Sans'; font-weight: 500; src: url(${font('instrument-sans', 'instrument-sans-latin-500-normal')}); }
:root { --void:#03070c; --holo:#74f1ff; --holo-line:rgba(116,241,255,.16); --flare:#ffc46b; --ink:#e2f5f8; --ink-soft:#94b6be; }
* { box-sizing: border-box; margin: 0; }
html, body { width: var(--w); height: var(--h); overflow: hidden; background: var(--void); }
html:has(body.clear), body.clear { background: transparent; }
.stage { position: relative; width: 100%; height: 100%; overflow: hidden;
  background:
    radial-gradient(ellipse 38% 70% at var(--glow-x) 55%, rgba(116,241,255,.13), transparent 70%),
    linear-gradient(180deg, #071019, var(--void) 70%); }
/* faint projection grid, fading out towards the text side */
.grid { position: absolute; inset: 0;
  background-image: linear-gradient(var(--holo-line) 1px, transparent 1px), linear-gradient(90deg, var(--holo-line) 1px, transparent 1px);
  background-size: var(--cell) var(--cell); opacity: .35;
  -webkit-mask-image: radial-gradient(ellipse 55% 80% at var(--glow-x) 50%, #000, transparent 75%); }
.head { position: absolute; mix-blend-mode: screen;
  -webkit-mask-image: radial-gradient(ellipse 50% 52% at 50% 46%, #000 62%, transparent 100%); }
.text { position: absolute; font-family: 'Instrument Sans', sans-serif; color: var(--ink); }
.mono { display: block; }
.name { font-family: Oxanium, sans-serif; font-weight: 600; color: var(--holo); letter-spacing: .01em; line-height: 1.05;
  text-shadow: 0 0 .5em rgba(116,241,255,.35); white-space: nowrap; }
.role { font-weight: 500; text-transform: uppercase; color: var(--ink-soft); }
.rule { display: block; height: 3px; background: var(--flare); }
.areas { color: var(--ink); }
.areas i { font-style: normal; color: var(--holo); margin: 0 .45em; }
.channel { font-weight: 400; color: var(--ink); }
.site { font-family: Oxanium, sans-serif; font-weight: 500; color: var(--holo); letter-spacing: .04em; }
`;

// The JGA isotipo from the site, `width` wide.
const svgMono = (width) =>
  `<svg class="mono" width="${width}" height="${(width * markHeight) / markWidth}" viewBox="0 0 ${markWidth} ${markHeight}">${markSvg(palettes.dark)}</svg>`;

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
  {
    // YouTube channel banner, 2560×1440. TVs show all of it, desktops a 2560×423 band through
    // the middle and phones only the centre 1546×423, so everything that matters sits in that
    // centre box (x 507–2053, y 508–931): text on its left, head on its right.
    name: 'youtube-banner', langs: ['es'],
    w: 2560, h: 1440,
    vars: '--glow-x:71%; --cell:48px;',
    body: (t) => `
      <img class="head" src="${head}" style="height:700px; left:1500px; top:378px;">
      <div class="text" style="left:600px; top:556px;">
        ${svgMono(112)}
        <p class="name" style="font-size:62px; margin-top:20px;">${t.name}</p>
        <p class="role" style="font-size:21px; letter-spacing:.32em; margin-top:16px;">${t.role}</p>
        <span class="rule" style="width:80px; margin-top:20px;"></span>
        <p class="channel" style="font-size:27px; margin-top:20px;">${t.channel}</p>
        <p class="areas" style="font-size:22px; margin-top:12px; color:var(--ink-soft);">${t.kinds.replaceAll(' · ', '<i>·</i>')}</p>
        <p class="site" style="font-size:21px; margin-top:12px;">${site}</p>
      </div>`,
  },
  {
    // YouTube profile picture, 800×800. YouTube crops it to a circle and shows it as small as
    // 24 px, so it is the isotipo alone, with room around it for the circle.
    name: 'youtube-avatar', langs: [null],
    w: 800, h: 800,
    vars: '--glow-x:50%; --cell:40px;',
    body: () => `
      <div style="position:absolute; inset:0; display:grid; place-items:center;
        background:radial-gradient(circle at 50% 50%, rgba(116,241,255,.14), transparent 62%);">
        ${svgMono(560)}
      </div>`,
  },
  {
    // YouTube video watermark (branding), 150×150 with transparent corners: the favicon's
    // rounded dark tile, which stays legible over light and dark footage.
    name: 'youtube-watermark', langs: [null], clear: true,
    w: 150, h: 150,
    body: () => `
      <div style="position:absolute; inset:0; border-radius:28px; background:var(--void);
        display:grid; place-items:center;">${svgMono(124)}</div>`,
  },
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage();
// Loaded from a file so the page may read the local fonts and image.
const tmp = mkdtempSync(resolve(tmpdir(), 'banners-'));
const html = resolve(tmp, 'banner.html');
for (const b of banners) {
  // `null` marks an image without text, written once with no language suffix.
  for (const lang of b.langs ?? ['es', 'en']) {
    await page.setViewportSize({ width: b.w, height: b.h });
    const stage = b.clear ? b.body() : `<div class="stage"><div class="grid"></div>${b.body(text[lang ?? 'es'])}</div>`;
    writeFileSync(
      html,
      `<!doctype html><html lang="${lang ?? 'es'}"><head><meta charset="utf-8"><style>${css}</style></head>
       <body class="${b.clear ? 'clear' : ''}" style="--w:${b.w}px; --h:${b.h}px; ${b.vars ?? ''}">${stage}</body></html>`,
    );
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const path = resolve(out, lang ? `${b.name}-${lang}.png` : `${b.name}.png`);
    await page.screenshot({ path, omitBackground: !!b.clear });
    console.log(path);
  }
}
await browser.close();
rmSync(tmp, { recursive: true });
