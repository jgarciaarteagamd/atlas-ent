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
const SLICE_STEP = 0.05;
const MERIDIANS = 12;
const RESAMPLE = 0.012;
const POINTS = 9000;
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
      point.set(key, [
        V[a * 3] + (V[b * 3] - V[a * 3]) * t,
        V[a * 3 + 1] + (V[b * 3 + 1] - V[a * 3 + 1]) * t,
        V[a * 3 + 2] + (V[b * 3 + 2] - V[a * 3 + 2]) * t,
      ]);
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
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
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
  total += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
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
  for (let k = 0; k < 3; k++) points.push(V[a * 3 + k] + (V[b * 3 + k] - V[a * 3 + k]) * u + (V[c * 3 + k] - V[a * 3 + k]) * v);
}

// ---------- write ----------
// header: 'ATL1', polyline count, polyline point count, surface point count
// then uint32 counts[], uint8 kinds[] (padded to 2 bytes), int16 polyline xyz, int16 point xyz
const nLines = polylines.length;
const nPolyPts = polylines.reduce((s, p) => s + p.l.length, 0);
const nPts = points.length / 3;
const kindsBytes = nLines + (nLines % 2);
const size = 16 + nLines * 4 + kindsBytes + nPolyPts * 6 + nPts * 6;
const out = Buffer.alloc(size);
let o = 0;
out.write('ATL1', 0, 'ascii'); o = 4;
out.writeUInt32LE(nLines, o); o += 4;
out.writeUInt32LE(nPolyPts, o); o += 4;
out.writeUInt32LE(nPts, o); o += 4;
for (const p of polylines) { out.writeUInt32LE(p.l.length, o); o += 4; }
for (const p of polylines) out.writeUInt8(p.kind, o++);
o += nLines % 2;
const q = (v) => Math.max(-32767, Math.min(32767, Math.round(v * QUANT)));
for (const p of polylines) for (const pt of p.l) for (const v of pt) { out.writeInt16LE(q(v), o); o += 2; }
for (const v of points) { out.writeInt16LE(q(v), o); o += 2; }
writeFileSync(output, out);
console.log(`wrote ${output}: ${nLines} polylines, ${nPolyPts} line points, ${nPts} surface points, ${(size / 1024).toFixed(0)} KB`);
