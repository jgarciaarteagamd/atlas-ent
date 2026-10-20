// JGA isotipo: each letter is two rounded triangles that overlap (or fold) over
// each other. The part where they overlap gets its own colour. Shared by the
// header and scripts/build-brand.mjs so the logo has one source of geometry.

/** Letter box: taller than wide. */
const W = 60;
const H = 100;
const GAP = 13;
const RADIUS = 7;
const TIP = 2.4;

/**
 * Two triangles per letter, in letter-box units (y down). Sharp tips sit
 * TIP units outside the box so that, once rounded, they end on its edge.
 */
const LETTERS = [
  // J: tall stem along the right side, flat hook running out to the left.
  [
    [[60, -2.4], [60, 100], [20, 100]],
    [[-2.4, 100], [60, 100], [60, 60]],
  ],
  // G: top bar folded down the left side, bottom wedge rising on the right.
  [
    [[0, 0], [60, 0], [0, 102.4]],
    [[-2.4, 100], [60, 100], [60, 46]],
  ],
  // A: two legs that cross at the top, folded over each other.
  [
    [[0, 102.4], [30, -2.4], [50, 30]],
    [[60, 102.4], [30, -2.4], [10, 30]],
  ],
];

export const palettes = {
  dark: { a: '#74f1ff', b: '#1fa9c0', fold: '#c8f9ff' },
  light: { a: '#1593a6', b: '#0f5f70', fold: '#0f2a3a' },
};

const f = (n) => +n.toFixed(2);

/** Closed path for a triangle with every corner rounded by an arc. */
function rounded(points, r) {
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const prev = points[(i + n - 1) % n];
    const next = points[(i + 1) % n];
    const v1 = [prev[0] - p[0], prev[1] - p[1]];
    const v2 = [next[0] - p[0], next[1] - p[1]];
    const l1 = Math.hypot(...v1);
    const l2 = Math.hypot(...v2);
    const angle = Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2));
    // A full radius would blunt sharp corners and pull their tips well inside
    // the letter box, so shrink it until the tip loses at most TIP units.
    const half = angle / 2;
    const rr = Math.min(r, TIP / (1 / Math.sin(half) - 1));
    const t = rr / Math.tan(half);
    const a = [p[0] + (v1[0] / l1) * t, p[1] + (v1[1] / l1) * t];
    const b = [p[0] + (v2[0] / l2) * t, p[1] + (v2[1] / l2) * t];
    const sweep = v1[0] * v2[1] - v1[1] * v2[0] < 0 ? 1 : 0;
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}A${f(rr)} ${f(rr)} 0 0 ${sweep} ${f(b[0])} ${f(b[1])}`;
  }
  return d + 'Z';
}

export const markWidth = W * 3 + GAP * 2;
export const markHeight = H;

/**
 * SVG markup for the mark in a 0 0 markWidth markHeight box.
 * `id` keeps clip-path ids unique when several marks share a document.
 */
export function markSvg(palette = palettes.dark, id = 'jga') {
  let defs = '';
  let body = '';
  LETTERS.forEach((tris, i) => {
    const dx = i * (W + GAP);
    const [p1, p2] = tris.map((tri) => rounded(tri.map(([x, y]) => [x + dx, y]), RADIUS));
    defs += `<clipPath id="${id}-${i}"><path d="${p1}"/></clipPath>`;
    body +=
      `<path fill="${palette.a}" d="${p1}"/>` +
      `<path fill="${palette.b}" d="${p2}"/>` +
      `<path fill="${palette.fold}" clip-path="url(#${id}-${i})" d="${p2}"/>`;
  });
  return `<defs>${defs}</defs>${body}`;
}
