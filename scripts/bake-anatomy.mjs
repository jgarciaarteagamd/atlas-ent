// Bakes the inner anatomy shown inside the hologram into a compact binary:
// laser slices and a lit point cloud for each structure, tagged with the
// zone group it belongs to.
//
//   node scripts/bake-anatomy.mjs src/assets/anatomy.bin
//
// Structures are modelled as signed distance fields in the head frame used by
// bake-head.mjs (y up, face towards +z, neck base at y = -1.75). They are
// simplified for patient education, not a surgical reference.

import { writeFileSync } from 'node:fs';

const output = process.argv[2];
if (!output) {
  console.error('usage: node scripts/bake-anatomy.mjs <out.bin>');
  process.exit(1);
}

// Must match the order used by src/scripts/holo.js
const GROUPS = ['ear', 'sinus', 'mouth', 'pharynx', 'larynx', 'neck', 'gland'];
const SLICE = 0.028;
const RESAMPLE = 0.014;

// ---------- SDF toolkit ----------
const len = (x, y, z) => Math.hypot(x, y, z);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };

function ell(p, c, r) {
  const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2];
  const k0 = len(x, y, z);
  const k1 = len(x / r[0], y / r[1], z / r[2]);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}
function cap(p, a, b, r) {
  const pa = sub(p, a), ba = sub(b, a);
  const h = Math.min(Math.max(dot(pa, ba) / dot(ba, ba), 0), 1);
  return len(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - r;
}
// tube along a polyline; r can vary linearly from r0 to r1
function tube(p, pts, r0, r1 = r0) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const r = r0 + (r1 - r0) * (i / Math.max(1, pts.length - 2));
    d = Math.min(d, cap(p, pts[i], pts[i + 1], r));
  }
  return d;
}
// rounded box in a local frame given by unit axes u, v, w
function box(p, c, u, v, w, h, round = 0) {
  const q = sub(p, c);
  const lx = Math.abs(dot(q, u)) - h[0], ly = Math.abs(dot(q, v)) - h[1], lz = Math.abs(dot(q, w)) - h[2];
  const out = len(Math.max(lx, 0), Math.max(ly, 0), Math.max(lz, 0));
  return out + Math.min(Math.max(lx, ly, lz), 0) - round;
}
const lobes = (p, f, a) => a * Math.sin(p[0] * f) * Math.sin(p[1] * f * 1.13) * Math.sin(p[2] * f * 0.91);
const arc = (n, fn) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

// ---------- structures ----------
// Each structure: group, sdf, bounding box [min, max], point budget.
const S = [];
const add = (group, bmin, bmax, points, sdf) => S.push({ group, bmin, bmax, points, sdf });

for (const s of [1, -1]) {
  // ----- ear -----
  const canal = arc(8, (t) => [s * (0.86 - 0.17 * t), 0.03 - 0.012 * t + 0.01 * Math.sin(t * Math.PI), -0.24 + 0.035 * t]);
  add('ear', [s * 0.66, -0.02, -0.28].map((v, i) => (i === 0 ? Math.min(v, s * 0.88) : v)), [Math.max(s * 0.66, s * 0.88), 0.07, -0.18], 500,
    (p) => tube(p, canal, 0.026, 0.02));
  // tympanic membrane and ossicles
  add('ear', [s > 0 ? 0.64 : -0.7, -0.03, -0.24], [s > 0 ? 0.7 : -0.64, 0.08, -0.16], 450, (p) => {
    const drum = Math.max(ell(p, [s * 0.69, 0.02, -0.205], [0.006, 0.038, 0.032]), -1);
    const malleus = cap(p, [s * 0.673, 0.055, -0.21], [s * 0.675, 0.015, -0.205], 0.0065);
    const incus = cap(p, [s * 0.664, 0.05, -0.22], [s * 0.66, 0.02, -0.215], 0.0065);
    const stapes = cap(p, [s * 0.66, 0.02, -0.215], [s * 0.645, 0.02, -0.205], 0.005);
    return Math.min(drum, malleus, incus, stapes);
  });
  // cochlea: 2.5 turns tapering towards the apex, axis pointing forward and in
  const cc = [s * 0.6, -0.005, -0.15];
  const ax = [-s * 0.55, -0.15, 0.82].map((v) => v / len(-s * 0.55, -0.15, 0.82));
  const e1 = [0, 1, 0];
  const e1p = sub(e1, ax.map((v) => v * dot(e1, ax))).map((v, _, a) => v / len(...a));
  const e2 = [ax[1] * e1p[2] - ax[2] * e1p[1], ax[2] * e1p[0] - ax[0] * e1p[2], ax[0] * e1p[1] - ax[1] * e1p[0]];
  const spiral = arc(110, (t) => {
    const ang = t * Math.PI * 5, r = 0.052 * (1 - 0.72 * t), h = 0.045 * t;
    return [0, 1, 2].map((k) => cc[k] + e1p[k] * Math.cos(ang) * r + e2[k] * Math.sin(ang) * r + ax[k] * h);
  });
  add('ear', [cc[0] - 0.09, cc[1] - 0.09, cc[2] - 0.09], [cc[0] + 0.09, cc[1] + 0.09, cc[2] + 0.09], 1400,
    (p) => tube(p, spiral, 0.016, 0.006));
  // vestibule and semicircular canals
  const vc = [s * 0.635, 0.035, -0.205];
  add('ear', [vc[0] - 0.08, vc[1] - 0.05, vc[2] - 0.09], [vc[0] + 0.08, vc[1] + 0.12, vc[2] + 0.08], 1100, (p) => {
    const vest = ell(p, vc, [0.018, 0.024, 0.02]);
    const ring = (c, n, R) => {
      const q = sub(p, c);
      const along = dot(q, n);
      const inPlane = sub(q, n.map((v) => v * along));
      return len(len(...inPlane) - R, along, 0) - 0.0065;
    };
    const lat = ring([s * 0.655, 0.05, -0.225], [0, 1, 0], 0.036);
    const sup = ring([s * 0.63, 0.085, -0.19], [s * 0.4, 0, 0.92].map((v) => v / len(s * 0.4, 0, 0.92)), 0.04);
    const post = ring([s * 0.64, 0.07, -0.245], [s * 0.92, 0, -0.4].map((v) => v / len(s * 0.92, 0, -0.4)), 0.04);
    return Math.min(vest, lat, sup, post);
  });
  // Eustachian tube and auditory nerve
  const eus = arc(10, (t) => [s * (0.65 - 0.52 * t), 0.0 - 0.13 * t, -0.18 + 0.33 * t]);
  add('ear', [Math.min(s * 0.13, s * 0.66), -0.15, -0.2], [Math.max(s * 0.13, s * 0.66), 0.03, 0.17], 500, (p) => tube(p, eus, 0.014, 0.022));
  add('ear', [Math.min(s * 0.42, s * 0.62), -0.04, -0.19], [Math.max(s * 0.42, s * 0.62), 0.05, -0.08], 220,
    (p) => cap(p, [s * 0.585, 0.0, -0.14], [s * 0.44, 0.01, -0.12], 0.011));

  // ----- sinuses and nose -----
  add('sinus', [s * 0.27 - 0.15, -0.28, 0.44], [s * 0.27 + 0.15, 0.03, 0.76], 1300,
    (p) => Math.max(ell(p, [s * 0.27, -0.12, 0.6], [0.12, 0.14, 0.15]) + lobes(p, 40, 0.008), p[1] - 0.0 - 0.06 * Math.abs(p[0])));
  add('sinus', [s * 0.1 - 0.09, 0.27, 0.6], [s * 0.1 + 0.09, 0.49, 0.75], 600,
    (p) => ell(p, [s * 0.1, 0.38, 0.68], [0.075, 0.09, 0.045]) + lobes(p, 55, 0.01));
  const cells = arc(8, (t) => [s * (0.05 + 0.05 * Math.sin(t * 9)), 0.1 + 0.11 * t, 0.68 - 0.27 * t]);
  add('sinus', [Math.min(s * 0.01, s * 0.14), 0.05, 0.37], [Math.max(s * 0.01, s * 0.14), 0.26, 0.74], 800,
    (p) => Math.min(...cells.map((c, i) => ell(p, c, [0.03, 0.028, 0.032].map((v) => v * (0.8 + 0.3 * ((i * 7) % 3) / 2))))));
  // turbinates
  add('sinus', [Math.min(s * 0.03, s * 0.16), -0.28, 0.36], [Math.max(s * 0.03, s * 0.16), -0.02, 0.9], 900, (p) => Math.min(
    cap(p, [s * 0.1, -0.22, 0.4], [s * 0.095, -0.21, 0.84], 0.032),
    cap(p, [s * 0.085, -0.12, 0.44], [s * 0.08, -0.1, 0.76], 0.025),
    cap(p, [s * 0.07, -0.03, 0.46], [s * 0.065, -0.02, 0.62], 0.018),
  ));

  // ----- tonsils -----
  add('pharynx', [s * 0.11 - 0.05, -0.63, 0.26], [s * 0.11 + 0.05, -0.47, 0.38], 500,
    (p) => ell(p, [s * 0.11, -0.55, 0.32], [0.035, 0.062, 0.04]) + lobes(p, 90, 0.006));

  // ----- larynx: thyroid laminae, arytenoids, vocal and vestibular folds -----
  const dir = [s * Math.sin(1.0), 0, -Math.cos(1.0)];
  const plate = [0, 1, 2].map((k) => [0, -1.13, 0.27][k] + dir[k] * 0.085);
  add('larynx', [Math.min(0, s * 0.17), -1.27, 0.12], [Math.max(0, s * 0.17), -0.99, 0.31], 1100, (p) => {
    const lamina = box(p, plate, dir, [0, 1, 0], [-dir[2] * s, 0, dir[0] * s].map((v) => v * s), [0.088, 0.11, 0.005], 0.004);
    const notch = ell(p, [0, -1.0, 0.29], [0.03, 0.035, 0.04]);
    return Math.max(lamina, -notch);
  });
  add('larynx', [Math.min(s * 0.01, s * 0.08), -1.25, -0.0], [Math.max(s * 0.01, s * 0.08), -1.14, 0.06], 250,
    (p) => ell(p, [s * 0.045, -1.2, 0.03], [0.02, 0.03, 0.018]));
  add('larynx', [Math.min(0, s * 0.07), -1.22, 0.0], [Math.max(0, s * 0.07), -1.12, 0.26], 500, (p) => Math.min(
    cap(p, [s * 0.005, -1.19, 0.24], [s * 0.045, -1.195, 0.04], 0.011),
    cap(p, [s * 0.012, -1.15, 0.23], [s * 0.055, -1.155, 0.05], 0.009),
  ));

  // ----- neck: thyroid lobes, lymph nodes, carotid and jugular -----
  add('neck', [s * 0.11 - 0.07, -1.62, 0.09], [s * 0.11 + 0.07, -1.33, 0.23], 900,
    (p) => ell(p, [s * 0.11, -1.47, 0.16], [0.05, 0.13, 0.05]) + lobes(p, 60, 0.006));
  const nodes = [
    ...arc(7, (t) => [s * (0.38 - 0.05 * t), -0.8 - 0.82 * t, -0.03 + 0.05 * t]),
    [s * 0.2, -0.95, 0.38], [s * 0.26, -0.98, 0.33], [s * 0.08, -1.0, 0.42],
    [s * 0.46, -1.25, -0.3], [s * 0.44, -1.45, -0.25],
  ];
  add('neck', [Math.min(s * 0.04, s * 0.52), -1.68, -0.36], [Math.max(s * 0.04, s * 0.52), -0.74, 0.46], 1300,
    (p) => Math.min(...nodes.map((c, i) => ell(p, c, [0.024, 0.034, 0.024].map((v) => v * (0.8 + 0.25 * (i % 3)))))));
  const carotid = arc(10, (t) => [s * (0.24 + 0.07 * t), -1.75 + 0.7 * t, 0.06 - 0.1 * t]);
  const icaEca = [arc(8, (t) => [s * (0.31 + 0.02 * t), -1.05 + 0.35 * t, -0.04 - 0.08 * t]), arc(8, (t) => [s * (0.31 - 0.02 * t), -1.05 + 0.25 * t, -0.04 + 0.12 * t])];
  const jugular = arc(10, (t) => [s * (0.31 + 0.07 * t), -1.75 + 1.05 * t, -0.04 - 0.14 * t]);
  add('neck', [Math.min(s * 0.18, s * 0.44), -1.75, -0.24], [Math.max(s * 0.18, s * 0.44), -0.66, 0.14], 900, (p) => Math.min(
    tube(p, carotid, 0.022), tube(p, icaEca[0], 0.017, 0.013), tube(p, icaEca[1], 0.014, 0.01), tube(p, jugular, 0.028, 0.024),
  ));

  // ----- salivary glands and ducts -----
  add('gland', [s * 0.66 - 0.12, -0.56, -0.24], [s * 0.66 + 0.12, -0.05, 0.16], 1500,
    (p) => smin(ell(p, [s * 0.67, -0.3, -0.04], [0.075, 0.2, 0.15]), ell(p, [s * 0.6, -0.42, -0.1], [0.06, 0.1, 0.07]), 0.04) + lobes(p, 70, 0.012));
  const stensen = arc(10, (t) => [s * (0.7 - 0.2 * t - 0.05 * t * t), -0.26 - 0.06 * t, 0.1 + 0.52 * t]);
  add('gland', [Math.min(s * 0.42, s * 0.73), -0.35, 0.07], [Math.max(s * 0.42, s * 0.73), -0.22, 0.65], 350, (p) => tube(p, stensen, 0.009));
  add('gland', [s * 0.38 - 0.12, -1.04, 0.15], [s * 0.38 + 0.12, -0.87, 0.41], 900,
    (p) => ell(p, [s * 0.38, -0.95, 0.28], [0.1, 0.06, 0.12]) + lobes(p, 75, 0.01));
  const wharton = arc(8, (t) => [s * (0.31 - 0.25 * t), -0.92 + 0.2 * t, 0.36 + 0.34 * t]);
  add('gland', [Math.min(s * 0.04, s * 0.33), -0.94, 0.33], [Math.max(s * 0.04, s * 0.33), -0.7, 0.72], 300, (p) => tube(p, wharton, 0.008));
  add('gland', [s * 0.14 - 0.06, -0.81, 0.43], [s * 0.14 + 0.06, -0.71, 0.67], 450,
    (p) => ell(p, [s * 0.14, -0.76, 0.55], [0.04, 0.025, 0.1]) + lobes(p, 90, 0.006));
}

// ----- midline structures -----
add('sinus', [-0.1, 0.0, 0.2], [0.1, 0.17, 0.4], 500, (p) => ell(p, [0, 0.08, 0.3], [0.08, 0.065, 0.07]) + lobes(p, 40, 0.006));
add('sinus', [-0.02, -0.33, 0.34], [0.02, 0.2, 0.98], 900, (p) => {
  const plate = Math.abs(p[0]) - 0.006;
  const outline = ell(p, [0, -0.07, 0.66], [0.2, 0.22, 0.3]);
  return Math.max(plate, outline);
});

// mouth: tongue, palate, uvula and dental arches
add('mouth', [-0.2, -0.8, 0.15], [0.2, -0.46, 0.84], 1800, (p) => {
  const body = ell(p, [0, -0.555, 0.53], [0.165, 0.075, 0.27]);
  const root = ell(p, [0, -0.68, 0.3], [0.13, 0.11, 0.12]);
  const groove = ell(p, [0, -0.48, 0.55], [0.012, 0.02, 0.22]);
  return Math.max(smin(body, root, 0.08), -groove);
});
add('mouth', [-0.24, -0.47, 0.3], [0.24, -0.38, 0.86], 900, (p) => {
  const arch = ell(p, [0, -0.43, 0.56], [0.2, 0.05, 0.28]);
  return Math.max(Math.abs(arch) - 0.006, -(p[1] + 0.43));
});
add('mouth', [-0.04, -0.6, 0.22], [0.04, -0.42, 0.36], 200, (p) => cap(p, [0, -0.45, 0.32], [0, -0.555, 0.27], 0.016));
const teeth = [];
for (const [y, h] of [[-0.452, 0.026], [-0.505, -0.026]]) {
  for (let i = 0; i < 16; i++) {
    const t = (i + 0.5) / 16;
    const ang = Math.PI * t;
    const molar = Math.abs(t - 0.5) > 0.3;
    teeth.push({ c: [Math.cos(ang) * 0.225, y, 0.5 + Math.sin(ang) * 0.32], ang, w: molar ? 0.026 : 0.017, h });
  }
}
add('mouth', [-0.26, -0.55, 0.45], [0.26, -0.41, 0.85], 2200, (p) => Math.min(...teeth.map((tt) => {
  const u = [-Math.sin(tt.ang), 0, Math.cos(tt.ang)];
  const w = [Math.cos(tt.ang), 0, Math.sin(tt.ang)];
  return box(p, [tt.c[0], tt.c[1] + tt.h * 0.5, tt.c[2]], u, [0, 1, 0], w, [tt.w * 0.55, 0.022, 0.015], 0.006);
})));

// pharynx: muscular tube from the nasopharynx to the hypopharynx, with adenoids
const phx = arc(14, (t) => [0, -0.04 - 1.0 * t, 0.17 - 0.12 * t + Math.sin(t * Math.PI) * 0.05]);
add('pharynx', [-0.2, -1.1, -0.04], [0.2, 0.05, 0.32], 2600, (p) => {
  const outer = tube(p, phx, 0.14, 0.085);
  const shell = Math.abs(outer + 0.012) - 0.006;
  return Math.max(shell, -(p[2] - 0.2 + 0.25 * (p[1] + 0.3)));
});
add('pharynx', [-0.08, -0.1, 0.06], [0.08, 0.05, 0.2], 450, (p) => ell(p, [0, -0.02, 0.13], [0.065, 0.045, 0.05]) + lobes(p, 80, 0.008));

// larynx midline: epiglottis, cricoid, hyoid, trachea
add('larynx', [-0.07, -1.02, 0.04], [0.07, -0.8, 0.18], 450, (p) => {
  const leaf = ell(p, [0, -0.91, 0.12], [0.05, 0.09, 0.03]);
  return Math.max(Math.abs(leaf + 0.004) - 0.004, p[2] - 0.13 - (p[1] + 0.91) * 0.15);
});
add('larynx', [-0.13, -1.37, -0.02], [0.13, -1.24, 0.25], 800, (p) => {
  const q = [p[0], p[1] + 1.3, p[2] - 0.11];
  const ringR = len(q[0], 0, q[2]);
  const height = 0.018 + 0.035 * Math.max(0, -q[2] / 0.11);
  return box([ringR, q[1], 0], [0.1, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.008, height, 1], 0.004);
});
const hyoid = arc(24, (t) => { const a = Math.PI * (0.05 + 0.9 * t); return [Math.cos(a) * 0.15, -0.98 + 0.02 * Math.abs(Math.cos(a)), 0.14 + Math.sin(a) * 0.15 - 0.06 * Math.abs(Math.cos(a))]; });
add('larynx', [-0.17, -1.01, 0.03], [0.17, -0.94, 0.31], 500, (p) => tube(p, hyoid, 0.014, 0.008));
add('larynx', [-0.13, -1.76, -0.04], [0.13, -1.37, 0.22], 1800, (p) => {
  const q = [p[0], p[1], p[2] - 0.09];
  const r = len(q[0], 0, q[2]);
  const ringY = ((p[1] + 1.4) % 0.05 + 0.05) % 0.05 - 0.025;
  const ring = len(r - 0.09, ringY, 0) - 0.011;
  const open = q[2] < -0.05 ? 0.02 : -1; // C-shaped: open at the back
  return Math.max(ring, -open);
});

// ---------- sampling ----------
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const eps = 0.0015;
const grad = (f, p) => {
  const gx = f([p[0] + eps, p[1], p[2]]) - f([p[0] - eps, p[1], p[2]]);
  const gy = f([p[0], p[1] + eps, p[2]]) - f([p[0], p[1] - eps, p[2]]);
  const gz = f([p[0], p[1], p[2] + eps]) - f([p[0], p[1], p[2] - eps]);
  const l = len(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
};

const points = [];
const polylines = [];
for (const st of S) {
  const g = GROUPS.indexOf(st.group);
  const lo = st.bmin.map((v, i) => Math.min(v, st.bmax[i]) - 0.02);
  const hi = st.bmin.map((v, i) => Math.max(v, st.bmax[i]) + 0.02);

  // surface points
  const budget = Math.round(st.points * 0.7);
  let got = 0;
  for (let tries = 0; tries < budget * 30 && got < budget; tries++) {
    let p = [0, 1, 2].map((k) => lo[k] + rand() * (hi[k] - lo[k]));
    for (let it = 0; it < 5; it++) {
      const d = st.sdf(p);
      const n = grad(st.sdf, p);
      p = p.map((v, k) => v - d * n[k]);
    }
    if (Math.abs(st.sdf(p)) < 0.002) { points.push({ p, n: grad(st.sdf, p), g }); got++; }
  }

  // horizontal laser slices (marching squares)
  const h = 0.006;
  const nx = Math.ceil((hi[0] - lo[0]) / h), nz = Math.ceil((hi[2] - lo[2]) / h);
  for (let y = lo[1] + SLICE / 2; y < hi[1]; y += SLICE) {
    const field = new Float32Array((nx + 1) * (nz + 1));
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) field[j * (nx + 1) + i] = st.sdf([lo[0] + i * h, y, lo[2] + j * h]);
    const segs = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = field[j * (nx + 1) + i], b = field[j * (nx + 1) + i + 1], c = field[(j + 1) * (nx + 1) + i + 1], e = field[(j + 1) * (nx + 1) + i];
      const pts = [];
      const L = (u, v) => u / (u - v);
      if ((a < 0) !== (b < 0)) pts.push([i + L(a, b), j]);
      if ((b < 0) !== (c < 0)) pts.push([i + 1, j + L(b, c)]);
      if ((e < 0) !== (c < 0)) pts.push([i + L(e, c), j + 1]);
      if ((a < 0) !== (e < 0)) pts.push([i, j + L(a, e)]);
      if (pts.length >= 2) segs.push([pts[0], pts[1]]);
      if (pts.length === 4) segs.push([pts[2], pts[3]]);
    }
    for (const line of chain(segs)) {
      const world = line.map(([u, v]) => [lo[0] + u * h, y, lo[2] + v * h]);
      const rs = resample(world);
      if (rs.length >= 3) polylines.push({ g, l: rs.map((p) => ({ p, n: grad(st.sdf, p) })) });
    }
  }
}

function chain(segs) {
  const key = (q) => `${Math.round(q[0] * 1000)},${Math.round(q[1] * 1000)}`;
  const adj = new Map();
  const link = (a, b) => { (adj.get(key(a)) || adj.set(key(a), { q: a, n: [] }).get(key(a))).n.push(key(b)); };
  for (const [a, b] of segs) { link(a, b); link(b, a); }
  const seen = new Set(), out = [];
  const walk = (k) => {
    const line = [adj.get(k).q]; seen.add(k);
    let cur = k;
    for (;;) {
      const next = adj.get(cur).n.find((x) => !seen.has(x));
      if (!next) break;
      seen.add(next); line.push(adj.get(next).q); cur = next;
    }
    return line;
  };
  for (const [k, v] of adj) if (v.n.length === 1 && !seen.has(k)) out.push(walk(k));
  for (const k of adj.keys()) if (!seen.has(k)) out.push(walk(k));
  return out;
}
function resample(line) {
  const out = [line[0]];
  let acc = 0;
  for (let i = 1; i < line.length; i++) {
    acc += len(...sub(line[i], line[i - 1]));
    if (acc >= RESAMPLE || i === line.length - 1) { out.push(line[i]); acc = 0; }
  }
  return out;
}

// ---------- write ----------
// 'ATA1', line count, line point count, point count; uint32 counts[]; uint8 line groups[] (padded to 2);
// int16 line xyz, int16 point xyz; int8 line normals, int8 point normals; uint8 point groups
const nL = polylines.length;
const nLP = polylines.reduce((s, l) => s + l.l.length, 0);
const nP = points.length;
const pad = nL % 2;
const size = 16 + nL * 4 + nL + pad + nLP * 9 + nP * 10;
const out = Buffer.alloc(size);
let o = 0;
out.write('ATA1', 0, 'ascii'); o = 4;
out.writeUInt32LE(nL, o); o += 4; out.writeUInt32LE(nLP, o); o += 4; out.writeUInt32LE(nP, o); o += 4;
for (const l of polylines) { out.writeUInt32LE(l.l.length, o); o += 4; }
for (const l of polylines) out.writeUInt8(l.g, o++);
o += pad;
const q = (v) => Math.max(-32767, Math.min(32767, Math.round(v * (32767 / 2))));
const qn = (v) => Math.max(-127, Math.min(127, Math.round(v * 127)));
for (const l of polylines) for (const { p } of l.l) for (const v of p) { out.writeInt16LE(q(v), o); o += 2; }
for (const { p } of points) for (const v of p) { out.writeInt16LE(q(v), o); o += 2; }
for (const l of polylines) for (const { n } of l.l) for (const v of n) out.writeInt8(qn(v), o++);
for (const { n } of points) for (const v of n) out.writeInt8(qn(v), o++);
for (const { g } of points) out.writeUInt8(g, o++);
writeFileSync(output, out);
const perGroup = GROUPS.map((name, g) => `${name} ${points.filter((x) => x.g === g).length}`).join(', ');
console.log(`wrote ${output}: ${nL} polylines, ${nLP} line points, ${nP} points (${perGroup}), ${(size / 1024).toFixed(0)} KB`);
