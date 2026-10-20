// Writes the JGA isotipo from src/data/mark.js into the brand files and the
// browser icon. Logos keep their layout: only the <g id="jga"> group, whose
// transform places the mark, is refilled. PNG exports are rendered separately.
//
//   node scripts/build-brand.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { markSvg, markWidth, markHeight, palettes } from '../src/data/mark.js';

const DARK_BG = '#03070c';
const LIGHT_BG = '#ffffff';

/** Transform that fits the mark to `height`, centred on (cx, cy). */
function place(cx, cy, height) {
  const s = height / markHeight;
  const x = cx - (markWidth * s) / 2;
  const y = cy - height / 2;
  return `translate(${+x.toFixed(3)} ${+y.toFixed(3)}) scale(${+s.toFixed(5)})`;
}

const group = (transform, palette, id = 'jga') =>
  `<g id="jga" transform="${transform}">${markSvg(palette, id)}</g>`;

// Logos and monograms in brand/: refill the mark in place.
for (const name of readdirSync('brand').filter((n) => n.endsWith('.svg') && n !== 'favicon.svg')) {
  const path = `brand/${name}`;
  const svg = readFileSync(path, 'utf8');
  const palette = svg.includes(`fill="${LIGHT_BG}"`) ? palettes.light : palettes.dark;
  // The mark has no nested groups, so its group ends at the first </g>.
  const match = /<g id="jga" transform="([^"]*)">[\s\S]*?<\/g>/;
  if (!match.test(svg)) throw new Error(`${path}: no <g id="jga"> to fill`);
  writeFileSync(path, svg.replace(match, (_, transform) => group(transform, palette)));
}

// Browser icon: the mark on the site background, rounded square.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="12" fill="${DARK_BG}"/>
${group(place(32, 32, 25), palettes.dark)}
</svg>
`;
writeFileSync('public/favicon.svg', favicon);
writeFileSync('brand/favicon.svg', favicon);
