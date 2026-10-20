// Writes the site's arrow cursors to public/: a rounded triangle folded like
// the logo's ribbon, light face and teal fold (amber over links).
//
//   node scripts/build-cursor.mjs
import { writeFileSync } from 'node:fs';

const out = 'public';
const f = (n) => +n.toFixed(2);
const T = [4, 4], R = [24.4, 12.1], N = [14.2, 14.2], B = [12.1, 24.4];
const unit = (p, q) => { const v = [q[0] - p[0], q[1] - p[1]], l = Math.hypot(...v); return [v[0] / l, v[1] / l]; };
function rounded(pts, rs) {
  const n = pts.length;
  return pts.map((p, i) => {
    const r = rs[i];
    const u1 = unit(p, pts[(i + n - 1) % n]), u2 = unit(p, pts[(i + 1) % n]);
    const t = r / Math.tan(Math.acos(u1[0] * u2[0] + u1[1] * u2[1]) / 2);
    const sweep = u1[0] * u2[1] - u1[1] * u2[0] < 0 ? 1 : 0;
    const a = [p[0] + u1[0] * t, p[1] + u1[1] * t], b = [p[0] + u2[0] * t, p[1] + u2[1] * t];
    return `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}A${r} ${r} 0 0 ${sweep} ${f(b[0])} ${f(b[1])}`;
  }).join('') + 'Z';
}
const arrow = rounded([T, R, N, B], [1.6, 2.4, 1.2, 2.4]);
function svg(fold, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
<defs>
<linearGradient id="${id}l" x1="6" y1="5" x2="21" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d2fcff"/><stop offset="1" stop-color="#46dcf5"/></linearGradient>
<linearGradient id="${id}d" x1="6" y1="8" x2="12" y2="23" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${fold[0]}"/><stop offset="1" stop-color="${fold[1]}"/></linearGradient>
<clipPath id="${id}c"><path d="${arrow}"/></clipPath>
</defs>
<path d="${arrow}" fill="none" stroke="#03070c" stroke-width="3" stroke-linejoin="round" stroke-opacity="0.9"/>
<g clip-path="url(#${id}c)">
<path d="M${T[0] - 4} ${T[1] - 4}L32 ${R[1] - 6}L32 32L${N[0]} ${N[1]}Z" fill="url(#${id}l)"/>
<path d="M${T[0] - 4} ${T[1] - 4}L${N[0]} ${N[1]}L32 32L${B[0] - 6} 32Z" fill="url(#${id}d)"/>
<path d="M${T[0]} ${T[1]}L${N[0]} ${N[1]}" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.8"/>
</g>
</svg>
`;
}
// Default: the fold in the logo's teal. Links: the fold turns amber, the site's hover colour.
writeFileSync(`${out}/cursor.svg`, svg(['#18c0cc', '#0f5f70'], 'a'));
writeFileSync(`${out}/cursor-link.svg`, svg(['#ffd890', '#e0a03a'], 'k'));
