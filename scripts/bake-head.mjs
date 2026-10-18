// Bakes the head mesh (GLB) into the compact binary the hologram draws:
// horizontal laser slices, vertical meridians and a surface point cloud.
//
//   node scripts/bake-head.mjs assets/head.glb public/holo/head.bin
//
// The mesh is normalised to the hologram frame: y up, face towards +z,
// base of the neck at y = -1.75 and top of the skull at y = 1.25.

import { readFileSync, writeFileSync } from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node scripts/bake-head.mjs <in.glb> <out.bin>');
  process.exit(1);
}

const HEIGHT = 3.0;
const BASE_Y = -1.75;
const SLICE_STEP = 0.032;
const MERIDIANS = 16;
const RESAMPLE = 0.018;
const POINTS = 40000;
const QUANT = 32767 / 2; // positions are stored as int16 in [-2, 2]

// ---------- read GLB ----------
function readGlb(path) {
  const buf = readFileSync(path);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen + 8;
  const view = (accessorIndex) => {
    const acc = json.accessors[accessorIndex];
    const bv = json.bufferViews[acc.bufferView];
    const offset = binStart + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const comps = { SCALAR: 1, VEC3: 3 }[acc.type];
    const Ctor = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[acc.componentType];
    const slice = buf.buffer.slice(buf.byteOffset + offset, buf.byteOffset + offset + acc.count * comps * Ctor.BYTES_PER_ELEMENT);
    return new Ctor(slice);
  };
  const prim = json.meshes[0].primitives[0];
  const pos = view(prim.attributes.POSITION);
  const idx = prim.indices !== undefined ? view(prim.indices) : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
  return { pos, idx };
}

const { pos: rawPos, idx: rawIdx } = readGlb(input);

// ---------- normalise ----------
let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < rawPos.length; i += 3) for (let k = 0; k < 3; k++) {
  min[k] = Math.min(min[k], rawPos[i + k]); max[k] = Math.max(max[k], rawPos[i + k]);
}
const scale = HEIGHT / (max[1] - min[1]);
const cx = (min[0] + max[0]) / 2;

// weld duplicated vertices so neighbouring triangles share edges
const keyOf = (x, y, z) => `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
const weld = new Map();
const verts = [];
const remap = new Uint32Array(rawPos.length / 3);
for (let i = 0; i < rawPos.length / 3; i++) {
  const x = (rawPos[i * 3] - cx) * scale;
  const y = (rawPos[i * 3 + 1] - min[1]) * scale + BASE_Y;
  const z = rawPos[i * 3 + 2] * scale;
  const k = keyOf(x, y, z);
  let id = weld.get(k);
  if (id === undefined) { id = verts.length / 3; weld.set(k, id); verts.push(x, y, z); }
  remap[i] = id;
}
const V = Float32Array.from(verts);
const nV = V.length / 3;
const T = Uint32Array.from(rawIdx, (i) => remap[i]);
console.log(`mesh: ${nV} vertices, ${T.length / 3} triangles`);

// smooth vertex normals (area weighted), used to light the hologram
const N = new Float32Array(nV * 3);
for (let t = 0; t < T.length; t += 3) {
  const [a, b, c] = [T[t], T[t + 1], T[t + 2]];
  const ux = V[b * 3] - V[a * 3], uy = V[b * 3 + 1] - V[a * 3 + 1], uz = V[b * 3 + 2] - V[a * 3 + 2];
  const vx = V[c * 3] - V[a * 3], vy = V[c * 3 + 1] - V[a * 3 + 1], vz = V[c * 3 + 2] - V[a * 3 + 2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  for (const i of [a, b, c]) { N[i * 3] += nx; N[i * 3 + 1] += ny; N[i * 3 + 2] += nz; }
}
// make sure normals point outwards: most of the surface faces away from the centre axis
let outward = 0;
for (let i = 0; i < nV; i++) outward += N[i * 3] * V[i * 3] + N[i * 3 + 2] * V[i * 3 + 2];
const flip = outward < 0 ? -1 : 1;
for (let i = 0; i < nV; i++) {
  const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1;
  for (let k = 0; k < 3; k++) N[i * 3 + k] = (N[i * 3 + k] / l) * flip;
}
const lerp3 = (A, a, b, t) => [0, 1, 2].map((k) => A[a * 3 + k] + (A[b * 3 + k] - A[a * 3 + k]) * t);

// Facial detail: umbrella-Laplacian curvature picks out eyelids, brows,
// nostrils, lips and ear folds. Stored as 0..1 "feature" strength.
const sum = new Float64Array(nV * 3), deg = new Float64Array(nV);
for (let t = 0; t < T.length; t += 3) {
  for (let e = 0; e < 3; e++) {
    const a = T[t + e], b = T[t + ((e + 1) % 3)];
    for (const [i, j] of [[a, b], [b, a]]) {
      sum[i * 3] += V[j * 3]; sum[i * 3 + 1] += V[j * 3 + 1]; sum[i * 3 + 2] += V[j * 3 + 2]; deg[i]++;
    }
  }
}
let curv = new Float64Array(nV);
for (let i = 0; i < nV; i++) {
  let d = 0;
  for (let k = 0; k < 3; k++) d += (sum[i * 3 + k] / deg[i] - V[i * 3 + k]) * N[i * 3 + k];
  curv[i] = d;
}
for (let it = 0; it < 2; it++) {
  const acc = new Float64Array(nV);
  for (let t = 0; t < T.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = T[t + e], b = T[t + ((e + 1) % 3)];
      acc[a] += curv[b]; acc[b] += curv[a];
    }
  }
  curv = curv.map((c, i) => 0.5 * c + (0.5 * acc[i]) / deg[i]);
}
const sorted = Float64Array.from(curv, Math.abs).sort();
const ref = sorted[Math.floor(sorted.length * 0.97)] || 1;
const F = Float32Array.from(curv, (c) => Math.min(1, Math.abs(c) / ref));
const lerp1 = (A, a, b, t) => A[a] + (A[b] - A[a]) * t;

// ---------- planar sections ----------
function section(fn) {
  const d = new Float64Array(nV);
  for (let i = 0; i < nV; i++) d[i] = fn(V[i * 3], V[i * 3 + 1], V[i * 3 + 2]) || 1e-12;
  const point = new Map();
  const adj = new Map();
  const edgePoint = (a, b) => {
    if (a > b) [a, b] = [b, a];
    const key = a * nV + b;
    if (!point.has(key)) {
      const t = d[a] / (d[a] - d[b]);
      point.set(key, [...lerp3(V, a, b, t), ...lerp3(N, a, b, t), lerp1(F, a, b, t)]);
    }
    return key;
  };
  const link = (p, q) => {
    if (!adj.has(p)) adj.set(p, []);
    if (!adj.has(q)) adj.set(q, []);
    adj.get(p).push(q); adj.get(q).push(p);
  };
  for (let t = 0; t < T.length; t += 3) {
    const tri = [T[t], T[t + 1], T[t + 2]];
    const hits = [];
    for (let e = 0; e < 3; e++) {
      const a = tri[e], b = tri[(e + 1) % 3];
      if ((d[a] < 0) !== (d[b] < 0)) hits.push(edgePoint(a, b));
    }
    if (hits.length === 2) link(hits[0], hits[1]);
  }
  // walk the graph into polylines, open chains first
  const seen = new Set();
  const lines = [];
  const walk = (start) => {
    const chain = [start];
    seen.add(start);
    let cur = start;
    for (;;) {
      const next = adj.get(cur).find((n) => !seen.has(n));
      if (next === undefined) break;
      seen.add(next); chain.push(next); cur = next;
    }
    if (adj.get(cur).includes(start) && chain.length > 2) chain.push(start);
    return chain.map((k) => point.get(k));
  };
  for (const [k, n] of adj) if (n.length === 1 && !seen.has(k)) lines.push(walk(k));
  for (const k of adj.keys()) if (!seen.has(k)) lines.push(walk(k));
  return lines.map(resample).filter((l) => l.length >= 4);
}

function resample(line) {
  const out = [line[0]];
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    let s = RESAMPLE - carry;
    while (s <= len) {
      const t = s / len;
      out.push(a.map((v, k) => v + (b[k] - v) * t));
      s += RESAMPLE;
    }
    carry = len - (s - RESAMPLE);
  }
  out.push(line[line.length - 1]);
  return out;
}

const polylines = [];
for (let y = BASE_Y + 0.03; y < BASE_Y + HEIGHT - 0.01; y += SLICE_STEP) {
  for (const l of section((px, py) => py - y)) polylines.push({ kind: 0, l });
}
for (let k = 0; k < MERIDIANS; k++) {
  const a = (k / MERIDIANS) * Math.PI;
  const nx = -Math.sin(a), nz = Math.cos(a);
  for (const l of section((px, py, pz) => px * nx + pz * nz)) polylines.push({ kind: 1, l });
}

// ---------- surface points, area weighted ----------
const areas = new Float64Array(T.length / 3);
let total = 0;
for (let t = 0; t < T.length; t += 3) {
  const [a, b, c] = [T[t], T[t + 1], T[t + 2]];
  const ux = V[b * 3] - V[a * 3], uy = V[b * 3 + 1] - V[a * 3 + 1], uz = V[b * 3 + 2] - V[a * 3 + 2];
  const vx = V[c * 3] - V[a * 3], vy = V[c * 3 + 1] - V[a * 3 + 1], vz = V[c * 3 + 2] - V[a * 3 + 2];
  const feature = (F[a] + F[b] + F[c]) / 3;
  total += (Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2) * (1 + 3 * feature);
  areas[t / 3] = total;
}
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const points = [];
for (let n = 0; n < POINTS; n++) {
  const r = rand() * total;
  let lo = 0, hi = areas.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (areas[mid] < r) lo = mid + 1; else hi = mid; }
  const [a, b, c] = [T[lo * 3], T[lo * 3 + 1], T[lo * 3 + 2]];
  let u = rand(), v = rand();
  if (u + v > 1) { u = 1 - u; v = 1 - v; }
  const p = [0, 1, 2].map((k) => V[a * 3 + k] + (V[b * 3 + k] - V[a * 3 + k]) * u + (V[c * 3 + k] - V[a * 3 + k]) * v);
  const nn = [0, 1, 2].map((k) => N[a * 3 + k] + (N[b * 3 + k] - N[a * 3 + k]) * u + (N[c * 3 + k] - N[a * 3 + k]) * v);
  if (p[1] < BASE_Y + 0.05 && nn[1] < -0.7) continue; // flat cut under the neck
  points.push(...p, ...nn, F[a] + (F[b] - F[a]) * u + (F[c] - F[a]) * v);
}

// ---------- write ----------
// header: 'ATL3', polyline count, polyline point count, surface point count
// then uint32 counts[], uint8 kinds[] (padded to 2 bytes),
// int16 polyline xyz, int16 point xyz, int8 polyline normals, int8 point normals,
// uint8 polyline feature, uint8 point feature
const nLines = polylines.length;
const nPolyPts = polylines.reduce((s, p) => s + p.l.length, 0);
const nPts = points.length / 7;
const kindsBytes = nLines + (nLines % 2);
const size = 16 + nLines * 4 + kindsBytes + nPolyPts * 10 + nPts * 10;
const out = Buffer.alloc(size);
let o = 0;
out.write('ATL3', 0, 'ascii'); o = 4;
out.writeUInt32LE(nLines, o); o += 4;
out.writeUInt32LE(nPolyPts, o); o += 4;
out.writeUInt32LE(nPts, o); o += 4;
for (const p of polylines) { out.writeUInt32LE(p.l.length, o); o += 4; }
for (const p of polylines) out.writeUInt8(p.kind, o++);
o += nLines % 2;
const q = (v) => Math.max(-32767, Math.min(32767, Math.round(v * QUANT)));
const qn = (v) => Math.max(-127, Math.min(127, Math.round(v * 127)));
for (const p of polylines) for (const pt of p.l) for (let k = 0; k < 3; k++) { out.writeInt16LE(q(pt[k]), o); o += 2; }
for (let i = 0; i < nPts; i++) for (let k = 0; k < 3; k++) { out.writeInt16LE(q(points[i * 7 + k]), o); o += 2; }
for (const p of polylines) for (const pt of p.l) for (let k = 3; k < 6; k++) out.writeInt8(qn(pt[k]), o++);
for (let i = 0; i < nPts; i++) for (let k = 3; k < 6; k++) out.writeInt8(qn(points[i * 7 + k]), o++);
const qf = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
for (const p of polylines) for (const pt of p.l) out.writeUInt8(qf(pt[6]), o++);
for (let i = 0; i < nPts; i++) out.writeUInt8(qf(points[i * 7 + 6]), o++);
writeFileSync(output, out);
console.log(`wrote ${output}: ${nLines} polylines, ${nPolyPts} line points, ${nPts} surface points, ${(size / 1024).toFixed(0)} KB`);
