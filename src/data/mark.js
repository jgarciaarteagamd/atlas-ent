// JGA isotipo: each letter is two rounded triangles that overlap (or fold) over
// each other. The part where they overlap gets its own colour. Shared by the
// header and scripts/build-brand.mjs so the logo has one source of geometry.

/** Letter box: taller than wide. */
const W = 60;
const H = 100;
const GAP = 7;
/** Corner radius of a right angle; sharper corners get proportionally less. */
const RADIUS = 11;

/** The G's two tips meet at its bottom-left corner, rounded on one circle. */
const G_CORNER = 5;

/**
 * Two triangles per letter, in letter-box units (y down); a vertex may carry a
 * third number, its own corner radius. Rounding pulls the tips inwards, so
 * each letter is then stretched back to fill its box.
 * The J and the G are built from the same pair, a tall triangle (40 x 100)
 * and a flat one (60 x 40); only the tall one points the other way.
 */
const LETTERS = [
  // J: tall stem along the right side, flat hook running out to the left.
  [
    [[60, 0], [60, 100], [20, 100]],
    [[0, 100], [60, 100], [60, 60]],
  ],
  // G: top bar folded down the left side, bottom wedge rising on the right.
  // Both tips are rounded on the same circle in the corner, so they overlap
  // completely: each long side is the tangent from its far corner to it.
  (() => {
    const c = [G_CORNER, H - G_CORNER];
    // Of the two tangents, take the one with the circle between it and the edge.
    const top = tangent([40, 0], c, G_CORNER, 'left').sort((a, b) => b[1] - a[1])[0];
    const base = tangent([60, 56], c, G_CORNER, 'bottom').sort((a, b) => a[0] - b[0])[0];
    return [
      [[0, 0], [40, 0], [...top, G_CORNER]],
      [[...base, G_CORNER], [60, 100], [60, 56]],
    ];
  })(),
  // A: two legs folded over each other at the top. Both run along the same two
  // outer edges from the apex, so their tips overlap completely; each one's
  // shoulder hides under the other leg.
  [
    [[30, 0], [0, 100], [42, 40]],
    [[30, 0], [60, 100], [18, 40]],
  ],
];

/**
 * Where the two lines from `p` tangent to the circle (c, r) cross the left
 * (x = 0) or bottom (y = H) edge of the letter box.
 */
function tangent(p, c, r, edge) {
  const d = Math.hypot(c[0] - p[0], c[1] - p[1]);
  const base = Math.atan2(c[1] - p[1], c[0] - p[0]);
  return [1, -1].map((side) => {
    const a = base + side * Math.asin(r / d);
    const dir = [Math.cos(a), Math.sin(a)];
    const t = edge === 'left' ? -p[0] / dir[0] : (H - p[1]) / dir[1];
    return [p[0] + dir[0] * t, p[1] + dir[1] * t];
  });
}

export const palettes = {
  dark: { a: '#74f1ff', b: '#1fa9c0', fold: '#c8f9ff' },
  light: { a: '#1593a6', b: '#0f5f70', fold: '#0f2a3a' },
};

const f = (n) => +n.toFixed(2);

/** Rounded corners of a triangle: where each arc starts and ends, and its circle. */
function corners(points) {
  return points.map((p, i) => {
    const prev = points[(i + 2) % 3];
    const next = points[(i + 1) % 3];
    const u1 = unit([prev[0] - p[0], prev[1] - p[1]]);
    const u2 = unit([next[0] - p[0], next[1] - p[1]]);
    const angle = Math.acos(u1[0] * u2[0] + u1[1] * u2[1]);
    const half = angle / 2;
    const r = p[2] ?? RADIUS * Math.min(1, angle / (Math.PI / 2));
    const t = r / Math.tan(half);
    const bis = unit([u1[0] + u2[0], u1[1] + u2[1]]);
    return {
      a: [p[0] + u1[0] * t, p[1] + u1[1] * t],
      b: [p[0] + u2[0] * t, p[1] + u2[1] * t],
      c: [p[0] + (bis[0] * r) / Math.sin(half), p[1] + (bis[1] * r) / Math.sin(half)],
      r,
      sweep: u1[0] * u2[1] - u1[1] * u2[0] < 0 ? 1 : 0,
    };
  });
}

function unit(v) {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l];
}

/** Bounding box of rounded triangles, sampling each arc. */
function bounds(tris) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const tri of tris) {
    for (const { a, b, c, r } of corners(tri)) {
      const t0 = Math.atan2(a[1] - c[1], a[0] - c[0]);
      let dt = Math.atan2(b[1] - c[1], b[0] - c[0]) - t0;
      dt = Math.atan2(Math.sin(dt), Math.cos(dt));
      for (let k = 0; k <= 32; k++) {
        const x = c[0] + r * Math.cos(t0 + (dt * k) / 32);
        const y = c[1] + r * Math.sin(t0 + (dt * k) / 32);
        box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y);
        box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y);
      }
    }
  }
  return box;
}

/** Stretch a letter's triangles until, once rounded, they fill the W x H box. */
function fit(tris) {
  for (let i = 0; i < 6; i++) {
    const [x0, y0, x1, y1] = bounds(tris);
    const sx = W / (x1 - x0);
    const sy = H / (y1 - y0);
    tris = tris.map((tri) => tri.map(([x, y, r]) => [(x - x0) * sx, (y - y0) * sy, r]));
  }
  return tris;
}

/** Closed path for a triangle with every corner rounded by an arc. */
function rounded(points) {
  return (
    corners(points)
      .map(({ a, b, r, sweep }, i) =>
        `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}A${f(r)} ${f(r)} 0 0 ${sweep} ${f(b[0])} ${f(b[1])}`,
      )
      .join('') + 'Z'
  );
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
    const [p1, p2] = fit(tris).map((tri) => rounded(tri.map(([x, y, r]) => [x + dx, y, r])));
    defs += `<clipPath id="${id}-${i}"><path d="${p1}"/></clipPath>`;
    body +=
      `<path fill="${palette.a}" d="${p1}"/>` +
      `<path fill="${palette.b}" d="${p2}"/>` +
      `<path fill="${palette.fold}" clip-path="url(#${id}-${i})" d="${p2}"/>`;
  });
  return `<defs>${defs}</defs>${body}`;
}
