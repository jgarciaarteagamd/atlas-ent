// Holographic head: laser slices, meridians and a twinkling point cloud baked
// from the head mesh (src/assets/head.bin), plus stylised inner anatomy that
// lights up for the zone under the pointer or the selected zone.

import * as THREE from 'three';

// ---------- head data ----------
export async function loadHead(url) {
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

// ---------- inner anatomy ----------
// Baked by scripts/bake-anatomy.mjs; group order must match GROUPS there.
const GROUPS = ['ear', 'sinus', 'mouth', 'pharynx', 'larynx', 'neck', 'gland'];

async function loadAnatomy(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`anatomy data ${res.status}`);
  const buf = await res.arrayBuffer();
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== 'ATA1') throw new Error('bad anatomy data');
  const nL = dv.getUint32(4, true), nLP = dv.getUint32(8, true), nP = dv.getUint32(12, true);
  let o = 16;
  const counts = new Uint32Array(buf.slice(o, o + nL * 4)); o += nL * 4;
  const lineGroups = new Uint8Array(buf, o, nL); o += nL + (nL % 2);
  const pos = (n) => { const q = new Int16Array(buf.slice(o, o + n * 6)); o += n * 6; return Float32Array.from(q, (v) => v * (2 / 32767)); };
  const nrm = (n) => { const q = new Int8Array(buf.slice(o, o + n * 3)); o += n * 3; return Float32Array.from(q, (v) => v / 127); };
  const lp = pos(nLP), pp = pos(nP), ln = nrm(nLP), pn = nrm(nP);
  const pg = Float32Array.from(new Uint8Array(buf, o, nP));

  let nSeg = 0;
  for (const c of counts) nSeg += c - 1;
  const seg = new Float32Array(nSeg * 6), segN = new Float32Array(nSeg * 6), segG = new Float32Array(nSeg * 2);
  let p = 0, s = 0;
  for (let l = 0; l < nL; l++) {
    for (let i = 0; i < counts[l] - 1; i++) {
      seg.set(lp.subarray((p + i) * 3, (p + i) * 3 + 6), s * 6);
      segN.set(ln.subarray((p + i) * 3, (p + i) * 3 + 6), s * 6);
      segG[s * 2] = segG[s * 2 + 1] = lineGroups[l];
      s++;
    }
    p += counts[l];
  }
  return { seg, segN, segG, pts: pp, ptsN: pn, ptsG: pg };
}

function ring(out, cx, cy, cz, rx, rz, n = 40) {
  for (let i = 0; i < n; i++) {
    for (const t of [(i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2]) out.push(cx + Math.cos(t) * rx, cy, cz + Math.sin(t) * rz);
  }
}

// ---------- shaders ----------
// The head only dims (x-ray) while a zone is hovered or selected; the zone itself
// shows through its inner anatomy, so the skin over it is not lit.
const common = `
  uniform float uTime, uScan, uHotK, uSelK, uPx;`;

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
  varying float vScan, vDepth, vKind, vLight, vFront;
  void main() {
    vKind = kind;
    vLight = (shade(normal, vFront) + feature * 1.1 * vFront) * base(position);
    vScan = exp(-abs(position.y - uScan) * 14.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = smoothstep(-8.3, -5.5, mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const lineFS = `${common}
  varying float vScan, vDepth, vKind, vLight, vFront;
  void main() {
    vec3 holo = vec3(0.45, 0.94, 1.0);
    vec3 col = holo * (0.6 + vScan * 1.2);
    float strength = mix(0.55, 0.2, vKind);
    float xray = 1.0 - 0.6 * max(uHotK, uSelK);
    float a = strength * vLight * xray + vScan * 0.3 * (1.0 - vKind * 0.6) * xray * (0.3 + 0.7 * vFront);
    gl_FragColor = vec4(col, a);
  }`;
const pointVS = `${common}${lighting}
  attribute float seed;
  attribute float feature;
  varying float vA;
  void main() {
    float tw = 0.5 + 0.5 * sin(uTime * (1.5 + seed * 3.0) + seed * 40.0);
    float scan = exp(-abs(position.y - uScan) * 10.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float front;
    float light = (shade(normal, front) + feature * 1.3 * front) * base(position);
    float xray = 1.0 - 0.6 * max(uHotK, uSelK);
    vA = (light * (0.55 + 0.45 * tw) + scan * 0.5 * front) * xray;
    gl_PointSize = (1.1 + feature * 0.6 * front + scan * 1.2) * uPx;
    gl_Position = projectionMatrix * mv;
  }`;
const pointFS = `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 col = vec3(0.6, 0.97, 1.0);
    gl_FragColor = vec4(col, vA * (1.0 - d * 2.0));
  }`;

const anatomyVS = (points) => `${lighting}
  uniform float uGO[${GROUPS.length}], uGS[${GROUPS.length}];
  uniform float uPx;
  attribute float group;
  varying float vA, vSel;
  void main() {
    int g = int(group + 0.5);
    float on = uGO[g];
    vSel = uGS[g];
    float front;
    float light = shade(normal, front);
    vA = on * (0.38 + 1.05 * light) * ${points ? '1.0' : '0.75'};
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    ${points ? 'gl_PointSize = (1.2 + on * 1.0) * uPx;' : ''}
    gl_Position = projectionMatrix * mv;
  }`;
const anatomyFS = (points) => `
  varying float vA, vSel;
  void main() {
    ${points ? 'float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float fall = 1.0 - d * 2.0;' : 'float fall = 1.0;'}
    vec3 col = mix(vec3(0.62, 0.98, 1.0), vec3(1.0, 0.8, 0.5), vSel);
    gl_FragColor = vec4(col, vA * fall);
  }`;

// ---------- engine ----------
export async function createHologram({ host, zones, headUrl, anatomyUrl, onHover, onSelect }) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const [head, anatomy] = await Promise.all([loadHead(headUrl), loadAnatomy(anatomyUrl)]);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const holo = new THREE.Group();
  holo.position.y = -0.22;
  scene.add(holo);

  const uniforms = {
    uTime: { value: 0 },
    uScan: { value: 0 },
    uHotK: { value: 0 },
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

  const groupUniforms = {
    uGO: { value: new Array(GROUPS.length).fill(0) },
    uGS: { value: new Array(GROUPS.length).fill(0) },
    uPx: uniforms.uPx,
  };
  const anatomyLines = new THREE.BufferGeometry();
  anatomyLines.setAttribute('position', new THREE.BufferAttribute(anatomy.seg, 3));
  anatomyLines.setAttribute('normal', new THREE.BufferAttribute(anatomy.segN, 3));
  anatomyLines.setAttribute('group', new THREE.BufferAttribute(anatomy.segG, 1));
  holo.add(new THREE.LineSegments(anatomyLines, new THREE.ShaderMaterial({ uniforms: groupUniforms, vertexShader: anatomyVS(false), fragmentShader: anatomyFS(false), ...additive })));
  const anatomyPoints = new THREE.BufferGeometry();
  anatomyPoints.setAttribute('position', new THREE.BufferAttribute(anatomy.pts, 3));
  anatomyPoints.setAttribute('normal', new THREE.BufferAttribute(anatomy.ptsN, 3));
  anatomyPoints.setAttribute('group', new THREE.BufferAttribute(anatomy.ptsG, 1));
  holo.add(new THREE.Points(anatomyPoints, new THREE.ShaderMaterial({ uniforms: groupUniforms, vertexShader: anatomyVS(true), fragmentShader: anatomyFS(true), ...additive })));

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
    canvas.style.cursor = pointerZone ? 'var(--cursor-link)' : 'crosshair';

    const hot = hovered && hovered !== selected ? hovered : null;
    uniforms.uTime.value = t;
    uniforms.uScan.value = reduceMotion ? 9 : 1.25 - ((t * 0.45) % 1) * 3.2;
    uniforms.uHotK.value += ((hot ? 1 : 0) - uniforms.uHotK.value) * 0.2;
    uniforms.uSelK.value += ((selected ? 1 : 0) - uniforms.uSelK.value) * 0.2;

    GROUPS.forEach((key, i) => {
      const owner = zones.find((z) => z.inner === key);
      const on = owner && (owner.id === hovered || owner.id === selected);
      groupUniforms.uGO.value[i] += ((on ? 1 : 0.09) - groupUniforms.uGO.value[i]) * 0.15;
      groupUniforms.uGS.value[i] = owner && owner.id === selected ? 1 : 0;
    });
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
