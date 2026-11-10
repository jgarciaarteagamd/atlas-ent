// Extracts the head and neck structures the hologram uses from the Z-Anatomy
// atlas into assets/atlas.glb (plain, uncompressed GLB: one node per structure).
// Only needed again if the list of structures changes.
//
//   git clone --depth 1 https://github.com/nqwrc/3d-anatomy
//   npm install --no-save @gltf-transform/core @gltf-transform/extensions draco3d
//   node scripts/extract-atlas.mjs 3d-anatomy/public/models assets/atlas.glb
//
// Source: Z-Anatomy (CC BY-SA 4.0), itself derived from BodyParts3D
// (CC BY-SA 2.1 Japan). The parts of that atlas under a non-commercial licence
// (inner ear, kidney) are not used; the ossicles are left out too because their
// origin is unclear. See assets/ATLAS-LICENSE.md.

import { writeFileSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import draco3d from 'draco3d';

const [dir, output] = process.argv.slice(2);
if (!dir || !output) {
  console.error('usage: node scripts/extract-atlas.mjs <dir with skeletal.glb, visceral.glb, lymphatic.glb> <out.glb>');
  process.exit(1);
}

const KEEP = {
  skeletal: [
    /^(Frontal|Occipital|Sphenoid|Ethmoid|Hyoid) bone$/, /^(Parietal|Temporal|Zygomatic|Lacrimal|Nasal|Palatine|Inferior nasal concha) bone\.[lr]$/,
    /^Maxilla\.[lr]$/, /^Mandible$/, /^Vomer$/, /^Sinus of (frontal|sphenoid) bone$/, /cells of ethmoid bone\.[lr]$/,
    /^(Arytenoid|Corniculate) cartilage\.[lr]$/, /^(Cricoid|Thyroid|Nasal septal) cartilage$/,
    /^(Lateral process of nasal septal cartilage|Major alar cartilage)\.[lr]$/,
    /(incisor|canine|premolar|molar tooth)\.[lr]$/, /^Atlas \(C1\)$/, /^Axis \(C2\)$/, /^Vertebra (C[3-7]|T1)$/,
  ],
  visceral: [
    /^Gingiva$/, /^\(?(Accessory parotid|Parotid|Sublingual|Submandibular) (gland|duct)\)?\.[lr]$/, /^Soft palate$/, /^Tongue$/, /^Uvula of palate$/,
    /^(Laryngo|Naso|Oro)pharynx$/, /^Thyroid gland$/, /^(Inferior|Superior) parathyroid gland\.[lr]$/, /^Epiglottis$/,
    /^Mucosa of nasal cavity$/, /^Trachea$/, /^Oesophagus$/,
  ],
  lymphatic: [
    /^(Infra-auricular|Intraglandular parotid|Pre-auricular|Mastoid|Occipital|Superficial parotid|Retropharyngeal|Submandibular|Submental|Supraclavicular) nodes\.[lr]$/,
    /^(Bucinator|Mandibular|Nasolabial|Jugulodigastric|Lateral superior jugular) node\.[lr]$/,
    /^(Pretracheal|Thyroid|Anterior inferior jugular|Inferior deep lateral cervical|Superficial lateral cervical) nodes\.[lr]$/,
    /^(Paratracheal cervical|Superficial anterior cervical) nodes$/, /^Palatine tonsil\.[lr]$/,
  ],
};
// The trachea and the oesophagus run down into the chest; keep the neck part.
const FLOOR_Y = 1.37;

const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression, KHRMeshQuantization])
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const parts = [];
for (const [file, patterns] of Object.entries(KEEP)) {
  const doc = await io.read(`${dir}/${file}.glb`);
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const name = node.getExtras().za_name || node.getName();
    if (!patterns.some((re) => re.test(name))) continue;
    const m = node.getWorldMatrix();
    const weld = new Map(), pos = [], idx = [];
    for (const prim of mesh.listPrimitives()) {
      const P = prim.getAttribute('POSITION'), I = prim.getIndices();
      const v = [0, 0, 0], local = [];
      for (let i = 0; i < P.getCount(); i++) {
        P.getElement(i, v);
        const p = [0, 1, 2].map((k) => m[k] * v[0] + m[4 + k] * v[1] + m[8 + k] * v[2] + m[12 + k]);
        const key = p.map((c) => Math.round(c * 1e5)).join(',');
        let id = weld.get(key);
        if (id === undefined) { id = pos.length / 3; weld.set(key, id); pos.push(...p); }
        local.push(id);
      }
      const n = I ? I.getCount() : P.getCount();
      for (let i = 0; i < n; i += 3) {
        const t = [0, 1, 2].map((k) => local[I ? I.getScalar(i + k) : i + k]);
        if (t[0] === t[1] || t[1] === t[2] || t[0] === t[2]) continue;
        if (t.every((id) => pos[id * 3 + 1] < FLOOR_Y)) continue;
        idx.push(...t);
      }
    }
    // drop vertices no triangle uses any more
    const used = new Map(), P2 = [];
    const I2 = idx.map((id) => {
      if (!used.has(id)) { used.set(id, P2.length / 3); P2.push(pos[id * 3], pos[id * 3 + 1], pos[id * 3 + 2]); }
      return used.get(id);
    });
    parts.push({ name, pos: Float32Array.from(P2), idx: Uint32Array.from(I2) });
  }
}
parts.sort((a, b) => a.name.localeCompare(b.name));

// ---------- write a plain GLB ----------
const json = {
  asset: {
    version: '2.0',
    generator: 'atlas-ent scripts/extract-atlas.mjs',
    copyright: 'Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0; BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan',
  },
  scene: 0, scenes: [{ nodes: parts.map((_, i) => i) }],
  nodes: [], meshes: [], accessors: [], bufferViews: [], buffers: [],
};
const chunks = [];
let offset = 0;
const view = (arr, target) => {
  const bytes = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target });
  chunks.push(bytes); offset += bytes.length;
  return json.bufferViews.length - 1;
};
parts.forEach((p, i) => {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < p.pos.length; k++) { min[k % 3] = Math.min(min[k % 3], p.pos[k]); max[k % 3] = Math.max(max[k % 3], p.pos[k]); }
  json.accessors.push({ bufferView: view(p.pos, 34962), componentType: 5126, count: p.pos.length / 3, type: 'VEC3', min, max });
  json.accessors.push({ bufferView: view(p.idx, 34963), componentType: 5125, count: p.idx.length, type: 'SCALAR' });
  json.meshes.push({ primitives: [{ attributes: { POSITION: i * 2 }, indices: i * 2 + 1 }] });
  json.nodes.push({ name: p.name, mesh: i });
});
json.buffers.push({ byteLength: offset });
let jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20)]);
const bin = Buffer.concat(chunks);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonBytes.length + 8 + bin.length, 8);
const chunkHead = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
writeFileSync(output, Buffer.concat([header, chunkHead(jsonBytes.length, 0x4e4f534a), jsonBytes, chunkHead(bin.length, 0x004e4942), bin]));
const tris = parts.reduce((s, p) => s + p.idx.length / 3, 0);
console.log(`wrote ${output}: ${parts.length} structures, ${tris} triangles, ${((20 + jsonBytes.length + 8 + bin.length) / 1048576).toFixed(1)} MB`);
