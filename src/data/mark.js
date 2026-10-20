// JGA isotipo: each letter is a ribbon that folds over itself; the shading
// shows which face of the ribbon is up and where it turns. Shared by the
// header and scripts/build-brand.mjs so the logo has one source of geometry.
//
// Drawn in a 1500 x 570 box, then scaled to a height of 100.

const BOX_W = 1500;
const BOX_H = 570;
const K = 100 / BOX_H;

export const markWidth = BOX_W * K;
export const markHeight = 100;

export const palettes = {
  dark: { hi: '#a4f7ff', cyan: '#46dcf5', aqua: '#18c0cc', teal: '#1d8ea2', deep: '#10697a', blue: '#1fa3c3' },
  light: { hi: '#3ec3d4', cyan: '#1fb1c6', aqua: '#1597a8', teal: '#11707f', deep: '#0b4855', blue: '#137d97' },
};

// J: stem down the right, bottom bowl curving up into the hook.
const J = { cx: 205, cy: 365, R: 205, r: 90 };
// G: round bowl from a slanted top end, crossbar folding down into a spur.
const G = { cx: 750, cy: 285, R: 285, r: 170, end: -56.5, right: 945, spurLeft: 830, barLeft: 690, barTop: 233, barBottom: 345 };
// A: two legs folded over each other at a flat top.
const A = { back: [[960, 570], [1095, 570], [1300, 0], [1165, 0]], front: [[1165, 0], [1300, 0], [1500, 570], [1365, 570]] };

const f = (n) => +n.toFixed(2);
const pt = (p) => `${f(p[0])} ${f(p[1])}`;
const rad = (deg) => (deg * Math.PI) / 180;
const on = (c, radius, deg) => [c.cx + radius * Math.cos(rad(deg)), c.cy + radius * Math.sin(rad(deg))];
const unit = (p, q) => { const v = [q[0] - p[0], q[1] - p[1]]; const l = Math.hypot(...v); return [v[0] / l, v[1] / l]; };

/** Polygon with some corners rounded: points are [x, y] or [x, y, radius]. */
function rounded(points) {
  const n = points.length;
  return points.map((p, i) => {
    const r = p[2];
    if (!r) return `${i ? 'L' : 'M'}${pt(p)}`;
    const u1 = unit(p, points[(i + n - 1) % n]);
    const u2 = unit(p, points[(i + 1) % n]);
    const t = r / Math.tan(Math.acos(u1[0] * u2[0] + u1[1] * u2[1]) / 2);
    const sweep = u1[0] * u2[1] - u1[1] * u2[0] < 0 ? 1 : 0;
    return `${i ? 'L' : 'M'}${pt([p[0] + u1[0] * t, p[1] + u1[1] * t])}A${r} ${r} 0 0 ${sweep} ${pt([p[0] + u2[0] * t, p[1] + u2[1] * t])}`;
  }).join('') + 'Z';
}

function shapes() {
  // J. The darker back of the ribbon fills the whole bowl; the lighter stem
  // lies on top and curls round the bottom, ending in a crescent.
  const jIn = on(J, J.r, 8);
  const jOut = on(J, J.R, 94);
  const jBowl = `M${pt(on(J, J.R, 0))}A${J.R} ${J.R} 0 0 1 ${pt(on(J, J.R, 180))}L${pt(on(J, J.r, 180))}A${J.r} ${J.r} 0 0 0 ${pt(on(J, J.r, 0))}Z`;
  const jStem = `M295 0H410V${J.cy}A${J.R} ${J.R} 0 0 1 ${pt(jOut)}Q300 535 ${pt(jIn)}A${J.r} ${J.r} 0 0 0 295 ${J.cy}Z`;

  // G. The bowl runs from its top end round to the spur; the spur comes down
  // from the crossbar fold and turns into the bowl at the bottom.
  const gEndOut = on(G, G.R, G.end);
  const gEndIn = on(G, G.r, G.end);
  const outerAtRight = [G.right, G.cy + Math.sqrt(G.R ** 2 - (G.right - G.cx) ** 2)];
  const innerAtSpur = [G.spurLeft, G.cy + Math.sqrt(G.r ** 2 - (G.spurLeft - G.cx) ** 2)];
  const gTurn = on(G, G.R, 84);
  const gBowl = `M${pt(gEndOut)}A${G.R} ${G.R} 0 1 0 ${pt(outerAtRight)}L${pt(innerAtSpur)}A${G.r} ${G.r} 0 1 1 ${pt(gEndIn)}Z`;
  const gSpur = `M${G.spurLeft} ${G.barBottom}H${G.right}V${f(outerAtRight[1])}A${G.R} ${G.R} 0 0 1 ${pt(gTurn)}Q845 540 ${pt(innerAtSpur)}Z`;
  const gBar = `M${G.barLeft} ${G.barTop}H${G.right}V${G.barBottom}H${G.barLeft}Z`;
  const gCurl = `M${G.spurLeft} ${G.barBottom}H${G.right}V385Q890 384 ${G.spurLeft} ${G.barBottom}Z`;

  // A. Back leg first, front leg over it; the fold at the top is rounded once
  // for both, so its edge reads as one ribbon turning over.
  const aBack = rounded([A.back[0], A.back[1], [...A.back[2], 30], [...A.back[3], 34]]);
  const aFront = rounded([[...A.front[0], 20], [...A.front[1], 30], A.front[2], A.front[3]]);

  return [
    ['jBowl', jBowl, [[300, 470], [40, 420]], [[0, 'deep'], [1, 'teal']]],
    ['jStem', jStem, [[350, 0], [330, 570]], [[0, 'hi'], [1, 'cyan']]],
    ['gBowl', gBowl, [[750, 0], [750, 570]], [[0, 'hi'], [0.55, 'aqua'], [1, 'teal']]],
    ['gSpur', gSpur, [[880, 345], [880, 568]], [[0, 'deep'], [0.3, 'teal'], [1, 'aqua']]],
    ['gBar', gBar, [[690, 290], [945, 290]], [[0, 'blue'], [0.75, 'aqua'], [1, 'hi']]],
    ['gCurl', gCurl, [[830, 345], [945, 385]], [[0, 'cyan'], [1, 'hi']]],
    ['aBack', aBack, [[1230, 0], [1030, 570]], [[0, 'deep'], [1, 'teal']]],
    ['aFront', aFront, [[1260, 0], [1430, 570]], [[0, 'hi'], [0.4, 'aqua'], [1, 'blue']]],
  ];
}

/**
 * SVG markup for the mark in a 0 0 markWidth markHeight box.
 * `id` keeps gradient ids unique when several marks share a document.
 */
export function markSvg(palette = palettes.dark, id = 'jga') {
  let defs = '';
  let body = '';
  for (const [name, d, [p1, p2], stops] of shapes()) {
    const gid = `${id}-${name}`;
    defs +=
      `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}">` +
      stops.map(([o, c]) => `<stop offset="${o}" stop-color="${palette[c]}"/>`).join('') +
      `</linearGradient>`;
    body += `<path fill="url(#${gid})" d="${d}"/>`;
  }
  return `<defs>${defs}</defs><g transform="scale(${+K.toFixed(6)})">${body}</g>`;
}
