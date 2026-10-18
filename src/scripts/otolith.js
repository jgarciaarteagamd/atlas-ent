// Hologram animation of BPPV: otoconia leave the utricle, settle in the
// posterior semicircular canal, slide when the head is laid back (Dix-Hallpike)
// pushing the cupula, and are led back to the utricle by the Epley manoeuvre.
//
// Frame (left labyrinth seen from the left): x points backwards (posterior), y up, z lateral
// (towards the viewer). Shapes are simplified for patient education.

import * as THREE from 'three';
import { loadHead } from './holo.js';

// ---------- geometry helpers ----------
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function frames(path) {
  const out = [];
  let ref = v3(0, 0, 1);
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    if (Math.abs(t.dot(ref)) > 0.95) ref = v3(1, 0, 0);
    const n = ref.clone().cross(t).normalize();
    const bn = t.clone().cross(n).normalize();
    out.push({ t, n, b: bn });
  }
  return out;
}

// Rings around a centre line (laser contours) plus surface points, with normals.
function tube(path, radius, { ringEvery = 1, seg = 22, points = 600 } = {}, out) {
  const f = frames(path);
  for (let i = 0; i < path.length; i += ringEvery) {
    const r = radius(i / (path.length - 1));
    for (let k = 0; k < seg; k++) {
      for (const kk of [k, k + 1]) {
        const a = (kk / seg) * Math.PI * 2;
        const nrm = f[i].n.clone().multiplyScalar(Math.cos(a)).add(f[i].b.clone().multiplyScalar(Math.sin(a)));
        out.lines.push(...path[i].clone().addScaledVector(nrm, r).toArray());
        out.lineN.push(...nrm.toArray());
      }
    }
  }
  for (let p = 0; p < points; p++) {
    const i = Math.floor(Math.random() * path.length);
    const a = Math.random() * Math.PI * 2;
    const nrm = f[i].n.clone().multiplyScalar(Math.cos(a)).add(f[i].b.clone().multiplyScalar(Math.sin(a)));
    out.pts.push(...path[i].clone().addScaledVector(nrm, radius(i / (path.length - 1))).toArray());
    out.ptsN.push(...nrm.toArray());
  }
}

function ellipsoid(c, r, { rings = 9, seg = 30, points = 700 } = {}, out) {
  for (let k = 1; k < rings; k++) {
    const phi = -Math.PI / 2 + (k * Math.PI) / rings;
    for (let s = 0; s < seg; s++) {
      for (const ss of [s, s + 1]) {
        const a = (ss / seg) * Math.PI * 2;
        const nrm = v3(Math.cos(phi) * Math.cos(a), Math.sin(phi), Math.cos(phi) * Math.sin(a));
        out.lines.push(c.x + nrm.x * r.x, c.y + nrm.y * r.y, c.z + nrm.z * r.z);
        out.lineN.push(nrm.x / r.x, nrm.y / r.y, nrm.z / r.z);
      }
    }
  }
  for (let p = 0; p < points; p++) {
    const nrm = v3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    out.pts.push(c.x + nrm.x * r.x, c.y + nrm.y * r.y, c.z + nrm.z * r.z);
    out.ptsN.push(nrm.x, nrm.y, nrm.z);
  }
}

const arc = (center, u, v, R, a0, a1, n) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return center.clone().addScaledVector(u, Math.cos(a) * R).addScaledVector(v, Math.sin(a) * R);
  });
const line = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a.clone().lerp(b, i / n));
const deg = (d) => (d * Math.PI) / 180;

// ---------- the labyrinth ----------
const UP = v3(0, 1, 0);
const uPost = v3(1, 0, 1).normalize();               // posterior canal plane: 45° back and outwards
const uAnt = v3(-1, 0, 1).normalize();              // anterior canal plane: 45° forwards and outwards

const UTRICLE = { c: v3(0, 0, 0), r: v3(0.44, 0.24, 0.25) };
const postCenter = v3(0.25, 0.1, 0).addScaledVector(uPost, 0.55);
const POST_R = 0.62;
const postArc = arc(postCenter, uPost, UP, POST_R, deg(200), deg(480), 140);
const crusTop = postArc[postArc.length - 1];
const crus = line(crusTop, v3(0.2, 0.2, 0), 24).slice(1);
const into = line(v3(0.2, 0.2, 0), v3(0.05, 0.02, 0.02), 10).slice(1);
// Path the otoconia can travel: ampulla -> canal -> common crus -> utricle.
const ROUTE = [...postArc, ...crus, ...into];
const ROUTE_LEN = [0];
for (let i = 1; i < ROUTE.length; i++) ROUTE_LEN.push(ROUTE_LEN[i - 1] + ROUTE[i].distanceTo(ROUTE[i - 1]));
const L = ROUTE_LEN[ROUTE_LEN.length - 1];
const ARC_END = ROUTE_LEN[postArc.length - 1];
// Where the otoconia rest with the head upright: the lowest point of the canal.
let S_REST = 0;
for (let i = 1, best = Infinity; i < postArc.length; i++) if (postArc[i].y < best) { best = postArc[i].y; S_REST = 0; for (let k = 1; k <= i; k++) S_REST += postArc[k].distanceTo(postArc[k - 1]); }
const at = (s) => {
  s = Math.max(0, Math.min(L, s));
  let i = 1;
  while (i < ROUTE_LEN.length - 1 && ROUTE_LEN[i] < s) i++;
  const t = (s - ROUTE_LEN[i - 1]) / (ROUTE_LEN[i] - ROUTE_LEN[i - 1] || 1);
  return ROUTE[i - 1].clone().lerp(ROUTE[i], t);
};

function buildLabyrinth() {
  const out = { lines: [], lineN: [], pts: [], ptsN: [] };
  ellipsoid(UTRICLE.c, UTRICLE.r, { points: 900 }, out);
  ellipsoid(v3(-0.18, -0.42, 0.04), v3(0.2, 0.16, 0.15), { rings: 7, points: 450 }, out);
  // posterior canal with its ampulla (the bulge at the start)
  tube(postArc, (t) => 0.065 + 0.075 * Math.exp(-((t * 14) ** 2)), { ringEvery: 3, points: 1300 }, out);
  tube(crus, () => 0.07, { ringEvery: 3, points: 260 }, out);
  // anterior canal, sharing the common crus
  const antCenter = v3(-0.2, 0.62, 0).addScaledVector(uAnt, 0.12);
  const antArc = arc(antCenter, uAnt, UP, 0.5, deg(-150), deg(150), 110).map((p) => p);
  tube(antArc, (t) => 0.06 + 0.07 * Math.exp(-((t * 14) ** 2)), { ringEvery: 4, points: 800 }, out);
  // lateral canal, horizontal and bulging towards the viewer
  const latArc = arc(v3(-0.05, 0.12, 0.55), v3(1, 0, 0), v3(0, 0, 1), 0.46, deg(200), deg(520), 110);
  tube(latArc, (t) => 0.06 + 0.07 * Math.exp(-((t * 14) ** 2)), { ringEvery: 4, points: 800 }, out);
  // cochlea: 2.5 turns forward and down from the saccule
  const coch = Array.from({ length: 160 }, (_, i) => {
    const t = i / 159, a = t * Math.PI * 5;
    const r = 0.42 * (1 - 0.72 * t);
    return v3(-0.82 + Math.cos(a) * r, -0.78 + Math.sin(a) * r, 0.05 + t * 0.32);
  });
  tube(line(v3(-0.2, -0.5, 0.04), coch[0], 10), () => 0.08, { ringEvery: 3, points: 120 }, out);
  tube(coch, (t) => 0.12 - 0.08 * t, { ringEvery: 3, points: 1500 }, out);
  return out;
}

// ---------- shaders ----------
const lit = `
  float shade(vec3 n) {
    vec3 nv = normalize(normalMatrix * n);
    float key = max(dot(nv, normalize(vec3(-0.4, 0.6, 0.7))), 0.0);
    float rim = pow(1.0 - abs(nv.z), 2.0);
    return 0.18 + 0.8 * key + 0.5 * rim;
  }`;
const structVS = (points) => `${lit}
  uniform float uPx, uFade;
  varying float vA;
  void main() {
    vA = shade(normal) * uFade * ${points ? '0.85' : '0.32'};
    ${points ? 'gl_PointSize = 1.6 * uPx;' : ''}
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const structFS = (points) => `
  varying float vA;
  void main() {
    ${points ? 'float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float f = 1.0 - d * 2.0;' : 'float f = 1.0;'}
    gl_FragColor = vec4(0.5, 0.95, 1.0, vA * f);
  }`;

// ---------- animation ----------
export async function createOtolithAnimation({ host, inset, headUrl, captions, labels, onStep, onManual }) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);

  renderer.autoClear = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);

  // Small hologram of the patient's head (the landing-page model) that copies the posture.
  const headData = await loadHead(headUrl);
  const headScene = new THREE.Scene();
  const headCam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  headCam.position.set(0, -0.1, 8);
  headCam.lookAt(0, -0.1, 0);
  const headPivot = new THREE.Group();
  const headModel = new THREE.Group();
  headModel.position.set(0, 0.55, 0.1);           // rotate about the top of the neck
  headPivot.position.set(0, -0.55, -0.1);
  headPivot.add(headModel);
  headScene.add(headPivot);
  const hp = new THREE.BufferGeometry();
  hp.setAttribute('position', new THREE.BufferAttribute(headData.pts, 3));
  hp.setAttribute('normal', new THREE.BufferAttribute(headData.ptsN, 3));
  hp.setAttribute('feature', new THREE.BufferAttribute(headData.ptsF, 1));
  const pivot = new THREE.Group();          // rotates like the patient's head
  const lab = new THREE.Group();
  const centre = v3(0.42, 0.0, -0.08);
  lab.position.copy(centre).multiplyScalar(-1);
  pivot.add(lab);
  scene.add(pivot);

  const px = { value: renderer.getPixelRatio() };
  const fade = { value: 1 };
  const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  headModel.add(new THREE.Points(hp, new THREE.ShaderMaterial({
    uniforms: { uPx: px },
    vertexShader: `${lit}
      uniform float uPx; attribute float feature; varying float vA;
      void main() {
        vec3 nv = normalize(normalMatrix * normal);
        vA = (shade(normal) * 0.55 + feature * 0.9) * smoothstep(-0.25, 0.3, nv.z) * smoothstep(-1.75, -1.3, position.y);
        gl_PointSize = 1.1 * uPx;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `varying float vA; void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(0.55, 0.95, 1.0, vA * (1.0 - d * 2.0)); }`,
    ...additive,
  })));

  const geo = buildLabyrinth();
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(geo.lines, 3));
  lg.setAttribute('normal', new THREE.Float32BufferAttribute(geo.lineN, 3));
  lab.add(new THREE.LineSegments(lg, new THREE.ShaderMaterial({ uniforms: { uPx: px, uFade: fade }, vertexShader: structVS(false), fragmentShader: structFS(false), ...additive })));
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(geo.pts, 3));
  pg.setAttribute('normal', new THREE.Float32BufferAttribute(geo.ptsN, 3));
  lab.add(new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: { uPx: px, uFade: fade }, vertexShader: structVS(true), fragmentShader: structFS(true), ...additive })));

  // utricular macula: otoconia resting on the utricle floor
  const macula = [];
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
    macula.push(v3(0.05 + Math.cos(a) * 0.22 * r, -0.17 + Math.random() * 0.02, Math.sin(a) * 0.14 * r));
  }

  // free otoconia that travel along ROUTE (s = distance from the ampulla)
  const N = 9;
  const free = Array.from({ length: N }, (_, i) => ({
    from: macula[i * 7].clone(),
    s: 0.14 + i * 0.012,
    off: v3((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06),
    v: 0,
    home: false,
    settle: 0,
  }));

  const crystalGeo = new THREE.BufferGeometry();
  const crystalPos = new Float32Array((macula.length + N) * 3);
  const crystalHot = new Float32Array(macula.length + N);
  crystalGeo.setAttribute('position', new THREE.BufferAttribute(crystalPos, 3));
  crystalGeo.setAttribute('hot', new THREE.BufferAttribute(crystalHot, 1));
  lab.add(new THREE.Points(crystalGeo, new THREE.ShaderMaterial({
    uniforms: { uPx: px, uFade: fade },
    vertexShader: `uniform float uPx, uFade; attribute float hot; varying float vH;
      void main() { vH = hot; gl_PointSize = (3.2 + hot * 5.0) * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uFade; varying float vH;
      void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        vec3 c = mix(vec3(0.9, 0.85, 0.7), vec3(1.0, 0.75, 0.35), vH);
        gl_FragColor = vec4(c * (1.0 + vH * 0.6), (0.6 + 0.4 * vH) * (1.0 - d * 1.6) * uFade); }`,
    ...additive,
  })));

  // cupula: a dome across the ampulla that bends with endolymph flow
  const ampS = 0.035;
  const ampP = at(ampS), ampT = at(ampS + 0.01).sub(at(ampS)).normalize();
  const ampF = frames([at(ampS - 0.01), ampP, at(ampS + 0.01)])[1];
  const cupGeo = new THREE.BufferGeometry();
  const CUP = 260;
  const cupBase = [];
  for (let i = 0; i < CUP; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.12;
    cupBase.push({ a, r });
  }
  const cupPos = new Float32Array(CUP * 3);
  cupGeo.setAttribute('position', new THREE.BufferAttribute(cupPos, 3));
  const cupMat = new THREE.ShaderMaterial({
    uniforms: { uPx: px, uBend: { value: 0 }, uFade: fade },
    vertexShader: 'uniform float uPx; void main() { gl_PointSize = 2.0 * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uBend, uFade; void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
      vec3 c = mix(vec3(0.6, 0.95, 1.0), vec3(1.0, 0.72, 0.3), clamp(abs(uBend) * 6.0, 0.0, 1.0));
      gl_FragColor = vec4(c, (0.6 + clamp(abs(uBend) * 6.0, 0.0, 0.4)) * (1.0 - d * 2.0) * uFade); }`,
    ...additive,
  });
  lab.add(new THREE.Points(cupGeo, cupMat));

  // ---------- timeline ----------
  // The head pose is two angles: pitch (lying back, about the patient's
  // left-right axis, fixed to gravity) and turn (about the neck, so it follows
  // the head). Positive pitch tips the head back, positive turn looks left.
  // Each step lists the poses it moves through, one after another.
  const STEPS = [
    { d: 4.5, poses: [[0, 0]] },                         // 0 otoconia on the utricle
    { d: 4.5, poses: [[0, 0]] },                         // 1 some detach and fall into the posterior canal
    { d: 3.5, poses: [[0, 0]] },                         // 2 sitting: they rest at the lowest point
    { d: 6.5, poses: [[0, 45], [110, 45]] },             // 3 Dix-Hallpike: turn left, lie back; they slide, cupula bends
    { d: 4, poses: [[110, 45]] },                        // 4 they stop, the cupula returns: vertigo lasts seconds
    { d: 10, poses: [[110, -45], [110, -135], [0, -135]] }, // 5 Epley: turn right, roll onto the side, sit up
    { d: 3, poses: [[0, 0]] },                           // 6 back in the utricle, where they cause no symptoms
  ];
  const TOTAL = STEPS.reduce((a, s) => a + s.d, 0);
  let t = 0, step = -1, bend = 0;
  const sway = new THREE.Quaternion();

  const ease = (x) => x * x * (3 - 2 * x);
  function targetPose(time) {
    let acc = 0, prev = [0, 0];
    for (const s of STEPS) {
      if (time < acc + s.d) {
        const n = s.poses.length, x = ((time - acc) / s.d) * n;
        const seg = Math.min(n - 1, Math.floor(x));
        const from = seg ? s.poses[seg - 1] : prev, to = s.poses[seg];
        const f = ease(Math.min(1, (x - seg) * 1.8));
        return [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f];
      }
      acc += s.d; prev = s.poses[s.poses.length - 1];
    }
    return prev;
  }

  // The labyrinth is a left ear seen from the patient's left. Its frame relates to
  // the head model (face +z, left ear +x) by a quarter turn about the vertical.
  const M = new THREE.Quaternion().setFromAxisAngle(UP, deg(90));
  const Minv = M.clone().invert();
  const orient = new THREE.Quaternion();        // labyrinth orientation (what gravity sees)
  const qPitch = new THREE.Quaternion(), qTurn = new THREE.Quaternion();
  const AXIS = v3(0, 0, 1), RATE = 70;          // left-right axis of the patient; degrees per second
  const pose = { pitch: 0, turn: 0 };

  // free mode: the arrows move the head and gravity does the rest
  let manual = false;
  const input = { pitch: 0, turn: 0 };

  const world = new THREE.Vector3();
  const yAt = (s) => world.copy(at(s)).applyMatrix4(lab.matrixWorld).y;

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0.15, w / h < 0.8 ? 6.4 : 5.0);
    camera.lookAt(0, 0, 0);
    // in portrait the head controls sit below: lift the labyrinth clear of them
    if (w / h < 0.8) camera.setViewOffset(w, h, 0, h * 0.14, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // labels follow the structures on screen
  const anchors = { utricle: v3(0.0, 0.22, 0.1), canal: postArc[105], cupula: ampP.clone().add(v3(0, -0.12, 0)), cochlea: v3(-0.9, -1.25, 0.2) };
  const tmp = new THREE.Vector3();

  const clock = new THREE.Clock();
  let raf = 0, running = false;
  function frame() {
    if (!running) return;
    // keep real time even on slow devices, but never jump more than a fifth of a second
    const dt = Math.min(clock.getDelta(), 0.2);
    let local = 0;
    if (manual) {
      pose.pitch += input.pitch * RATE * dt;
      pose.turn += input.turn * RATE * dt;
    } else {
      t = (t + dt) % TOTAL;
      // which step are we in?
      let acc = 0, i = 0;
      while (i < STEPS.length - 1 && t >= acc + STEPS[i].d) { acc += STEPS[i].d; i++; }
      if (i !== step) {
        step = i;
        onStep(step, captions[step]);
        if (step === 0) {
          for (const p of free) { p.s = 0.14 + Math.random() * 0.1; p.v = 0; p.home = false; p.settle = 0; }
          bend = 0;
        }
      }
      local = (t - acc) / STEPS[step].d;
      [pose.pitch, pose.turn] = targetPose(t);
    }
    // lying back turns about a fixed axis; the neck turn is in the head's own frame
    qPitch.setFromAxisAngle(AXIS, -deg(pose.pitch));
    qTurn.setFromAxisAngle(UP, deg(pose.turn));
    orient.copy(qPitch).multiply(qTurn);
    // a gentle turn about the vertical axis to show depth; it does not change "down"
    sway.setFromAxisAngle(UP, reduceMotion ? -0.35 : -0.35 + Math.sin(t * 0.35) * 0.2);
    pivot.quaternion.copy(sway).multiply(orient);
    pivot.updateMatrixWorld(true);
    headPivot.quaternion.copy(pivot.quaternion).multiply(Minv);

    // otoconia
    let flow = 0;
    for (let k = 0; k < N; k++) {
      const p = free[k];
      let pos;
      if (step === 0) {
        pos = p.from;
      } else if (step === 1) {
        // detach from the macula, enter the canal by the ampulla and settle at its lowest point
        const f = ease(Math.min(1, Math.max(0, (local - k * 0.04) * 1.6)));
        const rest = S_REST + (k - N / 2) * 0.014;
        const a = p.from.clone().lerp(at(0.12).add(p.off), f);
        const b = at(0.12).add(p.off).lerp(at(rest).add(p.off), f);
        pos = a.lerp(b, f);
        p.s = rest;
      } else {
        // overdamped sliding under gravity along the canal
        if (!p.settle) {
          const h = 0.01;
          const slope = (yAt(p.s + h) - yAt(p.s - h)) / (2 * h);
          const v = -slope * 0.55;
          p.s = Math.max(0.09 + k * 0.008, Math.min(L - 0.02, p.s + v * dt));
          if (p.s > ARC_END + 0.05) p.home = true;
          if (p.s <= ARC_END) flow += v;
        }
        pos = at(p.s).add(p.off.clone().multiplyScalar(p.home ? 2.4 : 1));
        // back in the utricle: they drift onto the macula and stay there
        if (p.s >= L - 0.05) p.settle = Math.min(1, p.settle + dt * 0.8);
        if (p.settle) pos.lerp(p.from, ease(p.settle));
      }
      crystalPos.set(pos.toArray(), (macula.length + k) * 3);
      crystalHot[macula.length + k] = 1;
    }
    for (let k = 0; k < macula.length; k++) {
      const gone = step >= 1 && step < 6 && k % 7 === 0 && k / 7 < N;
      crystalPos.set((gone ? v3(0, -9, 0) : macula[k]).toArray(), k * 3);
      crystalHot[k] = 0;
    }
    crystalGeo.attributes.position.needsUpdate = true;
    crystalGeo.attributes.hot.needsUpdate = true;

    // cupula follows the plunger effect of the moving otoconia
    bend += ((step >= 2 ? flow / N : 0) * 0.6 - bend) * Math.min(1, dt * 6);
    cupMat.uniforms.uBend.value = bend;
    for (let k = 0; k < CUP; k++) {
      const { a, r } = cupBase[k];
      const dome = (1 - (r / 0.12) ** 2) * bend * 1.4;
      const p = ampP.clone()
        .addScaledVector(ampF.n, Math.cos(a) * r)
        .addScaledVector(ampF.b, Math.sin(a) * r)
        .addScaledVector(ampT, dome);
      cupPos.set(p.toArray(), k * 3);
    }
    cupGeo.attributes.position.needsUpdate = true;

    // fade between loops
    fade.value = manual ? 1 : Math.min(1, t / 0.8, (TOTAL - t) / 0.8);

    renderer.setViewport(0, 0, host.clientWidth, host.clientHeight);
    renderer.clear();
    renderer.render(scene, camera);
    // corner view of the head, drawn into the inset box
    const box = inset.getBoundingClientRect(), hb = host.getBoundingClientRect();
    if (box.width > 0) {
      const x = box.left - hb.left, y = hb.bottom - box.bottom;
      renderer.setScissorTest(true);
      renderer.setScissor(x, y, box.width, box.height);
      renderer.setViewport(x, y, box.width, box.height);
      renderer.clearDepth();
      renderer.render(headScene, headCam);
      renderer.setScissorTest(false);
    }
    const out = {};
    for (const [key, a] of Object.entries(anchors)) {
      tmp.copy(a).applyMatrix4(lab.matrixWorld).project(camera);
      out[key] = { x: (tmp.x * 0.5 + 0.5) * 100, y: (-tmp.y * 0.5 + 0.5) * 100 };
    }
    labels(out, Math.abs(bend) > 0.035);
    raf = requestAnimationFrame(frame);
  }

  function enterManual() {
    if (manual) return;
    manual = true;
    // the crystals must be in the canal to play with them: start seated
    if (step < 2 || step >= 5) {
      pose.pitch = pose.turn = 0;
      free.forEach((p, k) => { p.s = S_REST + (k - N / 2) * 0.014; p.home = false; p.settle = 0; });
      step = 2;
    }
    onManual(true);
  }

  return {
    play() { if (running) return; running = true; clock.getDelta(); raf = requestAnimationFrame(frame); },
    pause() { running = false; cancelAnimationFrame(raf); },
    restart() { manual = false; input.pitch = input.turn = 0; onManual(false); t = 0; step = -1; },
    // pitch: +1 tips the head back, -1 forward; turn: +1 towards the left, -1 right; 0 stops
    move(axis, dir) { if (dir) enterManual(); input[axis] = dir; },
    // for checks: how far the head has been moved and how many crystals are home
    state: () => ({ ...pose, settled: free.filter((p) => p.settle >= 1).length, total: N, step }),
  };
}
