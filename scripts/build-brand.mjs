// Writes the JGA isotipo from src/data/mark.js into the brand files and the
// browser icon. Each logo keeps its layout: the <g id="jga"> line is replaced
// with the mark placed for that layout, and in the horizontal logos the
// wordmark follows the mark's right edge. PNG exports are rendered separately.
//
//   node scripts/build-brand.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { markSvg, markWidth, markHeight, palettes } from '../src/data/mark.js';

const DARK_BG = '#03070c';
const LIGHT_BG = '#ffffff';

/** Horizontal logos: mark height and position, and where the wordmark sits. */
const ROW = { x: 60, y: 115.101, height: 149.935, gap: 53.44, textX: 501.94 };

const round = (n) => +n.toFixed(3);

/** Transform that scales the mark to `height` with its top-left at (x, y). */
const at = (x, y, height) => `translate(${round(x)} ${round(y)}) scale(${+(height / markHeight).toFixed(5)})`;

/** Same, centred on (cx, cy). */
const centred = (cx, cy, height) => at(cx - (markWidth * height) / markHeight / 2, cy - height / 2, height);

const heightFor = (width) => (width * markHeight) / markWidth;

const group = (transform, palette) => `<g id="jga" transform="${transform}">${markSvg(palette)}</g>`;

for (const name of readdirSync('brand').filter((n) => n.endsWith('.svg') && n !== 'favicon.svg')) {
  const path = `brand/${name}`;
  let svg = readFileSync(path, 'utf8');
  const palette = svg.includes(`fill="${LIGHT_BG}"`) ? palettes.light : palettes.dark;
  let transform;
  if (name.startsWith('monogram')) {
    transform = centred(256, 256, heightFor(400));
  } else if (name.startsWith('logo-horizontal')) {
    transform = at(ROW.x, ROW.y, ROW.height);
    // Slide the wordmark to keep its gap to the mark, and fit the canvas to it.
    const right = ROW.x + (markWidth * ROW.height) / markHeight;
    const shift = round(right + ROW.gap - ROW.textX);
    const [, was] = svg.match(/<g transform="translate\((-?[\d.]+) 0\)">/);
    const [, width] = svg.match(/viewBox="0 0 ([\d.]+) /);
    const newWidth = Math.round(+width + shift - +was);
    svg = svg
      .replace(/<g transform="translate\(-?[\d.]+ 0\)">/, `<g transform="translate(${shift} 0)">`)
      .replace(/viewBox="0 0 [\d.]+ /, `viewBox="0 0 ${newWidth} `)
      .replace(/ width="[\d.]+"/, ` width="${newWidth}"`);
  } else {
    // Vertical logos: the mark centred above the name.
    transform = centred(500, 409.7, 220);
  }
  if (!/^<g id="jga".*$/m.test(svg)) throw new Error(`${path}: no <g id="jga"> line to fill`);
  writeFileSync(path, svg.replace(/^<g id="jga".*$/m, group(transform, palette)));
}

// Browser icon: the mark on the site background, rounded square.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="12" fill="${DARK_BG}"/>
${group(centred(32, 32, heightFor(54)), palettes.dark)}
</svg>
`;
writeFileSync('public/favicon.svg', favicon);
writeFileSync('brand/favicon.svg', favicon);
