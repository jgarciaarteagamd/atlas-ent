// Renders the email signature image: the JGA isotipo on a dark chamfered tile with transparent
// corners, so it looks deliberate on a white inbox and blends into a dark one.
//   public/firma/jga-firma.png     228 × 228, shown at 76 × 76 by the signature HTML (sharp on phones)
//   public/firma/jga-firma-76.png   76 × 76, for inserting by URL in an editor that keeps the natural size
// 76px is the height of the signature's text block, from the name to the foot of the web address.
//   brand/email/jga-firma.svg       the source drawing
// Usage: node scripts/make-signature.mjs   (needs Playwright with a Chromium build)
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
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
const S = 76; // size in the signature: the height of its text block
const cut = 12; // the button chamfer (cut-button, 10 at 64px) scaled to the tile
const mw = 55; // isotipo width inside the tile
const mh = (mw * markHeight) / markWidth;

// void → void-2 like the site background, a holo-line edge, the isotipo in its dark palette
const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
<defs><radialGradient id="bg" cx="50%" cy="0%" r="120%"><stop offset="0" stop-color="#071019"/><stop offset="0.7" stop-color="#03070c"/></radialGradient></defs>
<polygon points="0.5,0.5 ${S - cut},0.5 ${S - 0.5},${cut} ${S - 0.5},${S - 0.5} ${cut},${S - 0.5} 0.5,${S - cut}" fill="url(#bg)" stroke="rgba(116,241,255,0.28)" stroke-width="1"/>
<svg x="${(S - mw) / 2}" y="${+((S - mh) / 2).toFixed(3)}" width="${mw}" height="${+mh.toFixed(3)}" viewBox="0 0 ${markWidth} ${markHeight}">${markSvg(palettes.dark, 'jga-mail')}</svg>
</svg>
`;

mkdirSync(resolve(root, 'brand/email'), { recursive: true });
mkdirSync(resolve(root, 'public/firma'), { recursive: true });
writeFileSync(resolve(root, 'brand/email/jga-firma.svg'), tile);

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
for (const [scale, file] of [[3, 'jga-firma.png'], [1, 'jga-firma-76.png']]) {
  const page = await browser.newPage({ deviceScaleFactor: scale, viewport: { width: S, height: S } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${tile}</body></html>`);
  const path = resolve(root, 'public/firma', file);
  await page.locator('svg').first().screenshot({ path, omitBackground: true });
  await page.close();
  console.log(path);
}
await browser.close();
