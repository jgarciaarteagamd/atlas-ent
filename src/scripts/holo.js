// Holographic head: laser slices, meridians and a twinkling point cloud baked
// from the head mesh (src/assets/head.bin), plus stylised inner anatomy that
// lights up for the zone under the pointer or the selected zone.

import * as THREE from 'three';

const MAXH = 4; // hit spheres per zone

// ---------- head data ----------
async function loadHead(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`head data ${res.status}`);
  const buf = await res.arrayBuffer();
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== 'ATL3') throw new Error('bad head data');
  const nLines = dv.getUint32(4, true), nPolyPts = dv.getUint32(8, true), nPts = dv.getUint32(12, true);
  let o = 16;
  const counts = new Uint32Array(buf.slice(o, o + nLines * 4)); o += nLines * 4;
  const kinds = new Uint8Array(buf, o, nLines); o += nLines + (nLines % 2);
  const deq = (n) => {
    const q = new Int16Array(buf.slice(o, o + n * 6)); o += n * 6;
    const f = new Float32Array(q.length);
    for (let i = 0; i < q.length; i++) f[i] = q[i] * (2 / 32767);
    return f;
  };
  const poly = deq(nPolyPts);
  const pts = deq(nPts);
  const nrm = (n) => {
    const q = new Int8Array(buf.slice(o, o + n * 3)); o += n * 3;
    return Float32Array.from(q, (v) => v / 127);
  };
  const polyN = nrm(nPolyPts);
  const ptsN = nrm(nPts);
  const feat = (n) => {
    const q = new Uint8Array(buf.slice(o, o + n)); o += n;
    return Float32Array.from(q, (v) => v / 255);
  };
  const polyF = feat(nPolyPts);
  const ptsF = feat(nPts);

  // polylines -> segment pairs, keeping the slice/meridian kind per vertex
  let nSeg = 0;
  for (const c of counts) nSeg += c - 1;
  const seg = new Float32Array(nSeg * 6);
  const segN = new Float32Array(nSeg * 6);
  const segKind = new Float32Array(nSeg * 2);
  const segF = new Float32Array(nSeg * 2);
  let p = 0, s = 0;
  for (let l = 0; l < nLines; l++) {
    for (let i = 0; i < counts[l] - 1; i++) {
      seg.set(poly.subarray((p + i) * 3, (p + i) * 3 + 6), s * 6);
      segN.set(polyN.subarray((p + i) * 3, (p + i) * 3 + 6), s * 6);
      segKind[s * 2] = segKind[s * 2 + 1] = kinds[l];
      segF[s * 2] = polyF[p + i];
      segF[s * 2 + 1] = polyF[p + i + 1];
      s++;
    }
    p += counts[l];
  }
  return { seg, segN, segKind, segF, pts, ptsN, ptsF };
}

// ---------- inner anatomy (stylised, in the mesh frame) ----------
function ring(out, cx, cy, cz, rx, rz, n = 40, plane = 'xz') {
  for (let i = 0; i < n; i++) {
    for (const t of [(i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2]) {
      if (plane === 'xz') out.push(cx + Math.cos(t) * rx, cy, cz + Math.sin(t) * rz);
      else if (plane === 'xy') out.push(cx + Math.cos(t) * rx, cy + Math.sin(t) * rz, cz);
      else out.push(cx, cy + Math.cos(t) * rx, cz + Math.sin(t) * rz);
    }
  }
}
function ellWire(out, cx, cy, cz, rx, ry, rz, lat = 6) {
  for (let k = 1; k < lat; k++) {
    const phi = -Math.PI / 2 + (k * Math.PI) / lat;
    ring(out, cx, cy + Math.sin(phi) * ry, cz, Math.cos(phi) * rx, Math.cos(phi) * rz, 28);
  }
  ring(out, cx, cy, cz, rx, ry, 28, 'xy');
}
function path(out, pts) {
  for (let i = 0; i < pts.length - 1; i++) out.push(...pts[i], ...pts[i + 1]);
}

function buildAnatomy() {
  const a = { ear: [], sinus: [], mouth: [], pharynx: [], larynx: [], neck: [], gland: [] };
  for (const s of [1, -1]) {
    // ear canal, cochlea and semicircular canals
    path(a.ear, Array.from({ length: 11 }, (_, i) => [s * (0.86 - 0.2 * (i / 10)), 0.03 - 0.01 * (i / 10), -0.24 + 0.04 * (i / 10)]));
    const spiral = [];
    for (let i = 0; i <= 90; i++) {
      const t = (i / 90) * Math.PI * 5, r = 0.06 * (1 - i / 105);
      spiral.push([s * (0.6 - (i / 90) * 0.04), Math.sin(t) * r, -0.12 + Math.cos(t) * r]);
    }
    path(a.ear, spiral);
    ring(a.ear, s * 0.63, 0.11, -0.24, 0.045, 0.045, 24, 'xz');
    ring(a.ear, s * 0.63, 0.11, -0.24, 0.045, 0.045, 24, 'xy');
    ring(a.ear, s * 0.63, 0.11, -0.24, 0.045, 0.045, 24, 'yz');
    // maxillary and frontal sinuses
    ellWire(a.sinus, s * 0.28, -0.12, 0.6, 0.12, 0.13, 0.14, 5);
    ellWire(a.sinus, s * 0.11, 0.36, 0.64, 0.05, 0.09, 0.06, 4);
    // salivary glands: parotid, submandibular, sublingual
    ellWire(a.gland, s * 0.66, -0.28, -0.02, 0.09, 0.22, 0.17, 6);
    ellWire(a.gland, s * 0.38, -0.95, 0.28, 0.12, 0.07, 0.13, 5);
    ellWire(a.gland, s * 0.14, -0.78, 0.55, 0.05, 0.03, 0.12, 3);
    // thyroid lobes and the lymph node chain along the side of the neck
    ellWire(a.neck, s * 0.14, -1.48, 0.16, 0.07, 0.13, 0.07, 5);
    for (let k = 0; k < 6; k++) {
      const t = k / 5;
      ellWire(a.neck, s * (0.55 - 0.13 * t), -0.72 - 0.85 * t, -0.2 + 0.2 * t, 0.03, 0.04, 0.03, 3);
    }
    // palatine tonsils
    ellWire(a.pharynx, s * 0.11, -0.55, 0.32, 0.04, 0.07, 0.04, 4);
  }
  for (let k = 0; k < 4; k++) ring(a.neck, 0, -1.48, 0.22, 0.04 * (1 - k / 4), 0.02, 16, 'xy');
  // nasal septum
  for (let k = 0; k < 7; k++) ring(a.sinus, 0, 0.08 - k * 0.05, 0.72, 0.01, 0.2, 20, 'yz');
  // tongue and dental arch
  ellWire(a.mouth, 0, -0.56, 0.52, 0.17, 0.07, 0.27, 5);
  const arch = [];
  for (let i = 0; i <= 40; i++) {
    const t = Math.PI * (i / 40);
    arch.push([Math.cos(t) * 0.24, -0.47, 0.5 + Math.sin(t) * 0.33]);
  }
  path(a.mouth, arch);
  path(a.mouth, arch.map(([x, y, z]) => [x, y - 0.1, z - 0.01]));
  // pharynx: from the nasopharynx down behind the tongue to the hypopharynx
  for (let k = 0; k <= 16; k++) {
    const t = k / 16;
    ring(a.pharynx, 0, -0.1 - t * 0.95, 0.16 - t * 0.1 + Math.sin(t * Math.PI) * 0.05, 0.15 - 0.04 * t, 0.09, 30);
  }
  // larynx: thyroid cartilage shield, vocal folds and trachea
  for (let k = 0; k <= 8; k++) {
    const y = -1.04 - k * 0.04, w = 0.17 - k * 0.006;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const ang = Math.PI * (0.05 + (0.9 * i) / 24);
      const sharp = Math.pow(Math.abs(Math.cos(ang)), 0.7) * Math.sign(Math.cos(ang));
      pts.push([sharp * w, y, 0.1 + Math.sin(ang) * (0.17 - k * 0.004) + (1 - Math.abs(Math.cos(ang))) * 0.03]);
    }
    path(a.larynx, pts);
  }
  a.larynx.push(0, -1.2, 0.28, 0.07, -1.2, 0.02, 0, -1.2, 0.28, -0.07, -1.2, 0.02);
  for (let k = 0; k < 7; k++) ring(a.larynx, 0, -1.42 - k * 0.05, 0.08, 0.1, 0.1, 30);
  return a;
}

// ---------- shaders ----------
const common = `
  uniform float uTime, uScan, uHotR, uHotK, uSelR, uSelK, uPx;
  uniform vec3 uHot[${MAXH}], uSel[${MAXH}];
  float near(vec3 p, vec3 c[${MAXH}], float r) {
    float m = 0.0;
    for (int i = 0; i < ${MAXH}; i++) m = max(m, 1.0 - smoothstep(r * 0.55, r, distance(p, c[i])));
    return m;
  }`;

const lighting = `
  // Key light from the upper left, a soft rim, and surfaces facing away
  // from the viewer fade so the back of the head does not cross the face.
  float shade(vec3 n, out float front) {
    vec3 nv = normalize(normalMatrix * n);
    front = smoothstep(-0.2, 0.35, nv.z);
    float key = max(dot(nv, normalize(vec3(-0.45, 0.55, 0.75))), 0.0);
    float fill = max(dot(nv, normalize(vec3(0.6, -0.1, 0.6))), 0.0);
    float rim = pow(1.0 - clamp(nv.z, 0.0, 1.0), 2.5);
    return (0.08 + 0.95 * key * key + 0.25 * fill) * mix(0.1, 1.0, front) + rim * 0.45 * front;
  }
  float base(vec3 p) { return smoothstep(-1.78, -1.35, p.y); }`;

const lineVS = `${common}${lighting}
  attribute float kind;
  attribute float feature;
  varying float vHot, vSel, vScan, vDepth, vKind, vLight, vFront;
  void main() {
    vKind = kind;
    vLight = (shade(normal, vFront) + feature * 1.1 * vFront) * base(position);
    vHot = near(position, uHot, uHotR) * uHotK;
    vSel = near(position, uSel, uSelR) * uSelK;
    vScan = exp(-abs(position.y - uScan) * 14.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = smoothstep(-8.3, -5.5, mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const lineFS = `${common}
  varying float vHot, vSel, vScan, vDepth, vKind, vLight, vFront;
  void main() {
    vec3 holo = vec3(0.45, 0.94, 1.0);
    vec3 flare = vec3(1.0, 0.77, 0.42);
    vec3 col = holo * (0.6 + vScan * 1.2);
    col = mix(col, vec3(0.85, 1.0, 1.0), vHot * 0.8);
    col = mix(col, flare, vSel);
    float strength = mix(0.55, 0.2, vKind);
    float a = strength * vLight + (vScan * 0.3 * (1.0 - vKind * 0.6) + vHot * 0.45 + vSel * 0.55) * (0.3 + 0.7 * vFront);
    gl_FragColor = vec4(col, a);
  }`;
const pointVS = `${common}${lighting}
  attribute float seed;
  attribute float feature;
  varying float vA, vSel;
  void main() {
    float hot = near(position, uHot, uHotR) * uHotK;
    vSel = near(position, uSel, uSelR) * uSelK;
    float tw = 0.5 + 0.5 * sin(uTime * (1.5 + seed * 3.0) + seed * 40.0);
    float scan = exp(-abs(position.y - uScan) * 10.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float front;
    float light = (shade(normal, front) + feature * 1.3 * front) * base(position);
    vA = light * (0.55 + 0.45 * tw) + (scan * 0.5 + hot * 0.5 + vSel * 0.5) * front;
    gl_PointSize = (1.1 + feature * 0.6 * front + scan * 1.2 + (hot + vSel) * 0.9) * uPx;
    gl_Position = projectionMatrix * mv;
  }`;
const pointFS = `
  varying float vA, vSel;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 col = mix(vec3(0.6, 0.97, 1.0), vec3(1.0, 0.8, 0.5), vSel);
    gl_FragColor = vec4(col, vA * (1.0 - d * 2.0));
  }`;

// ---------- engine ----------
export async function createHologram({ host, zones, headUrl, onHover, onSelect }) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const byId = Object.fromEntries(zones.map((z) => [z.id, z]));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const head = await loadHead(headUrl);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const holo = new THREE.Group();
  holo.position.y = -0.22;
  scene.add(holo);

  const uniforms = {
    uTime: { value: 0 },
    uScan: { value: 0 },
    uHot: { value: Array.from({ length: MAXH }, () => new THREE.Vector3(9, 9, 9)) },
    uHotR: { value: 0.3 },
    uHotK: { value: 0 },
    uSel: { value: Array.from({ length: MAXH }, () => new THREE.Vector3(9, 9, 9)) },
    uSelR: { value: 0.3 },
    uSelK: { value: 0 },
    uPx: { value: renderer.getPixelRatio() },
  };
  const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(head.seg, 3));
  lineGeo.setAttribute('kind', new THREE.BufferAttribute(head.segKind, 1));
  lineGeo.setAttribute('normal', new THREE.BufferAttribute(head.segN, 3));
  lineGeo.setAttribute('feature', new THREE.BufferAttribute(head.segF, 1));
  holo.add(new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({ uniforms, vertexShader: lineVS, fragmentShader: lineFS, ...additive })));

  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(head.pts, 3));
  pointGeo.setAttribute('normal', new THREE.BufferAttribute(head.ptsN, 3));
  pointGeo.setAttribute('feature', new THREE.BufferAttribute(head.ptsF, 1));
  pointGeo.setAttribute('seed', new THREE.BufferAttribute(Float32Array.from({ length: head.pts.length / 3 }, Math.random), 1));
  holo.add(new THREE.Points(pointGeo, new THREE.ShaderMaterial({ uniforms, vertexShader: pointVS, fragmentShader: pointFS, ...additive })));

  const innerObjs = {};
  for (const [key, arr] of Object.entries(buildAnatomy())) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uO: { value: 0 }, uSelected: { value: 0 } },
      vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uO, uSelected; void main() { gl_FragColor = vec4(mix(vec3(0.7, 1.0, 1.0), vec3(1.0, 0.8, 0.5), uSelected), uO); }',
      ...additive,
    });
    innerObjs[key] = new THREE.LineSegments(g, mat);
    holo.add(innerObjs[key]);
  }

  const floor = [];
  ring(floor, 0, -1.8, 0, 0.9, 0.9, 90);
  ring(floor, 0, -1.8, 0, 1.15, 1.15, 120);
  ring(floor, 0, -1.82, 0, 0.55, 0.55, 60);
  const floorGeo = new THREE.BufferGeometry();
  floorGeo.setAttribute('position', new THREE.Float32BufferAttribute(floor, 3));
  const floorObj = new THREE.LineSegments(floorGeo, new THREE.LineBasicMaterial({ color: 0x74f1ff, opacity: 0.28, ...additive }));
  holo.add(floorObj);

  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
  const hitGeo = new THREE.SphereGeometry(1, 16, 12);
  const targets = [];
  for (const z of zones) {
    for (const [x, y, zz, r] of z.hit) {
      const m = new THREE.Mesh(hitGeo, hitMat);
      m.position.set(x, y, zz);
      m.scale.setScalar(r);
      m.userData.zone = z.id;
      holo.add(m);
      targets.push(m);
    }
  }

  let hovered = null, selected = null, pointerZone = null;
  const setCenters = (arr, id) => {
    const z = id && byId[id];
    for (let i = 0; i < MAXH; i++) {
      const h = z && z.hit[i];
      if (h) arr[i].set(h[0], h[1], h[2]); else arr[i].set(9, 9, 9);
    }
    return z ? Math.max(...z.hit.map((h) => h[3])) * 1.6 : 0.3;
  };

  // pointer
  const pointer = { x: 0, y: 0, inside: false };
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvas = renderer.domElement;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    pointer.y = Math.max(-1, Math.min(1, -((e.clientY - r.top) / r.height) * 2 + 1));
    pointer.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    pointer.cx = e.clientX; pointer.cy = e.clientY;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; });
  canvas.addEventListener('click', (e) => {
    onMove(e);
    const id = pick();
    if (id) onSelect(id);
  });
  function pick() {
    if (!pointer.inside) return null;
    ndc.set(pointer.x, pointer.y);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(targets, false)[0];
    return hit ? hit.object.userData.zone : null;
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, -0.3, w / h < 0.9 ? (6.9 / Math.max(w / h, 0.55)) * 0.8 : 6.9);
    camera.lookAt(0, -0.4, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // only animate while visible
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) loop(); }).observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  const clock = new THREE.Clock();
  let t = 0, rotX = 0, rotY = 0, running = false, lastPicked = null;
  function frame() {
    running = false;
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduceMotion) t += dt;

    const follow = canHover;
    const tx = follow ? pointer.y * -0.32 : Math.sin(t * 0.3) * 0.08;
    const ty = follow ? pointer.x * 0.75 : Math.sin(t * 0.22) * 0.5;
    const ease = reduceMotion ? 1 : 1 - Math.pow(0.002, dt);
    rotX += (tx - rotX) * ease;
    rotY += (ty - rotY) * ease;
    holo.rotation.set(rotX, rotY, 0);

    pointerZone = canHover ? pick() : null;
    if (pointerZone !== lastPicked) { lastPicked = pointerZone; onHover(pointerZone, pointer); }
    else if (pointerZone) onHover(pointerZone, pointer);
    canvas.style.cursor = pointerZone ? 'pointer' : 'crosshair';

    const hot = hovered && hovered !== selected ? hovered : null;
    uniforms.uTime.value = t;
    uniforms.uScan.value = reduceMotion ? 9 : 1.25 - ((t * 0.45) % 1) * 3.2;
    uniforms.uHotR.value = setCenters(uniforms.uHot.value, hot);
    uniforms.uSelR.value = setCenters(uniforms.uSel.value, selected);
    uniforms.uHotK.value += ((hot ? 1 : 0) - uniforms.uHotK.value) * 0.2;
    uniforms.uSelK.value += ((selected ? 1 : 0) - uniforms.uSelK.value) * 0.2;

    for (const [key, obj] of Object.entries(innerObjs)) {
      const owner = zones.find((z) => z.inner === key);
      const on = owner && (owner.id === hovered || owner.id === selected);
      const u = obj.material.uniforms;
      u.uO.value += ((on ? 0.85 : 0.06) - u.uO.value) * 0.15;
      u.uSelected.value = owner && owner.id === selected ? 1 : 0;
    }
    floorObj.rotation.y = -rotY + t * 0.1;

    renderer.render(scene, camera);
    loop();
  }
  function loop() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }
  loop();

  return {
    setHover(id) { hovered = id; },
    setSelected(id) { selected = id; },
    get rotation() { return { x: rotX, y: rotY, t }; },
  };
}
