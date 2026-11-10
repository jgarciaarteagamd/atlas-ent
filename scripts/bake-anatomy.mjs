// Bakes the inner anatomy shown inside the hologram into a compact binary:
// laser slices and a lit point cloud for each structure, tagged with the
// group it belongs to.
//
//   node scripts/bake-anatomy.mjs assets/atlas.glb src/assets/anatomy.bin
//
// Most structures are real anatomical meshes from the Z-Anatomy atlas
// (assets/atlas.glb, see assets/ATLAS-LICENSE.md). The atlas is fitted to the
// hologram head with a smooth warp driven by craniofacial landmarks, so the
// skull sits under the skin of this particular head. What the atlas lacks or
// licenses for non-commercial use only (the ear, the maxillary sinus, the vocal
// folds, the adenoids) is modelled here as signed distance fields in the same
// atlas coordinates. It is patient education, not a surgical reference.
//
// Frames: the atlas is in metres, y up, face towards +z, the body's left at +x.
// The hologram frame is the one of bake-head.mjs (neck base at y = -1.75).

import { readFileSync, writeFileSync } from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node scripts/bake-anatomy.mjs <atlas.glb> <out.bin>');
  process.exit(1);
}

// Must match the order used by src/scripts/holo.js
const GROUPS = ['ear', 'sinus', 'mouth', 'pharynx', 'larynx', 'neck', 'gland', 'bone'];
const RESAMPLE = 0.014;
const FLOOR = -1.72; // nothing is drawn below the base of the neck

const len = (x, y, z) => Math.hypot(x, y, z);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => { const l = len(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- atlas ----------
function readAtlas(path) {
  const buf = readFileSync(path);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen + 8;
  const view = (index, Ctor, comps) => {
    const acc = json.accessors[index], bv = json.bufferViews[acc.bufferView];
    const offset = buf.byteOffset + binStart + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    return new Ctor(buf.buffer.slice(offset, offset + acc.count * comps * Ctor.BYTES_PER_ELEMENT));
  };
  const out = new Map();
  for (const node of json.nodes) {
    const prim = json.meshes[node.mesh].primitives[0];
    out.set(node.name, { pos: view(prim.attributes.POSITION, Float32Array, 3), idx: view(prim.indices, Uint32Array, 1) });
  }
  return out;
}
const atlas = readAtlas(input);

// ---------- warp: atlas -> hologram ----------
// Monotone cubic interpolation through [x, y] pairs, linear beyond the ends.
function curve(pairs) {
  const p = [...pairs].sort((a, b) => a[0] - b[0]);
  const n = p.length, h = [], d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h.push(p[i + 1][0] - p[i][0]); d.push((p[i + 1][1] - p[i][1]) / h[i]); }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return (x) => {
    if (x <= p[0][0]) return p[0][1] + m[0] * (x - p[0][0]);
    if (x >= p[n - 1][0]) return p[n - 1][1] + m[n - 1] * (x - p[n - 1][0]);
    let i = 0;
    while (x > p[i + 1][0]) i++;
    const t = (x - p[i][0]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * p[i + 1][1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

// Heights. 'H' is everything fixed to the skull and the jaw. 'N' is the column of
// the neck (spine, pharynx, larynx, trachea, thyroid, deep nodes): the atlas was
// scanned lying down with the chin tucked in, the hologram head looks straight
// ahead, so the column sits lower with respect to the chin.
const yH = curve([
  [1.7055, 1.195], // vertex
  [1.605, 0.21], // nasion
  [1.582, 0.02], // ear canal
  [1.556, -0.28], // tip of the nose
  [1.548, -0.37], // anterior nasal spine
  [1.5265, -0.57], // edge of the upper incisors
  [1.4915, -0.89], // menton
  [1.40, -1.75],
]);
const yN = curve([
  [1.7055, 1.195], [1.605, 0.21], [1.582, 0.02], [1.556, -0.28],
  [1.53, -0.57],
  [1.50, -0.93], // hyoid
  [1.485, -1.05], // laryngeal prominence
  [1.457, -1.27], // lower border of the cricoid
  [1.404, -1.6], // sternal notch
  [1.37, -1.86],
]);

// Front and back of the atlas in the midline at each height, and where they
// belong in the hologram head: its skin profile less the soft tissue over it.
// [atlas y, atlas z, hologram z]
const FRONT_H = [
  [1.70, 0.031, 0.415], [1.69, 0.052, 0.545], [1.68, 0.066, 0.63], [1.67, 0.074, 0.69], [1.66, 0.078, 0.725],
  [1.65, 0.085, 0.75], [1.64, 0.087, 0.768], [1.62, 0.087, 0.785], [1.605, 0.086, 0.77], [1.59, 0.091, 0.845],
  [1.58, 0.100, 0.89], [1.556, 0.116, 1.02], [1.548, 0.089, 0.80], [1.5265, 0.093, 0.80], [1.52, 0.087, 0.76],
  [1.51, 0.081, 0.72], [1.50, 0.082, 0.73], [1.4915, 0.07, 0.66], [1.45, 0.07, 0.6],
];
const FRONT_N = [
  ...FRONT_H.filter((r) => r[0] >= 1.5265),
  [1.50, 0.039, 0.40], // body of the hyoid
  [1.485, 0.032, 0.35], // laryngeal prominence
  [1.465, 0.035, 0.24], // isthmus of the thyroid
  [1.44, 0.049, 0.16], // superficial nodes in front of the trachea
  [1.404, 0.045, 0.10],
];
const BACK = [
  [1.70, -0.057, -0.445], [1.69, -0.070, -0.545], [1.68, -0.082, -0.63], [1.67, -0.090, -0.695], [1.66, -0.094, -0.745],
  [1.65, -0.098, -0.775], [1.64, -0.100, -0.79], [1.62, -0.103, -0.775], [1.60, -0.100, -0.735], [1.58, -0.085, -0.65],
  [1.57, -0.084, -0.59], [1.56, -0.066, -0.46], [1.54, -0.046, -0.36], [1.52, -0.053, -0.34], [1.48, -0.056, -0.47],
  [1.45, -0.077, -0.63], [1.42, -0.083, -0.685],
];
const col = (rows, k) => curve(rows.map((r) => [r[0], r[k]]));
const frontA = { H: col(FRONT_H, 1), N: col(FRONT_N, 1) }, frontW = { H: col(FRONT_H, 2), N: col(FRONT_N, 2) };
const backA = col(BACK, 1), backW = col(BACK, 2);
// The ear canal anchors the skull front to back: this head carries its ears further back than the atlas.
const EAR_A = -0.004, EAR_W = -0.115;
// Width: cranium, cheekbones, jaw, neck.
const sx = curve([[1.70, 9.3], [1.62, 9.3], [1.58, 9.6], [1.50, 9.4], [1.47, 8.8], [1.40, 8.6]]);

function warp(p, cls) {
  const [x, y, z] = p;
  const zb = backA(y), zf = frontA[cls](y), wb = backW(y), wf = frontW[cls](y);
  const linear = wb + ((z - zb) / (zf - zb)) * (wf - wb);
  const k = smooth(1.535, 1.565, y);
  let wz = linear;
  if (k > 0) {
    // two segments through the ear canal, blended into one curve near it
    const a = wb + ((z - zb) / (EAR_A - zb)) * (EAR_W - wb), b = EAR_W + ((z - EAR_A) / (zf - EAR_A)) * (wf - EAR_W);
    const t = smooth(EAR_A - 0.025, EAR_A + 0.025, z);
    wz = mix(linear, mix(a, b, t), k);
  }
  return [x * sx(y), (cls === 'N' ? yN : yH)(y), wz];
}
// atlas height that lands on a given hologram height
function unwarpY(wy, cls) {
  const f = cls === 'N' ? yN : yH;
  let lo = 1.3, hi = 1.8;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (f(mid) < wy) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

// ---------- output ----------
const points = []; // { p, n, g }
const polylines = []; // { g, l: [{ p, n }] }
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function pushLine(g, line) {
  // cut at the base of the neck, resample, keep what is long enough to read
  let run = [];
  const flush = () => {
    if (run.length >= 2) {
      const out = [run[0]];
      let acc = 0;
      for (let i = 1; i < run.length; i++) {
        acc += len(...sub(run[i].p, run[i - 1].p));
        if (acc >= RESAMPLE || i === run.length - 1) { out.push(run[i]); acc = 0; }
      }
      if (out.length >= 3) polylines.push({ g, l: out });
    }
    run = [];
  };
  for (const q of line) { if (q.p[1] < FLOOR) flush(); else run.push(q); }
  flush();
}

// chain unordered segments [a, b] (with ids) into polylines
function chain(segs) {
  const adj = new Map();
  const link = (a, b) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push(b); };
  for (const [a, b] of segs) { link(a, b); link(b, a); }
  const seen = new Set(), out = [];
  const walk = (start) => {
    const line = [start];
    seen.add(start);
    let cur = start;
    for (;;) {
      const next = adj.get(cur).find((x) => !seen.has(x));
      if (next === undefined) break;
      seen.add(next); line.push(next); cur = next;
    }
    if (line.length > 2 && adj.get(cur).includes(start)) line.push(start);
    return line;
  };
  for (const [k, v] of adj) if (v.length === 1 && !seen.has(k)) out.push(walk(k));
  for (const k of adj.keys()) if (!seen.has(k)) out.push(walk(k));
  return out;
}

// ---------- meshes ----------
// opts: cls 'H' | 'N', step (slice spacing), density (points per unit area), main (keep the largest shell only),
// outer (a point inside: faces that look towards it are dropped), shift (an offset in the atlas, before the warp)
function addMesh(group, names, opts = {}) {
  const g = GROUPS.indexOf(group);
  const { cls = 'H', step = 0.028, density = 2600, main = false, outer = null, shift = [0, 0, 0] } = opts;
  for (const name of [].concat(names)) {
    const src = atlas.get(name);
    if (!src) throw new Error(`atlas has no "${name}"`);
    const nV = src.pos.length / 3;
    const V = new Float32Array(nV * 3);
    for (let i = 0; i < nV; i++) V.set(warp([src.pos[i * 3] + shift[0], src.pos[i * 3 + 1] + shift[1], src.pos[i * 3 + 2] + shift[2]], cls), i * 3);
    let T = src.idx;

    // shells: orient each one outwards (the atlas mixes windings, mirrored halves are flipped)
    const parent = Uint32Array.from({ length: nV }, (_, i) => i);
    const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    for (let t = 0; t < T.length; t += 3) { const a = find(T[t]); parent[find(T[t + 1])] = a; parent[find(T[t + 2])] = a; }
    const volume = new Map(), count = new Map();
    for (let t = 0; t < T.length; t += 3) {
      const [a, b, c] = [T[t], T[t + 1], T[t + 2]].map((i) => [V[i * 3], V[i * 3 + 1], V[i * 3 + 2]]);
      const r = find(T[t]);
      volume.set(r, (volume.get(r) || 0) + dot(a, cross(b, c)));
      count.set(r, (count.get(r) || 0) + 1);
    }
    if (main) {
      const keep = [...count].sort((a, b) => b[1] - a[1])[0][0];
      T = T.filter((_, i) => find(T[i - (i % 3)]) === keep);
    }
    if (outer) {
      T = T.filter((_, i) => {
        const t = i - (i % 3);
        const [a, b, c] = [T[t], T[t + 1], T[t + 2]].map((k) => [V[k * 3], V[k * 3 + 1], V[k * 3 + 2]]);
        const n = cross(sub(b, a), sub(c, a)), sign = volume.get(find(T[t])) < 0 ? -1 : 1;
        return dot(n, sub(a, outer)) * sign > 0;
      });
    }
    const N = new Float32Array(nV * 3);
    const area = new Float64Array(T.length / 3);
    let total = 0;
    for (let t = 0; t < T.length; t += 3) {
      const [a, b, c] = [T[t], T[t + 1], T[t + 2]];
      const u = [0, 1, 2].map((k) => V[b * 3 + k] - V[a * 3 + k]), v = [0, 1, 2].map((k) => V[c * 3 + k] - V[a * 3 + k]);
      const n = cross(u, v);
      const sign = volume.get(find(a)) < 0 ? -1 : 1;
      for (const i of [a, b, c]) for (let k = 0; k < 3; k++) N[i * 3 + k] += n[k] * sign;
      total += len(...n) / 2;
      area[t / 3] = total;
    }
    for (let i = 0; i < nV; i++) { const n = unit([N[i * 3], N[i * 3 + 1], N[i * 3 + 2]]); N.set(n, i * 3); }

    // surface points, area weighted
    const want = Math.round(total * density);
    for (let n = 0; n < want; n++) {
      const r = rand() * total;
      let lo = 0, hi = area.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (area[mid] < r) lo = mid + 1; else hi = mid; }
      const [a, b, c] = [T[lo * 3], T[lo * 3 + 1], T[lo * 3 + 2]];
      let u = rand(), v = rand();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const at = (A) => [0, 1, 2].map((k) => A[a * 3 + k] + (A[b * 3 + k] - A[a * 3 + k]) * u + (A[c * 3 + k] - A[a * 3 + k]) * v);
      const p = at(V);
      if (p[1] >= FLOOR) points.push({ p, n: unit(at(N)), g });
    }

    // horizontal laser slices
    let y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < nV; i++) { y0 = Math.min(y0, V[i * 3 + 1]); y1 = Math.max(y1, V[i * 3 + 1]); }
    for (let y = Math.ceil((Math.max(y0, FLOOR) - 0.5 * step) / step) * step + 0.5 * step; y < y1; y += step) {
      const made = new Map(), segs = [];
      const edge = (a, b) => {
        if (a > b) [a, b] = [b, a];
        const key = a * nV + b;
        if (!made.has(key)) {
          const da = V[a * 3 + 1] - y || 1e-9, db = V[b * 3 + 1] - y || 1e-9, t = da / (da - db);
          made.set(key, {
            p: [0, 1, 2].map((k) => V[a * 3 + k] + (V[b * 3 + k] - V[a * 3 + k]) * t),
            n: unit([0, 1, 2].map((k) => N[a * 3 + k] + (N[b * 3 + k] - N[a * 3 + k]) * t)),
          });
        }
        return key;
      };
      for (let t = 0; t < T.length; t += 3) {
        const tri = [T[t], T[t + 1], T[t + 2]];
        const hits = [];
        for (let e = 0; e < 3; e++) {
          const a = tri[e], b = tri[(e + 1) % 3];
          if (((V[a * 3 + 1] - y || 1e-9) < 0) !== ((V[b * 3 + 1] - y || 1e-9) < 0)) hits.push(edge(a, b));
        }
        if (hits.length === 2) segs.push(hits);
      }
      for (const line of chain(segs)) pushLine(g, line.map((k) => made.get(k)));
    }
  }
}

// ---------- signed distance fields, in atlas coordinates ----------
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
function ell(p, c, r) {
  const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2];
  const k0 = len(x, y, z), k1 = len(x / r[0], y / r[1], z / r[2]);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}
// tube along a polyline, one radius per point (or a single radius)
function tube(p, pts, rs) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const pa = sub(p, pts[i]), ba = sub(pts[i + 1], pts[i]);
    const h = Math.min(Math.max(dot(pa, ba) / dot(ba, ba), 0), 1);
    const r = typeof rs === 'number' ? rs : rs[i] + (rs[i + 1] - rs[i]) * h;
    d = Math.min(d, len(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - r);
  }
  return d;
}
const cap = (p, a, b, r) => tube(p, [a, b], r);
const torus = (p, c, n, R, r) => { const q = sub(p, c), along = dot(q, n); return len(len(...sub(q, n.map((v) => v * along))) - R, along, 0) - r; };
const plane = (p, n, o) => (dot(p, n) - o) / len(...n);
const lobes = (p, f, a) => a * Math.sin(p[0] * f) * Math.sin(p[1] * f * 1.13) * Math.sin(p[2] * f * 0.91);
const arc = (n, fn) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

// opts: cls, step (hologram units), count (surface points)
function addField(group, bmin, bmax, sdf, opts = {}) {
  const g = GROUPS.indexOf(group);
  const { cls = 'H', step = 0.028, count = 600 } = opts;
  const eps = 0.00015, pad = 0.002;
  const lo = bmin.map((v, i) => Math.min(v, bmax[i]) - pad), hi = bmin.map((v, i) => Math.max(v, bmax[i]) + pad);
  const grad = (p) => unit([0, 1, 2].map((k) => { const a = [...p], b = [...p]; a[k] += eps; b[k] -= eps; return sdf(a) - sdf(b); }));
  // carry a point and its normal through the warp: the normal stays perpendicular to the warped surface
  const carry = (p) => {
    const n = grad(p);
    const t1 = unit(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), t2 = cross(n, t1);
    const w = warp(p, cls), h = 0.0004;
    const j = (t) => sub(warp([p[0] + t[0] * h, p[1] + t[1] * h, p[2] + t[2] * h], cls), w);
    return { p: w, n: unit(cross(j(t1), j(t2))) };
  };

  let got = 0;
  for (let tries = 0; tries < count * 40 && got < count; tries++) {
    let p = [0, 1, 2].map((k) => lo[k] + rand() * (hi[k] - lo[k]));
    for (let it = 0; it < 6; it++) { const d = sdf(p), n = grad(p); p = p.map((v, k) => v - d * n[k]); }
    if (Math.abs(sdf(p)) < 0.00008 && p.every((v, k) => v >= lo[k] && v <= hi[k])) { points.push({ ...carry(p), g }); got++; }
  }

  const h = 0.0005;
  const nx = Math.ceil((hi[0] - lo[0]) / h), nz = Math.ceil((hi[2] - lo[2]) / h);
  const w0 = warp([0, lo[1], 0], cls)[1], w1 = warp([0, hi[1], 0], cls)[1];
  for (let wy = Math.ceil((w0 - 0.5 * step) / step) * step + 0.5 * step; wy < w1; wy += step) {
    const y = unwarpY(wy, cls);
    const field = new Float32Array((nx + 1) * (nz + 1));
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) field[j * (nx + 1) + i] = sdf([lo[0] + i * h, y, lo[2] + j * h]);
    const made = new Map(), segs = [];
    const at = (i, j, di, dj, a, b) => {
      const key = (j * (nx + 1) + i) * 2 + dj;
      if (!made.has(key)) { const t = a / (a - b); made.set(key, [lo[0] + (i + di * t) * h, y, lo[2] + (j + dj * t) * h]); }
      return key;
    };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = field[j * (nx + 1) + i], b = field[j * (nx + 1) + i + 1], c = field[(j + 1) * (nx + 1) + i + 1], e = field[(j + 1) * (nx + 1) + i];
      const hits = [];
      if ((a < 0) !== (b < 0)) hits.push(at(i, j, 1, 0, a, b));
      if ((b < 0) !== (c < 0)) hits.push(at(i + 1, j, 0, 1, b, c));
      if ((e < 0) !== (c < 0)) hits.push(at(i, j + 1, 1, 0, e, c));
      if ((a < 0) !== (e < 0)) hits.push(at(i, j, 0, 1, a, e));
      if (hits.length >= 2) segs.push([hits[0], hits[1]]);
      if (hits.length === 4) segs.push([hits[2], hits[3]]);
    }
    for (const line of chain(segs)) pushLine(g, line.map((k) => carry(made.get(k))));
  }
}

// ---------- the structures ----------
const lr = (name) => [`${name}.l`, `${name}.r`];

// ----- skeleton: skull, jaw and cervical spine, the frame everything else hangs from -----
const BONE = { step: 0.04, density: 800 };
// the vault is drawn by its outer table only: the inner one would double every line
const VAULT = { ...BONE, main: true, outer: [0, 0.45, -0.05] };
addMesh('bone', ['Frontal bone', 'Occipital bone', ...lr('Parietal bone'), ...lr('Temporal bone')], VAULT);
addMesh('bone', ['Sphenoid bone', ...lr('Zygomatic bone'), ...lr('Maxilla'), ...lr('Nasal bone'), ...lr('Lacrimal bone'), ...lr('Palatine bone'), 'Mandible'], { ...BONE, main: true });
addMesh('bone', ['Atlas (C1)', 'Axis (C2)', 'Vertebra C3', 'Vertebra C4', 'Vertebra C5', 'Vertebra C6', 'Vertebra C7', 'Vertebra T1'], { ...BONE, cls: 'N' });

// ----- nose and paranasal sinuses -----
addMesh('bone', ['Ethmoid bone', 'Vomer', ...lr('Inferior nasal concha bone')], { ...BONE, main: true });
addMesh('sinus', ['Sinus of frontal bone', 'Sinus of sphenoid bone'], { step: 0.022, density: 2600 });
addMesh('sinus', [...lr('Anterior cells of ethmoid bone'), ...lr('Middle cells of ethmoid bone'), ...lr('Posterior cells of ethmoid bone')], { step: 0.022, density: 2600 });
addMesh('sinus', 'Mucosa of nasal cavity', { step: 0.028, density: 1500 });
addMesh('sinus', ['Nasal septal cartilage', ...lr('Lateral process of nasal septal cartilage'), ...lr('Major alar cartilage')], { step: 0.028, density: 1500 });

// ----- mouth -----
addMesh('mouth', 'Tongue', { cls: 'N', step: 0.022, density: 2200 });
addMesh('mouth', ['Soft palate', 'Uvula of palate'], { step: 0.022, density: 2200 });
addMesh('mouth', [
  ...['Upper', 'Lower'].flatMap((jaw) => ['medial incisor', 'lateral incisor', 'canine', 'first premolar', 'second premolar', 'first molar tooth', 'second molar tooth'].flatMap((t) => lr(`${jaw} ${t}`))),
], { step: 0.022, density: 2000 });

// ----- pharynx -----
addMesh('pharynx', 'Nasopharynx', { step: 0.026, density: 2000 });
addMesh('pharynx', ['Oropharynx', 'Laryngopharynx', 'Oesophagus'], { cls: 'N', step: 0.026, density: 2000 });
addMesh('pharynx', lr('Palatine tonsil'), { step: 0.016, density: 6000 });

// ----- larynx and trachea -----
addMesh('larynx', ['Hyoid bone', 'Epiglottis', 'Thyroid cartilage', 'Cricoid cartilage', ...lr('Arytenoid cartilage'), ...lr('Corniculate cartilage')], { cls: 'N', step: 0.02, density: 3200 });
addMesh('larynx', 'Trachea', { cls: 'N', step: 0.024, density: 2600 });

// ----- neck: thyroid gland and lymph nodes -----
// The atlas carries its thyroid high, level with the cricoid. It is lowered a centimetre so the
// isthmus lies over the first rings of the trachea, where it is felt on examination.
const LOW = { shift: [0, -0.011, -0.002] };
addMesh('neck', ['Thyroid gland', ...lr('Superior parathyroid gland'), ...lr('Inferior parathyroid gland')], { cls: 'N', step: 0.02, density: 3200, ...LOW });
const NODES = { step: 0.014, density: 9000 };
addMesh('neck', [
  ...['Jugulodigastric node', 'Lateral superior jugular node', 'Pretracheal nodes', 'Thyroid nodes', 'Anterior inferior jugular nodes',
    'Inferior deep lateral cervical nodes', 'Superficial lateral cervical nodes', 'Supraclavicular nodes', 'Retropharyngeal nodes'].flatMap(lr),
  'Paratracheal cervical nodes', 'Superficial anterior cervical nodes',
], { ...NODES, cls: 'N' });
addMesh('neck', ['Submandibular nodes', 'Submental nodes', 'Mandibular node', 'Bucinator node', 'Pre-auricular nodes', 'Infra-auricular nodes',
  'Superficial parotid nodes', 'Mastoid nodes', 'Occipital nodes'].flatMap(lr), NODES);

// ----- salivary glands and their ducts -----
addMesh('gland', [...lr('Parotid gland'), ...lr('(Accessory parotid gland)'), ...lr('Submandibular gland'), ...lr('Sublingual gland')], { step: 0.022, density: 3600 });
addMesh('gland', [...lr('Parotid duct'), ...lr('Submandibular duct')], { step: 0.016, density: 5000 });

// ----- modelled by hand, in atlas coordinates (metres); s = +1 is the body's left -----
for (const s of [1, -1]) {
  const P = (x, y, z) => [s * x, y, z];
  const bx = (a, b) => [[Math.min(s * a[0], s * b[0]), a[1], a[2]], [Math.max(s * a[0], s * b[0]), b[1], b[2]]];
  const field = (group, a, b, sdf, opts) => addField(group, ...bx(a, b), sdf, opts);
  const EAR = { step: 0.014 };

  // --- ear ---
  // external canal: 2.5 cm, a gentle S that ends on the eardrum, tilted like the drum itself
  const canal = arc(10, (t) => P(0.083 - 0.0335 * t, 1.5815 + 0.0012 * Math.sin(t * Math.PI) - 0.001 * t, -0.0065 + 0.0035 * t + 0.0012 * Math.sin(t * Math.PI * 2)));
  field('ear', [0.047, 1.575, -0.012], [0.086, 1.588, 0.002], (p) => Math.abs(tube(p, canal, 0.0036) + 0.0004) - 0.0004, { ...EAR, count: 200 });
  // eardrum: a thin cone drawn in by the handle of the malleus
  const umbo = P(0.0478, 1.5805, -0.003);
  const drumN = unit(P(1, -0.45, -0.35));
  field('ear', [0.045, 1.575, -0.009], [0.052, 1.587, 0.003], (p) => {
    const q = sub(p, P(0.0492, 1.5808, -0.003));
    const along = dot(q, drumN), r = len(...sub(q, drumN.map((v) => v * along)));
    return Math.max(Math.abs(along + 0.0012 * (1 - r / 0.0046)) - 0.00025, r - 0.0046);
  }, { ...EAR, count: 110 });
  // ossicles: malleus (head, neck, handle), incus (body, short and long limbs), stapes (arch and footplate)
  const malHead = P(0.0475, 1.5848, -0.0038), incBody = P(0.0468, 1.5846, -0.0062), stapHead = P(0.0452, 1.5808, -0.0046), oval = P(0.0422, 1.5808, -0.0044);
  field('ear', [0.041, 1.578, -0.011], [0.05, 1.587, -0.001], (p) => {
    const malleus = smin(ell(p, malHead, [0.0013, 0.0016, 0.0014]), tube(p, [malHead, P(0.0476, 1.5832, -0.0034), umbo], [0.0007, 0.0006, 0.0004]), 0.0008);
    const incus = smin(ell(p, incBody, [0.0013, 0.0015, 0.0017]), Math.min(cap(p, incBody, P(0.0466, 1.5842, -0.0098), 0.0006), tube(p, [incBody, P(0.0458, 1.5822, -0.0054), stapHead], [0.0007, 0.0005, 0.0004])), 0.0008);
    const crura = Math.min(tube(p, [stapHead, P(0.0438, 1.5808, -0.0033), oval.map((v, k) => v + [0, 0, 0.001][k])], 0.00028), tube(p, [stapHead, P(0.0438, 1.5808, -0.0058), oval.map((v, k) => v - [0, 0, 0.001][k])], 0.00028));
    const foot = ell(p, oval, [0.0003, 0.0009, 0.0016]);
    return Math.min(malleus, incus, crura, foot);
  }, { ...EAR, count: 260 });

  // inner ear. Drawn 1.3 times its real size around the vestibule so its parts can be told apart.
  const vest = P(0.0395, 1.5812, -0.0045);
  const big = (q) => vest.map((v, k) => v + (q[k] - v) * 1.3);
  const small = (p) => vest.map((v, k) => v + (p[k] - v) / 1.3);
  // cochlea: two and a half turns that taper to the apex; its axis points forward, out and slightly down
  const axis = unit([0.62, -0.2, 0.76]);
  const e1 = unit(cross(axis, [0, 1, 0])), e2 = cross(axis, e1);
  const base = [0.0362, 1.5800, 0.0006];
  const spiral = arc(120, (t) => {
    const a = t * Math.PI * 5 + 0.6, r = 0.0041 * (1 - 0.7 * t), up = 0.0042 * Math.pow(t, 0.85);
    return P(...[0, 1, 2].map((k) => base[k] + e1[k] * Math.cos(a) * r + e2[k] * Math.sin(a) * r + axis[k] * up));
  });
  const spiralR = spiral.map((_, i) => 0.00115 - 0.0007 * (i / 120));
  const boxOf = (pts, pad) => [[0, 1, 2].map((k) => Math.min(...pts.map((q) => q[k])) - pad), [0, 1, 2].map((k) => Math.max(...pts.map((q) => q[k])) + pad)];
  {
    const [a, b] = boxOf(spiral.map(big), 0.003);
    addField('ear', a, b, (p) => { const q = small(p); return smin(tube(q, spiral, spiralR), cap(q, spiral[0], vest, 0.0011), 0.001) * 1.3; }, { ...EAR, count: 480 });
  }
  // vestibule (utricle and saccule) and the three semicircular canals, each with its ampulla
  const duct = 0.00045;
  const canals = [
    // lateral (horizontal), tilted 30 degrees back
    { c: P(0.0428, 1.5832, -0.0072), n: unit(P(0.1, 0.87, 0.5)), R: 0.0031, amp: P(0.0432, 1.5822, -0.0042) },
    // anterior (superior), 45 degrees to the midline
    { c: P(0.0402, 1.5858, -0.0052), n: unit(P(0.7, 0, 0.7)), R: 0.0036, amp: P(0.0424, 1.5838, -0.003) },
    // posterior, at a right angle to it
    { c: P(0.0398, 1.5836, -0.0096), n: unit(P(0.7, 0, -0.7)), R: 0.0034, amp: P(0.0412, 1.5802, -0.0078) },
  ];
  {
    const pts = [vest, ...canals.flatMap((c) => [0, 1, 2].flatMap((k) => [-1, 1].map((d) => c.c.map((v, i) => v + (i === k ? d * c.R : 0)))))].map(big);
    const [a, b] = boxOf(pts, 0.003);
    addField('ear', a, b, (p) => {
      const q = small(p);
      let d = smin(ell(q, vest, [0.0019, 0.0026, 0.0022]), ell(q, P(0.0388, 1.5796, -0.0032), [0.0014, 0.0016, 0.0015]), 0.001);
      for (const c of canals) d = smin(d, Math.min(torus(q, c.c, c.n, c.R, duct), ell(q, c.amp, [0.0009, 0.0009, 0.0009])), 0.0006);
      return d * 1.3;
    }, { ...EAR, count: 620 });
  }
  // cochlear and vestibular nerves running in through the internal acoustic canal
  field('ear', [0.018, 1.577, -0.008], [0.04, 1.586, 0.006], (p) => Math.min(
    tube(p, [P(0.0365, 1.5812, 0.0018), P(0.03, 1.582, 0.0005), P(0.0215, 1.5825, -0.0015)], [0.0009, 0.0011, 0.0012]),
    tube(p, [P(0.038, 1.5822, -0.0035), P(0.03, 1.5835, -0.002), P(0.0215, 1.584, -0.0035)], [0.0008, 0.001, 0.0011]),
  ), { ...EAR, count: 130 });
  // Eustachian tube: from the front of the middle ear down, forward and in to the side wall of the nasopharynx
  const eus = arc(10, (t) => P(0.0462 - 0.0302 * t, 1.5795 - 0.0085 * t - 0.001 * Math.sin(t * Math.PI), 0.0005 + 0.0285 * t));
  field('ear', [0.013, 1.566, -0.002], [0.049, 1.582, 0.033], (p) => Math.abs(tube(p, eus, arc(10, (t) => 0.001 + 0.0012 * t * t)) + 0.0003) - 0.0003, { ...EAR, count: 200 });

  // --- maxillary sinus ---
  // A pyramid inside the body of the maxilla: its base on the side wall of the nose, its apex in
  // the cheekbone, the floor of the orbit for a roof and the roots of the molars under its floor.
  field('sinus', [0.012, 1.551, 0.045], [0.041, 1.585, 0.08], (p) => {
    const q = [s * p[0], p[1], p[2]];
    const d = [
      plane(q, [-1, 0, 0], -0.0145), // side wall of the nose
      plane(q, [0.2, 1, 0], 0.2 * 0.0145 + 1.5825), // floor of the orbit
      plane(q, [0.45, -1, 0], 0.45 * 0.02 - 1.555), // floor, over the molars
      plane(q, [0.45, 0, 1], 0.45 * 0.0145 + 0.0775), // front wall
      plane(q, [0.3, 0, -1], 0.3 * 0.0145 - 0.047), // back wall
      plane(q, [1, 0, 0], 0.039), // apex in the cheekbone
    ].reduce((a, b) => smax(a, b, 0.005));
    return d + lobes(p, 420, 0.0004);
  }, { step: 0.022, count: 900 });

  // --- vocal folds and vestibular folds, from the arytenoids forward to the angle of the thyroid cartilage ---
  field('larynx', [0, 1.474, 0.004], [0.009, 1.486, 0.027], (p) => Math.min(
    tube(p, [P(0.0048, 1.4772, 0.0085), P(0.0026, 1.4775, 0.017), P(0.0007, 1.478, 0.0245)], [0.0013, 0.0012, 0.0009]),
    tube(p, [P(0.0062, 1.4812, 0.0095), P(0.004, 1.4815, 0.017), P(0.0015, 1.482, 0.0235)], [0.0011, 0.001, 0.0008]),
  ), { cls: 'N', step: 0.012, count: 130 });
}

// adenoids: a ridged pad of lymphoid tissue on the roof and back wall of the nasopharynx
addField('pharynx', [-0.011, 1.578, 0.008], [0.011, 1.592, 0.024], (p) =>
  ell(p, [0, 1.5865, 0.0155], [0.008, 0.0036, 0.006]) + 0.0005 * Math.sin(p[0] * 1500), { step: 0.016, count: 200 });

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
