/* ═══════════════════════════════════════════════════════════════════════
   S 1000 RR · K67 — Lean Laboratory
   A photogrammetry scan turned into an instrument you can actually handle.
   ═══════════════════════════════════════════════════════════════════════ */

import * as T from './lib/three-bundle.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const DEG = Math.PI / 180;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Scan is normalised to the reference vehicle length so every measurement
   below is reported in real millimetres. */
const REF_LENGTH_MM = 2073;

/* ───────────────────────────── STATE ───────────────────────────── */
const S = {
  chapter: 'overview',
  lean: 0, leanTarget: 0,
  limitL: 45, limitR: 45, tyreHalf: 0,
  chicane: false, chicaneT: 0,
  finish: 'chrome', env: 'studio', mode: 'solid',
  reflect: true, shadow: true, fx: true, protractor: true,
  cutOn: false, cutAxis: 'x', cutPos: 0, cutFlip: false, cutSweep: false,
  explode: 0, explodeTarget: 0, explodeAuto: false, explodeT: 0,
  soloPart: -1, hoverPart: -1, ghost: true, partFinish: 'chrome',
  exposure: 1.0,
  activeHs: -1,
  flying: false, uiHidden: false,
  quality: 'high',
};

/* ─────────────────────────── RENDERER ─────────────────────────── */
const canvas = $('#gl');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = S.exposure;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.info.autoReset = false;   // composer resets per pass; we want the whole frame

const scene = new T.Scene();
const camera = new T.PerspectiveCamera(32, innerWidth / innerHeight, 0.02, 60);
camera.position.set(1.1, 0.55, 1.5);

const controls = new T.OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.target.set(0, 0.33, 0);
controls.minDistance = 0.52;
controls.maxDistance = 4.2;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI / 2 - 0.015;
controls.autoRotateSpeed = 0.55;
controls.rotateSpeed = 0.72;
controls.zoomSpeed = 0.8;

/* ────────────────────── GRADIENT BACKDROP ────────────────────── */
const bgUniforms = {
  uTop:    { value: new T.Color('#0b1017') },
  uMid:    { value: new T.Color('#0a0d13') },
  uBottom: { value: new T.Color('#04060a') },
  uGlow:   { value: new T.Color('#12243a') },
};
const backdrop = new T.Mesh(
  new T.SphereGeometry(26, 32, 24),
  new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: bgUniforms,
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      uniform vec3 uTop, uMid, uBottom, uGlow; varying vec3 vP;
      void main(){
        vec3 d = normalize(vP);
        float h = d.y * .5 + .5;
        vec3 c = mix(uBottom, uMid, smoothstep(.30, .52, h));
        c = mix(c, uTop, smoothstep(.52, .95, h));
        /* a soft pool of light behind the subject, sitting just off the horizon */
        float pool = pow(max(0., 1. - length(d.xy - vec2(0., .06)) * 1.25), 3.);
        c += uGlow * pool * .55;
        gl_FragColor = vec4(c, 1.);
      }`,
  })
);
backdrop.frustumCulled = false;
scene.add(backdrop);

/* ─────────────────────────── LIGHTS ─────────────────────────── */
const key = new T.DirectionalLight(0xffffff, 2.4);
key.position.set(2.2, 3.4, 2.0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.008;
const sc = key.shadow.camera;
sc.near = 0.5; sc.far = 9; sc.left = -1.1; sc.right = 1.1; sc.top = 1.1; sc.bottom = -1.1;
sc.updateProjectionMatrix();
scene.add(key, key.target);

const rimL = new T.DirectionalLight(0x5b9bff, 1.1); rimL.position.set(-2.6, 1.1, -1.6); scene.add(rimL);
const rimR = new T.DirectionalLight(0xffe6c8, 0.55); rimR.position.set(2.4, 0.8, -2.2); scene.add(rimR);
const amb  = new T.AmbientLight(0xffffff, 0.16); scene.add(amb);

/* ───────────────── PROCEDURAL ENVIRONMENTS (no HDR files) ───────────────── */
const pmrem = new T.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const envCache = {};

function panel(scn, w, h, d, x, y, z, color, power) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(power) }));
  m.position.set(x, y, z); scn.add(m);
}
function buildEnvScene(kind) {
  const s = new T.Scene();
  const shell = new T.Mesh(new T.BoxGeometry(14, 9, 14), new T.MeshBasicMaterial({ side: T.BackSide }));
  s.add(shell);
  /* Emitter powers stay modest on purpose: the machine is chrome by default
     and a hot softbox turns the whole fairing into one white blob. */
  if (kind === 'studio') {
    shell.material.color.set('#10151c');
    panel(s, 5.5, 0.2, 5.5, 0, 4.2, 0, '#ffffff', 2.4);       // overhead softbox
    panel(s, 0.2, 3.4, 7, -6.4, 1.7, 0, '#c6d6f0', 1.7);      // left wall bounce
    panel(s, 0.2, 3.4, 7, 6.4, 1.7, 0, '#ffffff', 1.35);      // right wall bounce
    panel(s, 8, 0.2, 8, 0, -3.6, 0, '#333c4a', 0.9);          // floor bounce
  } else if (kind === 'pit') {
    shell.material.color.set('#0c1015');
    panel(s, 8, 0.16, 0.45, 0, 3.6, -2.6, '#fff2da', 2.8);    // ceiling strip lights
    panel(s, 8, 0.16, 0.45, 0, 3.6, 2.6, '#fff2da', 2.8);
    panel(s, 0.4, 2.4, 9, -5.6, 1.0, 0, '#404b5e', 1.2);
    panel(s, 0.4, 2.4, 9, 5.6, 1.0, 0, '#4e5a6c', 1.2);
    panel(s, 8, 0.2, 8, 0, -3.4, 0, '#1b1f27', 0.9);
  } else if (kind === 'dusk') {
    shell.material.color.set('#161119');
    panel(s, 12, 4, 0.3, 0, 1.5, -6.6, '#ff7a3c', 1.9);       // low sun band behind
    panel(s, 12, 0.3, 12, 0, 4.4, 0, '#42639f', 1.4);         // cool sky above
    panel(s, 0.3, 2.6, 10, 6.6, 1.1, 0, '#ffb072', 1.0);
    panel(s, 8, 0.2, 8, 0, -3.4, 0, '#261e1e', 0.9);
  } else { /* night */
    shell.material.color.set('#05080d');
    panel(s, 9, 0.12, 0.3, 0, 3.0, -3.2, '#4fa9f5', 3.2);     // cyan overhead bar
    panel(s, 0.3, 0.12, 9, -4.4, 2.2, 0, '#e7202e', 1.8);     // red side bar
    panel(s, 0.3, 0.12, 9, 4.4, 2.2, 0, '#1b62d6', 2.2);      // blue side bar
    panel(s, 8, 0.2, 8, 0, -3.2, 0, '#0a0f16', 0.9);
  }
  return s;
}
function getEnv(kind) {
  if (!envCache[kind]) {
    const s = buildEnvScene(kind);
    envCache[kind] = pmrem.fromScene(s, 0.03).texture;
    s.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  }
  return envCache[kind];
}

const ENV_LOOK = {
  studio: { top:'#111823', mid:'#0c1219', bot:'#070a0f', glow:'#1b3350',
            key:'#ffffff', keyI:1.5, rimL:'#5b9bff', rimLI:0.7, rimR:'#ffe6c8', rimRI:0.38,
            keyPos:[2.4,3.2,2.2], envI:1.0, ground:'#111823', exposure:1.0,
            zh:'STUDIO — 顶部柔光箱 + 双侧反光板，中性白光。' },
  pit:    { top:'#13181f', mid:'#0e1319', bot:'#080b0f', glow:'#2e2a1e',
            key:'#fff2dc', keyI:1.8, rimL:'#8fb6ff', rimLI:0.5, rimR:'#ffd9a8', rimRI:0.7,
            keyPos:[1.6,3.6,-1.4], envI:1.02, ground:'#12171e', exposure:0.98,
            zh:'PIT LANE — 顶部条形灯，暖白，接近维修区照明。' },
  dusk:   { top:'#1f1826', mid:'#15101a', bot:'#0a070d', glow:'#4a2a1c',
            key:'#ff9a5c', keyI:2.0, rimL:'#4f7dff', rimLI:0.95, rimR:'#ff8340', rimRI:0.6,
            keyPos:[-2.6,1.3,-2.4], envI:1.05, ground:'#171219', exposure:1.02,
            zh:'DUSK — 低角度暖光逆打，冷色天光补面。' },
  night:  { top:'#0a1019', mid:'#070c13', bot:'#04070b', glow:'#12304f',
            key:'#bcd8ff', keyI:1.0, rimL:'#4fa9f5', rimLI:1.5, rimR:'#e7202e', rimRI:0.7,
            keyPos:[0.8,3.0,-1.2], envI:1.1, ground:'#080d14', exposure:1.06,
            zh:'NIGHT — 顶部青色条灯 + 红蓝侧边勾勒，几乎全靠轮廓光。' },
};

/* ───────────────────────────── GROUND ───────────────────────────── */
const groundColor = new T.Color('#0a0e14');

const reflector = new T.Reflector(new T.PlaneGeometry(14, 14), {
  textureWidth: 1024, textureHeight: 1024,
  color: 0x777777,
  shader: {
    uniforms: {
      color:         { value: null },
      tDiffuse:      { value: null },
      textureMatrix: { value: null },
      uFade:         { value: 1.9 },
      uStrength:     { value: 0.42 },
    },
    vertexShader: `
      uniform mat4 textureMatrix; varying vec4 vUvR; varying vec3 vW;
      void main(){
        vUvR = textureMatrix * vec4(position,1.);
        vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
      }`,
    fragmentShader: `
      uniform vec3 color; uniform sampler2D tDiffuse; uniform float uFade, uStrength;
      varying vec4 vUvR; varying vec3 vW;
      float blend(const in float x){ return x < .5 ? 2.*x*x : -1. + (4. - 2.*x)*x; }
      void main(){
        vec4 base = texture2DProj(tDiffuse, vUvR);
        float d = length(vW.xz) / uFade;
        float fade = 1. - smoothstep(.05, 1., d);
        vec3 refl = vec3(blend(base.r), blend(base.g), blend(base.b));
        gl_FragColor = vec4(mix(color, refl, fade * uStrength), 1.);
      }`,
  },
});
reflector.rotation.x = -Math.PI / 2;
reflector.position.y = 0;
reflector.material.uniforms.color.value = groundColor;
scene.add(reflector);

/* Matte floor sitting a hair under the mirror, so the world still reads
   when reflections are switched off. */
const floor = new T.Mesh(
  new T.PlaneGeometry(30, 30),
  new T.MeshBasicMaterial({ color: groundColor })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.0015;
scene.add(floor);

/* Catches the directional shadow. */
const shadowCatcher = new T.Mesh(
  new T.PlaneGeometry(6, 6),
  new T.ShadowMaterial({ opacity: 0.62 })
);
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.y = 0.0006;
shadowCatcher.receiveShadow = true;
scene.add(shadowCatcher);

/* Soft ambient-occlusion pool that tracks the contact line. */
const blobTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(0,0,0,.72)');
  r.addColorStop(.45, 'rgba(0,0,0,.30)');
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
})();
const blob = new T.Mesh(
  new T.PlaneGeometry(1, 1),
  new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.9 })
);
blob.rotation.x = -Math.PI / 2;
blob.position.y = 0.0012;
blob.scale.set(0.62, 1.55, 1);
scene.add(blob);

/* ─────────────────────── LEAN RIG + PROTRACTOR ─────────────────────── */
const leanPivot = new T.Group();   // rolls about the tyre contact line (world Z)
scene.add(leanPivot);
const bikeGroup = new T.Group();
leanPivot.add(bikeGroup);

/* The gauge sits in the frontal plane at the front tyre, sized to the wheel
   so it reads as instrumentation rather than as stray geometry. */
const proGroup = new T.Group();
proGroup.position.z = 0.64;      // clear of the front tyre, so it reads as a separate gauge
scene.add(proGroup);

const ARC_MAX = 60, ARC_STEP = 0.5, ARC_R = 0.26;
const ARC_N = (ARC_MAX * 2) / ARC_STEP + 1;
const ARC_MID = ARC_MAX / ARC_STEP;

function buildProtractor() {
  const pts = [], cols = [];
  const cCyan = new T.Color('#4fa9f5'), cBlue = new T.Color('#1b62d6'), cRed = new T.Color('#e7202e');
  for (let i = 0; i < ARC_N; i++) {
    const deg = -ARC_MAX + i * ARC_STEP, a = (90 - deg) * DEG;
    pts.push(Math.cos(a) * ARC_R, Math.sin(a) * ARC_R, 0);
    const t = Math.abs(deg) / ARC_MAX;
    const c = t < 0.62 ? cCyan.clone().lerp(cBlue, t / 0.62) : cBlue.clone().lerp(cRed, (t - 0.62) / 0.38);
    cols.push(c.r, c.g, c.b);
  }
  const gDim = new T.BufferGeometry();
  gDim.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
  const dim = new T.Line(gDim, new T.LineBasicMaterial({ color: 0x39506a, transparent: true, opacity: 0.95 }));
  const gLive = new T.BufferGeometry();
  gLive.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
  gLive.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
  const live = new T.Line(gLive, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
  live.geometry.setDrawRange(ARC_MID, 1);

  const tp = [];
  for (let d = -ARC_MAX; d <= ARC_MAX; d += 5) {
    const a = (90 - d) * DEG, major = d % 15 === 0, r2 = ARC_R + (major ? 0.034 : 0.016);
    tp.push(Math.cos(a) * ARC_R, Math.sin(a) * ARC_R, 0, Math.cos(a) * r2, Math.sin(a) * r2, 0);
  }
  const gT = new T.BufferGeometry();
  gT.setAttribute('position', new T.Float32BufferAttribute(tp, 3));
  const ticks = new T.LineSegments(gT, new T.LineBasicMaterial({ color: 0x4c6480, transparent: true, opacity: 0.9 }));

  /* No needle and no baseline: the machine is the needle and the floor is
     the datum. Arc, ticks, and the two red gates are the whole instrument. */
  proGroup.add(dim, live, ticks);
  return { live };
}
const PRO = buildProtractor();
proGroup.visible = false;

/* Red gates on the arc at the measured lean-over limits. */
let limitMarks = null;
function buildLimitMarks() {
  if (limitMarks) proGroup.remove(limitMarks);
  const p = [];
  for (const d of [S.limitL, -S.limitR]) {
    const a = (90 - d) * DEG;
    p.push(Math.cos(a) * (ARC_R - 0.022), Math.sin(a) * (ARC_R - 0.022), 0,
           Math.cos(a) * (ARC_R + 0.048), Math.sin(a) * (ARC_R + 0.048), 0);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  limitMarks = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xe7202e }));
  proGroup.add(limitMarks);
}

/* Single funnel for every lean change, so the measured limits always hold. */
function setLean(v, stopChicane = true) {
  if (stopChicane) S.chicane = false;
  S.leanTarget = clamp(v, -S.limitR, S.limitL);
  syncSegs();
}

/* ───────────────────────── CONTACT ENVELOPE ─────────────────────────
   Every vertex is projected onto the frontal (XY) plane and reduced to a
   per-column minimum. Because cos(theta) > 0 for any lean we care about,
   the lowest point of the leaned bike is always one of these columns —
   so this tiny table gives an exact ride-height for any angle.          */
const ENV_BINS = 2048;
let envX = null, envY = null, envN = 0, envMinX = 0, envBinW = 1;

function buildEnvelope(mesh) {
  const pos = mesh.geometry.attributes.position;
  const n = pos.count;
  mesh.updateWorldMatrix(true, false);
  const m = mesh.matrixWorld;
  const v = new T.Vector3();

  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(m);
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
  }
  const binW = (maxX - minX) / ENV_BINS;
  const colY = new Float64Array(ENV_BINS).fill(Infinity);
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(m);
    let b = ((v.x - minX) / binW) | 0;
    if (b < 0) b = 0; else if (b >= ENV_BINS) b = ENV_BINS - 1;
    if (v.y < colY[b]) colY[b] = v.y;
  }
  const xs = [], ys = [];
  for (let b = 0; b < ENV_BINS; b++) {
    if (colY[b] === Infinity) continue;
    xs.push(minX + (b + 0.5) * binW); ys.push(colY[b]);
  }
  envX = Float64Array.from(xs); envY = Float64Array.from(ys); envN = xs.length;
  envMinX = minX; envBinW = binW;
}

/* Split the envelope into the tyre contact band and everything else, by
   walking outward from the contact patch until the profile climbs away.
   Without this the tyre's own shoulder counts as "scraping" at 19deg.     */
let tLo = 0, tHi = 0;
function segmentEnvelope(mmPerUnit) {
  let ci = 0, best = Infinity;
  for (let i = 0; i < envN; i++) if (envY[i] < best) { best = envY[i]; ci = i; }
  const shoulder = best + 100 / mmPerUnit;          // 100 mm above the contact patch
  tLo = ci; while (tLo > 0 && envY[tLo - 1] < shoulder) tLo--;
  tHi = ci; while (tHi < envN - 1 && envY[tHi + 1] < shoulder) tHi++;
  S.tyreHalf = Math.max(Math.abs(envX[tLo]), Math.abs(envX[tHi]));
}

/* Ride height at a given lean: the tyres stay planted, so the machine rises
   as the contact point walks around the tyre crown. */
function liftFor(rad) {
  if (!envN) return 0;
  const s = Math.sin(rad), c = Math.cos(rad);
  let lo = Infinity;
  for (let i = tLo; i <= tHi; i++) {
    const y = envX[i] * s + envY[i] * c;
    if (y < lo) lo = y;
  }
  return lo < 0 ? -lo : 0;
}

/* Distance from the floor to the lowest piece of bodywork, at a given lean. */
function bodyClear(rad) {
  const s = Math.sin(rad), c = Math.cos(rad);
  let lo = Infinity;
  for (let i = 0; i < envN; i++) {
    if (i >= tLo && i <= tHi) continue;
    const y = envX[i] * s + envY[i] * c;
    if (y < lo) lo = y;
  }
  return lo + liftFor(rad);
}

/* Lean-over angle: where the first non-tyre part of the machine reaches the
   floor. Positive rotation tips the machine towards -X, so the left flank
   and the right flank give different answers on an asymmetric bike. */
function measureLimit(sign) {
  let last = 0;
  for (let d = 0.5; d <= ARC_MAX; d += 0.25) {
    const gap = bodyClear(sign * d * DEG);
    if (gap <= 0) return +(last + (d - last) * 0.5).toFixed(1);
    last = d;
  }
  return ARC_MAX;
}

/* ─────────────────────────── MODEL LOAD ─────────────────────────── */
const bootEl = $('#boot'), bootFill = $('#bootFill'), bootPct = $('#bootPct'), bootMsg = $('#bootMsg');
const setBoot = (p, msg) => {
  bootFill.style.width = clamp(p, 0, 100).toFixed(1) + '%';
  bootPct.textContent = Math.round(clamp(p, 0, 100)) + '%';
  if (msg) bootMsg.textContent = msg;
};

const mobile = matchMedia('(max-width: 900px)').matches || navigator.hardwareConcurrency <= 4;
if (mobile) { S.quality = 'lite'; S.reflect = false; S.fx = false; }

let bikeMesh = null, matOrig = null, matShader = null;
let unitToMM = 1, dims = null, triCount = 0, vertCount = 0;

const loader = new T.GLTFLoader();
loader.setMeshoptDecoder(T.MeshoptDecoder);
const MODEL = S.quality === 'lite' ? './assets/bike-lite.glb' : './assets/bike-hi.glb';

setBoot(4, '载入几何数据');
function fail(err) {
  console.error(err);
  bootMsg.textContent = String(err && err.message || err).slice(0, 120);
  bootMsg.style.color = '#e7202e';
  window.__lastError = err;
}
/* setTimeout, not rAF: a backgrounded tab stops painting and the whole
   setup would never run. */
loader.load(MODEL,
  (gltf) => { setBoot(92, '构建接触包络'); setTimeout(() => { try { onModel(gltf); } catch (e) { fail(e); } }, 0); },
  (e) => { if (e.lengthComputable) setBoot(4 + (e.loaded / e.total) * 82, '载入几何数据 ' + (e.loaded / 1048576).toFixed(1) + ' MB'); },
  (err) => { console.error(err); bootMsg.textContent = '模型载入失败，请通过本地服务器打开本页。'; }
);

function onModel(gltf) {
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isMesh) { bikeMesh = o; o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });

  const box = new T.Box3().setFromObject(root);
  const size = box.getSize(new T.Vector3());
  const ctr = box.getCenter(new T.Vector3());
  root.position.set(-ctr.x, -box.min.y, -ctr.z);   // centre laterally, sit on the floor
  bikeGroup.add(root);
  leanPivot.updateMatrixWorld(true);

  unitToMM = REF_LENGTH_MM / size.z;
  dims = { l: size.z * unitToMM, h: size.y * unitToMM, w: size.x * unitToMM };

  const g = bikeMesh.geometry;
  vertCount = g.attributes.position.count;
  triCount = g.index ? g.index.count / 3 : vertCount / 3;

  matOrig = bikeMesh.material;
  matOrig.envMapIntensity = 1.0;
  if (matOrig.specularColor) matOrig.specularColor.setScalar(1);   // KHR specular ships at 2.0; that blows out
  matOrig.userData.rMap = matOrig.roughnessMap;                    // stashed so CHROME can drop and restore them
  matOrig.userData.mMap = matOrig.metalnessMap;
  patchMaterial(matOrig);
  buildMaterialVariants();

  buildEnvelope(bikeMesh);
  segmentEnvelope(unitToMM);
  S.limitL = measureLimit(+1);      // tips onto the left flank
  S.limitR = measureLimit(-1);      // tips onto the right flank
  buildLimitMarks();

  key.target.position.set(0, 0.3, 0);
  applyEnv('studio');
  applyFinish(S.finish);
  buildHotspots();
  fillSpecs();
  applyQualityFlags();
  applyFraming();

  setBoot(100, '就绪');
  setTimeout(() => {
    bootEl.classList.add('is-done');
    goto('overview', true);
    setTimeout(() => bootEl.remove(), 900);
  }, 380);
}

/* ───────────────────── MATERIALS: FINISH + MODE ───────────────────── */
const cutPlane = new T.Plane(new T.Vector3(-1, 0, 0), 0);
const cutTint = new T.Color('#4fa9f5');

/* Shared uniform objects, deliberately: every finish change flips
   needsUpdate, three rebuilds the program and calls onBeforeCompile again.
   Handing it the same objects each time means the cut state survives. */
const CUT_U = { uCutOn: { value: 0 }, uCutTint: { value: cutTint } };
function patchMaterial(m) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCutOn = CUT_U.uCutOn;
    sh.uniforms.uCutTint = CUT_U.uCutTint;
    sh.fragmentShader = 'uniform float uCutOn;\nuniform vec3 uCutTint;\n' + sh.fragmentShader;
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       if (uCutOn > .5 && !gl_FrontFacing) {
         vec3 V = normalize(vViewPosition);
         float f = pow(1. - abs(dot(normalize(normal), V)), 1.9);
         gl_FragColor = vec4(uCutTint * (.085 + 2.6 * f), 1.);
       }`
    );
  };
  m.needsUpdate = true;
}

let matClay = null, matNormals = null, matXray = null;
function buildMaterialVariants() {
  matClay = new T.MeshStandardMaterial({
    color: 0xa8b0ba, roughness: 0.78, metalness: 0.0,
    normalMap: matOrig.normalMap, side: T.DoubleSide, envMapIntensity: 0.7,
  });
  patchMaterial(matClay);
  matNormals = new T.MeshNormalMaterial({ side: T.DoubleSide, flatShading: false });
  matXray = new T.ShaderMaterial({
    transparent: true, side: T.DoubleSide, depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: { uC1: { value: new T.Color('#4fa9f5') }, uC2: { value: new T.Color('#e7202e') } },
    vertexShader: `
      varying vec3 vN, vV;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uC1, uC2; varying vec3 vN, vV;
      void main(){
        float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.4);
        gl_FragColor = vec4(mix(uC1, uC2, f * .55) * (f * 1.55 + .035), f * .85 + .045);
      }`,
  });
}

const FINISH = {
  livery: { tint: '#ffffff', rough: 1.0, metal: 1.0, chrome: false,
            zh: 'LIVERY — 原始 M Motorsport 涂装，未做任何着色。' },
  ice:    { tint: '#6fa8dc', rough: 0.72, metal: 1.0, chrome: false,
            zh: 'ICE BLUE — 在原始 albedo 上乘以冷蓝，粗糙度压到 0.72，漆面更亮。' },
  frozen: { tint: '#2a2f36', rough: 1.35, metal: 1.0, chrome: false,
            zh: 'FROZEN — 深灰哑光，粗糙度提高到 1.35，高光被打散。' },
  chrome: { tint: '#d8e2ee', rough: 0.11, metal: 1.0, chrome: true,
            zh: 'CHROME — 丢弃金属/粗糙度贴图，整车按镜面金属渲染，M 三色透过反射映出来。' },
};
function applyFinish(k) {
  S.finish = k;
  const f = FINISH[k];
  matOrig.color.set(f.tint);
  matOrig.roughness = f.rough;
  matOrig.metalness = f.metal;
  if (f.chrome) {
    matOrig.roughnessMap = null; matOrig.metalnessMap = null; matOrig.envMapIntensity = 1.15;
  } else {
    matOrig.roughnessMap = matOrig.userData.rMap; matOrig.metalnessMap = matOrig.userData.mMap;
    matOrig.envMapIntensity = ENV_LOOK[S.env].envI;
  }
  matOrig.needsUpdate = true;
  const note = $('#finishNote'); if (note) note.textContent = f.zh;
  syncSegs();
}
function applyMode(k) {
  S.mode = k;
  if (!bikeMesh) return;
  bikeMesh.material = k === 'clay' ? matClay : k === 'normals' ? matNormals : k === 'xray' ? matXray : matOrig;
  bikeMesh.castShadow = k !== 'xray';
  applyCut();
  syncSegs();
}
function applyEnv(k) {
  S.env = k;
  const L = ENV_LOOK[k];
  scene.environment = getEnv(k);
  bgUniforms.uTop.value.set(L.top); bgUniforms.uMid.value.set(L.mid);
  bgUniforms.uBottom.value.set(L.bot); bgUniforms.uGlow.value.set(L.glow);
  key.color.set(L.key); key.intensity = L.keyI; key.position.set(...L.keyPos);
  rimL.color.set(L.rimL); rimL.intensity = L.rimLI;
  rimR.color.set(L.rimR); rimR.intensity = L.rimRI;
  groundColor.set(L.ground);
  floor.material.color.set(L.ground);
  renderer.toneMappingExposure = S.exposure * L.exposure;
  if (matOrig && !FINISH[S.finish].chrome) matOrig.envMapIntensity = L.envI;
  if (matClay) matClay.envMapIntensity = L.envI * 0.7;
  if (matPart) matPart.envMapIntensity = PART_FINISH[S.partFinish].env * L.envI;
  syncSegs();
}

/* ───────────────────────────── SECTION ───────────────────────────── */
function applyCut() {
  const on = S.cutOn && S.mode !== 'xray';
  const n = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[S.cutAxis];
  const sgn = S.cutFlip ? 1 : -1;
  cutPlane.normal.set(n[0] * sgn, n[1] * sgn, n[2] * sgn);
  const half = S.cutAxis === 'x' ? 0.28 : S.cutAxis === 'y' ? 0.34 : 0.60;
  const d = S.cutPos * half + (S.cutAxis === 'y' ? 0.33 : 0);   // Y cut sweeps around the machine's mid-height
  cutPlane.constant = d * -sgn;

  const planes = on ? [cutPlane] : [];
  [matOrig, matClay, matNormals].forEach(m => { if (m) { m.clippingPlanes = planes; m.clipShadows = true; } });
  CUT_U.uCutOn.value = on ? 1 : 0;

  const mm = $('#mCut'); if (mm) mm.textContent = (S.cutPos * half * unitToMM).toFixed(0) + ' mm';
  const ml = $('#mAxisLabel'); if (ml) ml.textContent = S.cutAxis.toUpperCase();
  const ma = $('#mAxis'); if (ma) ma.textContent = S.cutAxis.toUpperCase();
}

/* ───────────────────── POST-PROCESSING ───────────────────── */
let composer = null, bloom = null, gradePass = null;
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 },
    uVig: { value: 1.05 }, uGrain: { value: 0.032 }, uAberr: { value: 0.0016 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain, uAberr;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - .5;
      float r2 = dot(d, d);
      vec2 off = d * r2 * uAberr;
      vec3 c;
      c.r = texture2D(tDiffuse, vUv + off).r;
      c.g = texture2D(tDiffuse, vUv).g;
      c.b = texture2D(tDiffuse, vUv - off).b;
      c *= 1. - smoothstep(.18, .78, r2 * uVig);                    /* vignette */
      c += (hash(vUv * 900. + uTime) - .5) * uGrain;                 /* fine grain */
      gl_FragColor = vec4(c, 1.);
    }`,
};
function buildComposer() {
  composer = new T.EffectComposer(renderer);
  composer.addPass(new T.RenderPass(scene, camera));
  /* Threshold sits high and strength low: chrome bodywork clips a lot of
     pixels, and a generous bloom turns the whole fairing into one flare. */
  bloom = new T.UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.13, 0.5, 0.95);
  composer.addPass(bloom);
  composer.addPass(new T.OutputPass());
  gradePass = new T.ShaderPass(GradeShader);
  composer.addPass(gradePass);
  const smaa = new T.SMAAPass(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio());
  composer.addPass(smaa);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
}
function applyQualityFlags() {
  reflector.visible = S.reflect;
  shadowCatcher.visible = S.shadow;
  key.castShadow = S.shadow;
  if (S.fx && !composer) buildComposer();
  syncSegs();
}

/* ───────────────────────────── HOTSPOTS ─────────────────────────────
   Anchor points were picked by raycasting the actual mesh, so each one sits
   on real geometry. The stored normal is what lets a pin hide itself once
   its surface turns away from the camera.                                */
const HOTSPOTS = [
  { id:'lamp',  en:'TWIN LED HEADLAMPS', zh:'双 LED 前照灯',
    p:[0, 0.421, 0.472], n:[0, 0.43, 0.90],
    d:'两组棱角分明的 LED 主灯夹着中央进气口。扫描把灯罩里的多层反射结构一起留了下来——放大看，里面的棱线是几何，不是贴图。',
    cam:{ az: 5, el: 11, dist: 1.58, fov: 30 } },
  { id:'fork',  en:'UPSIDE-DOWN FORK', zh:'倒立式前叉',
    p:[0.071, 0.279, 0.371], n:[0.72, 0.26, 0.64],
    d:'倒立式前叉，粗的外管在上、细的内管在下，抗弯刚性比正立式高。管壁的金色是低摩擦涂层。',
    cam:{ az: 38, el: 8, dist: 1.46, fov: 32 } },
  { id:'brake', en:'RADIAL FRONT BRAKES', zh:'辐射卡钳 · 双碟',
    p:[0.071, 0.160, 0.390], n:[0.78, -0.12, 0.61],
    d:'前轮双碟配辐射安装卡钳——卡钳螺栓与碟面平行，刹车时的形变更小。碟盘上的通风孔在网格上是真的开孔。',
    cam:{ az: 50, el: 4, dist: 1.34, fov: 33 } },
  { id:'engine',en:'INLINE-FOUR',        zh:'直列四缸',
    p:[0.161, 0.300, 0.020], n:[0.97, 0.08, -0.23],
    d:'999 cc 横置直列四缸，缸体本身是承力件，直接把车架和后摇臂连起来。这块圆形盖板下面是离合器。',
    cam:{ az: 70, el: 7, dist: 1.60, fov: 32 } },
  { id:'exh',   en:'EXHAUST CAN',        zh:'排气尾段',
    p:[-0.186, 0.220, -0.240], n:[-0.87, -0.48, 0.11],
    d:'集合管从缸头下方绕过来，收进这只切角消音筒。它是全车最外凸的部件之一——左倾极限就是被这一带定住的。',
    cam:{ az: -108, el: 10, dist: 1.58, fov: 33 } },
  { id:'tail',  en:'TAIL & M STRIPES',   zh:'尾段 · M 三色',
    p:[0.089, 0.380, -0.300], n:[0.92, 0.39, -0.02],
    d:'上翘的尾段两侧压着 M Motorsport 的浅蓝 / 深蓝 / 红三色条。整车的白色车身，本来就是为了衬这三条色带存在的。',
    cam:{ az: 132, el: 16, dist: 1.62, fov: 32 } },
];
const hsEls = [];
function buildHotspots() {
  const wrap = $('#hotspots'), list = $('#hsList');
  HOTSPOTS.forEach((h, i) => {
    const el = document.createElement('button');
    el.className = 'hs'; el.type = 'button';
    el.setAttribute('aria-label', h.zh);
    el.innerHTML = `<b>${h.en}</b>`;
    el.addEventListener('click', () => selectHs(i));
    wrap.appendChild(el);
    hsEls.push(el);
    h._v = new T.Vector3(...h.p);
    h._n = new T.Vector3(...h.n).normalize();

    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><i>${String(i + 1).padStart(2, '0')}</i><b>${h.en}</b><s>${h.zh}</s></button>`;
    li.querySelector('button').addEventListener('click', () => selectHs(i));
    list.appendChild(li);
  });
  $('#hsCount').textContent = HOTSPOTS.length;
}
function selectHs(i) {
  const same = S.activeHs === i;
  S.activeHs = same ? -1 : i;
  hsEls.forEach((e, k) => e.classList.toggle('is-on', k === S.activeHs));
  $$('#hsList button').forEach((e, k) => e.classList.toggle('is-on', k === S.activeHs));
  const card = $('#hcard');
  if (S.activeHs < 0) { card.hidden = true; return; }
  const h = HOTSPOTS[i];
  $('#hcardIdx').textContent = `POINT ${String(i + 1).padStart(2, '0')} / ${String(HOTSPOTS.length).padStart(2, '0')}`;
  $('#hcardT').textContent = h.en;
  $('#hcardZh').textContent = h.zh;
  $('#hcardD').textContent = h.d;
  card.hidden = false;
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  flyTo({ ...h.cam, ty: h.p[1], tx: h.p[0] * 0.55, tz: h.p[2] * 0.35 });
}
$('#hcardX').addEventListener('click', () => {
  if (S.chapter === 'explode') selectPart(S.soloPart);
  else selectHs(S.activeHs);
});

const _wp = new T.Vector3(), _nv = new T.Vector3(), _cd = new T.Vector3();
function updateHotspots() {
  if (!hsEls.length) return;
  const show = (S.chapter === 'anatomy' || S.debugPins) && !S.uiHidden;
  const w = innerWidth, h = innerHeight;
  for (let i = 0; i < HOTSPOTS.length; i++) {
    const el = hsEls[i], d = HOTSPOTS[i];
    if (!show) { el.classList.remove('is-vis'); el.style.opacity = ''; continue; }
    _wp.copy(d._v).applyMatrix4(leanPivot.matrixWorld);
    _nv.copy(d._n).transformDirection(leanPivot.matrixWorld);
    _cd.subVectors(camera.position, _wp).normalize();
    const facing = _nv.dot(_cd);
    const p = _wp.clone().project(camera);
    const onScreen = p.z < 1 && Math.abs(p.x) < 1.15 && Math.abs(p.y) < 1.15;
    const vis = (S.debugPins || facing > 0.12) && onScreen;
    el.classList.toggle('is-vis', vis);
    if (vis) {
      el.style.transform = `translate(${(p.x * 0.5 + 0.5) * w}px, ${(-p.y * 0.5 + 0.5) * h}px)`;
      el.style.opacity = clamp((facing - 0.12) / 0.28, 0.25, 1);
    } else {
      el.style.opacity = '';
    }
  }
}

/* ───────────────────────── EXPLODED VIEW ─────────────────────────
   A second scan of the same machine, auto-segmented into 11 clusters and
   shipped without textures. The groupings come from the segmentation, not
   from a factory parts list — part_2 really does carry the exhaust and the
   clip-ons together — so the labels describe what is actually in each mesh.
   Travel directions are hand-authored: an algorithm fanning parts out from
   the centroid puts everything on top of everything else on a bike.      */
const PARTS = [
  { key:'part_1',  en:'BODYWORK',      zh:'车身覆盖件',   dir:[0, 1, 0.15],      dist:0.30,
    d:'整流罩、油箱罩、座包、尾段、风挡连成一整片壳——扫描件里它们本来就是连续曲面。' },
  { key:'part_4',  en:'ENGINE & FRAME', zh:'发动机 · 车架', dir:[0, 0, 0],        dist:0,
    d:'整台车最重的一块，也是这次分割里面数最多的。缸体本身是承力件，车架和后摇臂都吊在上面，所以拆解时它留在原位当骨架。' },
  { key:'part_8',  en:'FRONT WHEEL',   zh:'前轮',        dir:[0, 0.04, 1],      dist:0.31,
    d:'连轮胎、轮辋、刹车碟一起分出来的整组。' },
  { key:'part_10', en:'REAR WHEEL',    zh:'后轮',        dir:[0, 0.04, -1],     dist:0.31,
    d:'后轮组。轮辋的五辐造型和前轮不是一套。' },
  { key:'part_2',  en:'EXHAUST + CONTROLS', zh:'排气 · 手把组', dir:[-1, -0.08, 0], dist:0.44,
    d:'分割算法把排气尾段和手把控制组归成了一块——两处都是同一种金属材质，颜色上分不开。整块朝侧面抽出，这样两团都能看清。' },
  { key:'part_3',  en:'HUGGER',        zh:'后轮护板',     dir:[0, -0.38, -0.92], dist:0.30,
    d:'贴着后轮的护板与链条罩。' },
  { key:'part_6',  en:'FRONT FENDER',  zh:'前挡泥板',     dir:[0, 0.50, 1],      dist:0.40,
    d:'前挡泥板，跟着前叉动，不跟着前轮转。' },
  { key:'part_0',  en:'MIRRORS',       zh:'后视镜',       dir:[0, 1, 0.38],      dist:0.42,
    d:'一对镜臂。全车最宽的东西其实是它，529 mm 的车宽就是这么量出来的。' },
  { key:'part_5',  en:'SIDE DUCT',     zh:'侧导流板',     dir:[0.95, 0.20, 0],   dist:0.35,
    d:'发动机侧面的一块导流板，把气流从水箱后面导出去。' },
  { key:'part_9',  en:'PLATE BRACKET', zh:'牌照架',       dir:[0, 0.38, -1],     dist:0.46,
    d:'尾部牌照支架，唯一一个可以整块拆掉而车看起来更好看的零件。' },
  { key:'part_7',  en:'FAIRING PANEL', zh:'前罩小盖板',   dir:[0.85, 0.52, 0.32], dist:0.35,
    d:'前罩侧面的一小块盖板，2 157 个面，是这次分割里最小的一块。' },
];

const partsPivot = new T.Group();
partsPivot.visible = false;
scene.add(partsPivot);

let partsRoot = null, partsLoaded = false, partsLoading = false;
let matPart = null, matPartHot = null, matPartGhost = null;
const partMeshes = [];                       // index-aligned with PARTS

/* The teardown scan ships with no textures and no UVs, so an albedo map is
   off the table. Everything here is reflection-driven — which is exactly
   what CHROME needs, so the parts can match the rest of the site. */
const PART_FINISH = {
  chrome: { color: 0xd8e2ee, rough: 0.11, metal: 1.0,  env: 1.15,
            zh: 'CHROME — 与全站默认一致，纯镜面金属，靠环境反射成像。' },
  alloy:  { color: 0xb9c2cd, rough: 0.34, metal: 0.92, env: 1.0,
            zh: 'ALLOY — 拉丝铝，高光散开，形体边界比镜面更好读。' },
  clay:   { color: 0x97a3b2, rough: 0.62, metal: 0.10, env: 0.9,
            zh: 'CLAY — 哑光素模，只剩几何本身，适合看分割边界。' },
};
function buildPartMaterials() {
  matPart = new T.MeshStandardMaterial({ envMapIntensity: 1 });
  matPartHot = new T.MeshStandardMaterial({ color: 0x4fa9f5, roughness: 0.30, metalness: 0.55, envMapIntensity: 1.2 });
  matPartGhost = new T.MeshStandardMaterial({
    color: 0x39434f, roughness: 0.95, metalness: 0,
    transparent: true, opacity: 0.085, depthWrite: false,
  });
  applyPartFinish(S.partFinish);
}
function applyPartFinish(k) {
  S.partFinish = k;
  const f = PART_FINISH[k];
  if (matPart) {
    matPart.color.set(f.color);
    matPart.roughness = f.rough;
    matPart.metalness = f.metal;
    matPart.envMapIntensity = f.env;
    matPart.needsUpdate = true;
  }
  const note = $('#partFinishNote'); if (note) note.textContent = f.zh;
  syncSegs();
}

function loadParts(onDone) {
  if (partsLoaded) { onDone && onDone(); return; }
  if (partsLoading) return;
  partsLoading = true;
  const src = S.quality === 'lite' ? './assets/parts-lite.glb' : './assets/parts-hi.glb';
  setExplodeStatus('载入拆分件…');
  loader.load(src, (gltf) => {
    partsRoot = gltf.scene;
    partsRoot.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(partsRoot);
    const ctr = box.getCenter(new T.Vector3());
    partsRoot.position.set(-ctr.x, -box.min.y, -ctr.z);   // same normalisation as the main scan
    partsPivot.add(partsRoot);

    buildPartMaterials();
    const byName = new Map();
    partsRoot.traverse(o => {
      if (!o.isMesh) return;
      o.geometry.computeVertexNormals();                  // the export carries no normals
      o.material = matPart;
      o.castShadow = true;
      o.frustumCulled = false;
      byName.set(o.name, o);
    });
    PARTS.forEach((p, i) => {
      const m = byName.get(p.key);
      partMeshes[i] = m || null;
      if (!m) return;
      p.home = m.position.clone();                        // meshopt bakes a quantisation offset here
      p.vec = new T.Vector3(...p.dir).normalize().multiplyScalar(p.dist);
      p.box = new T.Box3().setFromObject(m);
      p.tris = m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3;
    });
    partsLoaded = true; partsLoading = false;
    setExplodeStatus(null);
    buildPartList();
    applyExplode(S.explode);
    onDone && onDone();
  }, (e) => {
    if (e.lengthComputable) setExplodeStatus(`载入拆分件 ${(e.loaded / 1048576).toFixed(1)} / ${(e.total / 1048576).toFixed(1)} MB`);
  }, (err) => { partsLoading = false; setExplodeStatus('拆分件载入失败'); console.error(err); });
}

const _pv = new T.Vector3();
function applyExplode(t) {
  S.explode = t;
  if (!partsLoaded) return;
  PARTS.forEach((p, i) => {
    const m = partMeshes[i];
    if (!m) return;
    _pv.copy(p.vec).multiplyScalar(t);
    m.position.copy(p.home).add(_pv);
  });
  const solo = S.soloPart;
  PARTS.forEach((p, i) => {
    const m = partMeshes[i];
    if (!m) return;
    m.material = (i === solo) ? matPartHot
      : (solo >= 0 && S.ghost) ? matPartGhost
      : (i === S.hoverPart) ? matPartHot : matPart;
    m.castShadow = m.material !== matPartGhost;
  });
  const el = $('#mExplode'); if (el) el.textContent = Math.round(t * 100) + '%';
  const es = $('#mSpread'); if (es) es.textContent = (t * 0.50 * unitToMM).toFixed(0) + ' mm';
}

function setExplodeStatus(msg) {
  const el = $('#explodeStatus');
  if (el) { el.textContent = msg || ''; el.hidden = !msg; }
}

/* Box-level picking: 11 boxes is instant, where a triangle-precise test on
   1.5 M faces costs ~115 ms and cannot run on pointermove. */
const _ray = new T.Raycaster(), _ndc = new T.Vector2(), _wbox = new T.Box3();
function pickPart(clientX, clientY) {
  if (!partsLoaded) return -1;
  _ndc.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  _ray.setFromCamera(_ndc, camera);
  let best = -1, bestD = Infinity;
  for (let i = 0; i < PARTS.length; i++) {
    const m = partMeshes[i];
    if (!m) continue;
    m.updateWorldMatrix(true, false);
    _wbox.copy(PARTS[i].box).applyMatrix4(
      new T.Matrix4().makeTranslation(
        m.position.x - PARTS[i].home.x, m.position.y - PARTS[i].home.y, m.position.z - PARTS[i].home.z
      )
    );
    const hit = _ray.ray.intersectBox(_wbox, _pv);
    if (hit) {
      const d = _pv.distanceTo(camera.position);
      if (d < bestD) { bestD = d; best = i; }
    }
  }
  return best;
}

function selectPart(i) {
  S.soloPart = (S.soloPart === i) ? -1 : i;
  applyExplode(S.explode);
  $$('#partList button').forEach((b, k) => b.classList.toggle('is-on', k === S.soloPart));
  syncSegs();
  const card = $('#hcard');
  if (S.soloPart < 0) { card.hidden = true; flyTo(VIEWS.explode); return; }

  const p = PARTS[S.soloPart], m = partMeshes[S.soloPart];
  if (!m) return;
  $('#hcardIdx').textContent =
    `SEGMENT ${String(S.soloPart + 1).padStart(2, '0')} / ${String(PARTS.length).padStart(2, '0')} · ` +
    `${(p.tris || 0).toLocaleString('en-US')} TRI`;
  $('#hcardT').textContent = p.en;
  $('#hcardZh').textContent = p.zh;
  $('#hcardD').textContent = p.d;
  card.hidden = false;
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';

  const c = new T.Vector3(); p.box.getCenter(c);
  c.add(_pv.copy(m.position).sub(p.home));
  const r = p.box.getSize(new T.Vector3()).length();
  flyTo({ az: 52, el: 14, dist: clamp(r * 2.05, 0.95, 2.7), fov: 33, tx: c.x * 0.7, ty: c.y, tz: c.z * 0.7 });
}

function buildPartList() {
  const list = $('#partList');
  if (!list) return;
  list.innerHTML = '';
  PARTS.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><i>${String(i + 1).padStart(2, '0')}</i>` +
      `<b>${p.en}</b><s>${p.zh}</s><u>${((p.tris || 0) / 1000).toFixed(0)}k</u></button>`;
    const b = li.querySelector('button');
    b.addEventListener('click', () => selectPart(i));
    b.addEventListener('pointerenter', () => { if (S.chapter === 'explode') { S.hoverPart = i; applyExplode(S.explode); } });
    b.addEventListener('pointerleave', () => { if (S.hoverPart === i) { S.hoverPart = -1; applyExplode(S.explode); } });
    list.appendChild(li);
  });
  $('#partCount').textContent = PARTS.length;
}

/* ──────────────────── CAMERA CHOREOGRAPHY ──────────────────── */
const VIEWS = {
  overview: { az: 38, el: 11, dist: 1.92, fov: 32, ty: 0.34 },
  lean:     { az: 20, el: 7,  dist: 1.90, fov: 33, ty: 0.30 },
  anatomy:  { az: 58, el: 13, dist: 1.72, fov: 33, ty: 0.33 },
  explode:  { az: 62, el: 15, dist: 3.10, fov: 32, ty: 0.44 },
  finish:   { az: -46,el: 15, dist: 1.88, fov: 32, ty: 0.34 },
  section:  { az: 90, el: 6,  dist: 1.70, fov: 31, ty: 0.32 },
  data:     { az: 22, el: 24, dist: 2.20, fov: 29, ty: 0.35 },
  front:    { az: 0,  el: 6,  dist: 1.55, fov: 34, ty: 0.32 },
  rear:     { az: 180,el: 8,  dist: 1.60, fov: 34, ty: 0.32 },
  side:     { az: 90, el: 4,  dist: 1.72, fov: 31, ty: 0.32 },
  top:      { az: 30, el: 62, dist: 1.95, fov: 32, ty: 0.20 },
  low:      { az: 46, el: 1.5,dist: 1.30, fov: 40, ty: 0.22 },
};
/* Flights are interpolated in spherical space, not along a straight line.
   A straight line between two orbit points cuts through the middle of the
   machine, trips OrbitControls' minimum distance, and stalls there. */
const fly = { on: false, from: null, to: null, t: 0, dur: 1 };
const _sphF = new T.Spherical(), _offF = new T.Vector3();

function currentView() {
  _offF.copy(camera.position).sub(controls.target);
  _sphF.setFromVector3(_offF);
  return {
    az: _sphF.theta / DEG, el: 90 - _sphF.phi / DEG, dist: _sphF.radius, fov: camera.fov,
    tx: controls.target.x, ty: controls.target.y, tz: controls.target.z,
  };
}
function applyView(v) {
  const az = v.az * DEG, el = clamp(v.el, -3, 87) * DEG;
  controls.target.set(v.tx, v.ty, v.tz);
  camera.position.set(
    v.tx + v.dist * Math.cos(el) * Math.sin(az),
    v.ty + v.dist * Math.sin(el),
    v.tz + v.dist * Math.cos(el) * Math.cos(az)
  );
  if (camera.fov !== v.fov) { camera.fov = v.fov; camera.updateProjectionMatrix(); }
}
function flyTo(v, instant = false) {
  const to = {
    az: v.az, el: v.el, dist: v.dist, fov: v.fov,
    tx: v.tx ?? 0, ty: v.ty ?? 0.33, tz: v.tz ?? 0,
  };
  if (instant || REDUCED) { applyView(to); controls.update(); fly.on = false; return; }
  const from = currentView();
  let d = to.az - from.az;                       // take the short way round
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  to.az = from.az + d;
  fly.from = from; fly.to = to; fly.t = 0;
  fly.dur = 0.8 + Math.min(0.6, Math.abs(d) / 240);
  fly.on = true;
}
canvas.addEventListener('pointerdown', () => { fly.on = false; }, true);
canvas.addEventListener('wheel', () => { fly.on = false; }, { passive: true });

/* ───────────────────────── CHAPTERS ───────────────────────── */
function goto(id, instant = false) {
  if (!VIEWS[id]) return;
  S.chapter = id;
  document.body.dataset.chapter = id;
  $$('.rail__i').forEach(b => b.classList.toggle('is-on', b.dataset.go === id));
  $$('.ch').forEach(s => {
    const on = s.dataset.ch === id;
    s.hidden = !on;
    if (on) { s.classList.remove('is-in'); void s.offsetWidth; s.classList.add('is-in'); }
  });
  proGroup.visible = (id === 'lean') && S.protractor;
  $('#grabHint').classList.toggle('is-vis', id === 'lean');
  if (id !== 'anatomy' && S.activeHs >= 0) selectHs(S.activeHs);
  if (id !== 'section' && S.cutOn) { S.cutOn = false; applyCut(); }
  if (id !== 'lean') { S.chicane = false; S.leanTarget = 0; }
  if (S.mode === 'xray' && id !== 'finish' && id !== 'data') applyMode('solid');

  /* the exploded view is a different scan, so the two never share the stage */
  const ex = id === 'explode';
  const sh = key.shadow.camera;
  const half = ex ? 1.75 : 1.1;
  sh.left = -half; sh.right = half; sh.top = half; sh.bottom = -half;
  sh.updateProjectionMatrix();
  leanPivot.visible = !ex;
  partsPivot.visible = ex;
  blob.visible = !ex;
  if (ex) { loadParts(); if (S.explodeTarget === 0) S.explodeTarget = 1; }
  else {
    S.explodeAuto = false; S.hoverPart = -1;
    if (S.soloPart >= 0) { S.soloPart = -1; $('#hcard').hidden = true; applyExplode(S.explode); }
    const lbl = $('#partHover'); if (lbl) lbl.hidden = true;
  }

  buildConsole(id);
  flyTo(VIEWS[id], instant);
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => goto(b.dataset.go)));

/* ─────────────────── CONSOLE (contextual per chapter) ─────────────────── */
const CONSOLE_TITLE = {
  overview: 'VIEW CONTROL', lean: 'LEAN RIG', anatomy: 'INSPECT',
  explode: 'TEARDOWN', finish: 'FINISH & LIGHT', section: 'SECTION CUT', data: 'STAGE',
};
const segRef = [];

function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function group(label) { const g = el('div', 'grp'); if (label) g.appendChild(el('div', 'grp__l', label)); return g; }
function seg(label, opts, get, set, cols) {
  const g = group(label);
  const s = el('div', `seg seg--${cols || opts.length}`);
  opts.forEach(o => {
    const b = el('button', '', o.l); b.type = 'button';
    b.addEventListener('click', () => { set(o.v); });
    s.appendChild(b);
    segRef.push({ b, on: () => get() === o.v });
  });
  g.appendChild(s); return g;
}
function toggle(label, get, set) {
  const r = el('div', 'sw');
  r.appendChild(el('span', 'sw__l', label));
  const b = el('button', 'sw__b'); b.type = 'button';
  b.setAttribute('aria-pressed', String(get()));
  b.setAttribute('aria-label', label);
  b.addEventListener('click', () => { set(!get()); b.setAttribute('aria-pressed', String(get())); });
  r.appendChild(b);
  segRef.push({ b, on: null, sync: () => b.setAttribute('aria-pressed', String(get())) });
  return r;
}
function slider(label, min, max, step, get, set, fmt) {
  const g = el('div', 'sld');
  const top = el('div', 'sld__top');
  top.appendChild(el('span', 'sld__n', label));
  const v = el('span', 'sld__v', fmt(get())); top.appendChild(v);
  const i = document.createElement('input');
  i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = get();
  i.setAttribute('aria-label', label);
  i.addEventListener('input', () => { set(parseFloat(i.value)); v.textContent = fmt(parseFloat(i.value)); });
  g.append(top, i);
  segRef.push({ b: i, on: null, sync: () => { i.value = get(); v.textContent = fmt(get()); } });
  return g;
}
function syncSegs() {
  segRef.forEach(r => { if (r.on) r.b.classList.toggle('is-on', r.on()); else if (r.sync) r.sync(); });
}

function buildConsole(id) {
  segRef.length = 0;
  const body = $('#consoleBody');
  body.innerHTML = '';
  $('#consoleTitle').textContent = CONSOLE_TITLE[id] || 'CONTROL';

  const viewSeg = () => seg('CAMERA', [
    { l: 'FRONT', v: 'front' }, { l: 'SIDE', v: 'side' }, { l: 'REAR', v: 'rear' },
    { l: 'TOP', v: 'top' }, { l: 'LOW', v: 'low' }, { l: 'HERO', v: 'overview' },
  ], () => null, v => flyTo(VIEWS[v]), 3);

  const stageToggles = () => {
    const g = group('STAGE');
    g.append(
      toggle('地面反射', () => S.reflect, v => { S.reflect = v; applyQualityFlags(); }),
      toggle('投影阴影', () => S.shadow, v => { S.shadow = v; applyQualityFlags(); }),
      toggle('电影感后期', () => S.fx, v => { S.fx = v; applyQualityFlags(); }),
    );
    return g;
  };

  if (id === 'overview') {
    body.append(viewSeg(), stageToggles(),
      slider('曝光 EXPOSURE', 0.5, 1.8, 0.01, () => S.exposure,
        v => { S.exposure = v; renderer.toneMappingExposure = v * ENV_LOOK[S.env].exposure; },
        v => v.toFixed(2)));
  }

  if (id === 'lean') {
    const lim = () => (S.leanTarget < 0 ? S.limitR : S.limitL);
    body.append(
      slider('倾角 LEAN', -S.limitR, S.limitL, 0.1, () => S.leanTarget,
        v => setLean(v), v => v.toFixed(1) + '°'),
      seg('PRESET', [
        { l: '0°', v: 0 }, { l: '20°', v: 20 }, { l: '35°', v: 35 }, { l: 'LIMIT', v: -1 },
      ], () => {
        const a = Math.abs(S.leanTarget);
        if (a >= lim() - 0.05) return -1;
        return [0, 20, 35].find(n => Math.abs(a - n) < 0.05) ?? -99;
      }, v => {
        const dir = S.leanTarget < 0 ? -1 : 1;
        setLean((v < 0 ? (dir < 0 ? S.limitR : S.limitL) : v) * dir);
      }, 4),
      toggle('连续转向 CHICANE', () => S.chicane, v => { S.chicane = v; if (v) S.chicaneT = 0; }),
      toggle('量角器 PROTRACTOR', () => S.protractor, v => { S.protractor = v; proGroup.visible = v && S.chapter === 'lean'; }),
      stageToggles(),
    );
  }

  if (id === 'anatomy') {
    const g = group('POINTS');
    const s = el('div', 'seg seg--3');
    HOTSPOTS.forEach((h, i) => {
      const b = el('button', '', String(i + 1).padStart(2, '0')); b.type = 'button';
      b.title = h.zh;
      b.addEventListener('click', () => selectHs(i));
      s.appendChild(b);
      segRef.push({ b, on: () => S.activeHs === i });
    });
    g.appendChild(s);
    body.append(g, viewSeg(), stageToggles());
  }

  if (id === 'explode') {
    body.append(
      slider('拆解 EXPLODE', 0, 1, 0.005, () => S.explodeTarget,
        v => { S.explodeAuto = false; S.explodeTarget = v; syncSegs(); },
        v => Math.round(v * 100) + '%'),
      seg('PRESET', [
        { l: '合拢', v: 0 }, { l: '50%', v: 0.5 }, { l: '全开', v: 1 },
      ], () => S.explodeTarget, v => { S.explodeAuto = false; S.explodeTarget = v; syncSegs(); }, 3),
      seg('FINISH', [
        { l: 'CHROME', v: 'chrome' }, { l: 'ALLOY', v: 'alloy' }, { l: 'CLAY', v: 'clay' },
      ], () => S.partFinish, applyPartFinish, 3),
      toggle('往复拆解 AUTO', () => S.explodeAuto, v => { S.explodeAuto = v; if (v) S.explodeT = Math.asin(clamp(S.explodeTarget * 2 - 1, -1, 1)); }),
      toggle('单件高亮 SOLO', () => S.ghost, v => { S.ghost = v; applyExplode(S.explode); }),
      seg('ENVIRONMENT', [
        { l: 'STUDIO', v: 'studio' }, { l: 'PIT', v: 'pit' },
        { l: 'DUSK', v: 'dusk' }, { l: 'NIGHT', v: 'night' },
      ], () => S.env, applyEnv, 2),
      seg('CAMERA', [
        { l: 'SIDE', v: 'side' }, { l: 'TOP', v: 'top' }, { l: 'HERO', v: 'explode' },
      ], () => null, v => flyTo(VIEWS[v]), 3),
      stageToggles(),
    );
  }

  if (id === 'finish') {
    body.append(
      seg('FINISH', [
        { l: 'LIVERY', v: 'livery' }, { l: 'ICE', v: 'ice' },
        { l: 'FROZEN', v: 'frozen' }, { l: 'CHROME', v: 'chrome' },
      ], () => S.finish, applyFinish, 2),
      seg('ENVIRONMENT', [
        { l: 'STUDIO', v: 'studio' }, { l: 'PIT', v: 'pit' },
        { l: 'DUSK', v: 'dusk' }, { l: 'NIGHT', v: 'night' },
      ], () => S.env, applyEnv, 2),
      seg('RENDER', [
        { l: 'SOLID', v: 'solid' }, { l: 'CLAY', v: 'clay' },
        { l: 'X-RAY', v: 'xray' }, { l: 'NORMAL', v: 'normals' },
      ], () => S.mode, applyMode, 2),
      slider('曝光 EXPOSURE', 0.5, 1.8, 0.01, () => S.exposure,
        v => { S.exposure = v; renderer.toneMappingExposure = v * ENV_LOOK[S.env].exposure; },
        v => v.toFixed(2)),
      stageToggles(),
    );
  }

  if (id === 'section') {
    if (!S.cutOn) { S.cutOn = true; }
    body.append(
      seg('AXIS', [{ l: 'X 横', v: 'x' }, { l: 'Y 纵', v: 'y' }, { l: 'Z 长', v: 'z' }],
        () => S.cutAxis, v => {
          S.cutAxis = v; applyCut(); syncSegs();
          flyTo(VIEWS[v === 'x' ? 'front' : v === 'y' ? 'side' : 'side']);
        }, 3),
      slider('切面 PLANE', -1, 1, 0.005, () => S.cutPos,
        v => { S.cutSweep = false; S.cutPos = v; applyCut(); syncSegs(); }, v => (v * 100).toFixed(0) + '%'),
      toggle('反向 FLIP', () => S.cutFlip, v => { S.cutFlip = v; applyCut(); }),
      toggle('自动扫描 SWEEP', () => S.cutSweep, v => { S.cutSweep = v; }),
      toggle('剖切开启 CUT', () => S.cutOn, v => { S.cutOn = v; applyCut(); }),
      stageToggles(),
    );
    applyCut();
  }

  if (id === 'data') {
    body.append(viewSeg(),
      seg('RENDER', [
        { l: 'SOLID', v: 'solid' }, { l: 'CLAY', v: 'clay' },
        { l: 'X-RAY', v: 'xray' }, { l: 'NORMAL', v: 'normals' },
      ], () => S.mode, applyMode, 2),
      stageToggles());
  }

  syncSegs();
}

/* ─────────────────────────── SPECS ─────────────────────────── */
function row(dl, k, v, u) {
  const d = document.createElement('div');
  d.innerHTML = `<dt>${k}</dt><dd>${v}${u ? `<small>${u}</small>` : ''}</dd>`;
  dl.appendChild(d);
}
function fillSpecs() {
  const m = $('#specMeasured'); m.innerHTML = '';
  row(m, '三角面 TRIANGLES', triCount.toLocaleString('en-US'));
  row(m, '顶点 VERTICES', vertCount.toLocaleString('en-US'));
  row(m, '材质 MATERIALS', '1', 'PBR');
  row(m, '贴图 TEXTURES', S.quality === 'lite' ? '3 × 1024²' : '3 × 2048²', 'WEBP');
  row(m, '传输体积 PAYLOAD', S.quality === 'lite' ? '4.1' : '10.8', 'MB');
  row(m, '压缩 COMPRESSION', 'MESHOPT', '');
  row(m, '车长 LENGTH', dims.l.toFixed(0), 'mm');
  row(m, '车高 HEIGHT', dims.h.toFixed(0), 'mm');
  row(m, '车宽 WIDTH', dims.w.toFixed(0), 'mm');
  row(m, '接地带宽 CONTACT', (S.tyreHalf * 2 * unitToMM).toFixed(0), 'mm');
  row(m, '拆分件 SEGMENTS', String(PARTS.length), 'MESHES');
  row(m, '左倾极限 LEAN L', S.limitL.toFixed(1), '°');
  row(m, '右倾极限 LEAN R', S.limitR.toFixed(1), '°');

  const r = $('#specRef'); r.innerHTML = '';
  row(r, '排量 DISPLACEMENT', '999', 'cc');
  row(r, '型式 LAYOUT', '直列四缸', 'DOHC 16V');
  row(r, '最大功率 POWER', '207', 'hp @ 13 500');
  row(r, '最大扭矩 TORQUE', '113', 'Nm @ 11 000');
  row(r, '整备质量 KERB', '197', 'kg');
  row(r, '极速 TOP SPEED', '299', 'km/h');
}

/* ───────────────────────── LEAN INTERACTION ───────────────────────── */
let dragging = false, dragX = 0, dragStart = 0;
canvas.addEventListener('pointerdown', (e) => {
  if (S.chapter !== 'lean' || e.button !== 0) return;
  dragging = true; dragX = e.clientX; dragStart = S.leanTarget;
  S.chicane = false;
  controls.enabled = false;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (dragging) { setLean(dragStart + (e.clientX - dragX) * 0.18); return; }
  if (S.chapter !== 'explode' || !partsLoaded) return;
  const i = pickPart(e.clientX, e.clientY);
  if (i !== S.hoverPart) {
    S.hoverPart = i;
    S.dirtyParts = true;
    canvas.style.cursor = i >= 0 ? 'pointer' : '';
    const lbl = $('#partHover');
    if (lbl) {
      lbl.hidden = i < 0;
      if (i >= 0) { lbl.textContent = `${PARTS[i].en} · ${PARTS[i].zh}`; lbl.style.transform = `translate(${e.clientX + 16}px, ${e.clientY - 10}px)`; }
    }
  } else if (i >= 0) {
    const lbl = $('#partHover');
    if (lbl) lbl.style.transform = `translate(${e.clientX + 16}px, ${e.clientY - 10}px)`;
  }
});
canvas.addEventListener('click', (e) => {
  if (S.chapter !== 'explode' || !partsLoaded) return;
  const i = pickPart(e.clientX, e.clientY);
  if (i >= 0) selectPart(i);
});
canvas.addEventListener('pointerleave', () => {
  if (S.hoverPart >= 0) { S.hoverPart = -1; S.dirtyParts = true; }
  const lbl = $('#partHover'); if (lbl) lbl.hidden = true;
});
const endDrag = () => { if (dragging) { dragging = false; controls.enabled = true; } };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/* ───────────────────────── CONTROLS / KEYS ───────────────────────── */
const btnAuto = $('#btnAuto');
btnAuto.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnAuto.setAttribute('aria-pressed', String(controls.autoRotate));
  if (controls.autoRotate) fly.on = false;
});
$('#btnReset').addEventListener('click', resetAll);
function resetAll() {
  setLean(0);
  controls.autoRotate = false; btnAuto.setAttribute('aria-pressed', 'false');
  flyTo(VIEWS[S.chapter]);
}
$('#btnCapture').addEventListener('click', capture);
function capture() {
  /* Re-render immediately before reading the buffer — the drawing buffer is
     cleared on swap, and this also captures the graded image, not the raw one. */
  renderFrame();
  const a = document.createElement('a');
  a.download = `S1000RR_${S.chapter}_${Math.round(Math.abs(S.lean))}deg.png`;
  a.href = renderer.domElement.toDataURL('image/png');
  a.click();
}
const help = $('#help');
const showHelp = (v) => { help.hidden = !v; };
$('#btnHelp').addEventListener('click', () => showHelp(help.hidden));
$('#helpX').addEventListener('click', () => showHelp(false));
help.addEventListener('click', e => { if (e.target === help) showHelp(false); });

const ORDER = ['overview', 'lean', 'anatomy', 'explode', 'finish', 'section', 'data'];
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  const k = e.key;
  if (k >= '1' && k <= '7') { goto(ORDER[+k - 1]); return; }
  if (k === '?' || (k === '/' && e.shiftKey)) { showHelp(help.hidden); return; }
  if (k === 'Escape') {
    showHelp(false);
    if (S.activeHs >= 0) selectHs(S.activeHs);
    if (S.soloPart >= 0) selectPart(S.soloPart);
    return;
  }
  if (k === ' ') { e.preventDefault(); btnAuto.click(); return; }
  if (k === 'r' || k === 'R') { resetAll(); return; }
  if (k === 'c' || k === 'C') { capture(); return; }
  if (k === 'h' || k === 'H') { S.uiHidden = !S.uiHidden; document.body.classList.toggle('ui-hidden', S.uiHidden); return; }
  if (S.chapter === 'lean' && (k === 'ArrowLeft' || k === 'ArrowRight')) {
    e.preventDefault();
    setLean(S.leanTarget + (k === 'ArrowLeft' ? 1 : -1) * (e.shiftKey ? 5 : 1));
  }
});

/* ─────────────────────────── RESIZE ─────────────────────────── */
/* The reading column owns the left third and the console the right edge, so
   the frustum is nudged to seat the machine in the gap between them rather
   than dead centre. */
function applyFraming() {
  const w = innerWidth, h = innerHeight;
  const narrow = w < 900;
  const shiftX = narrow ? 0 : clamp(w * 0.115, 0, 230);
  const shiftY = narrow ? h * 0.13 : h * 0.045;
  camera.setViewOffset(w, h, -shiftX, shiftY, w, h);
}
function onResize() {
  const w = innerWidth, h = innerHeight;
  camera.aspect = w / h;
  applyFraming();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
}
addEventListener('resize', onResize);

/* ─────────────────────────── LOOP ─────────────────────────── */
const tLean = $('#tLean'), tAz = $('#tAz'), tEl = $('#tEl'), tDist = $('#tDist');
const tTri = $('#tTri'), tDraw = $('#tDraw'), tFps = $('#tFps');
const leanBig = $('#leanBig'), mScrape = $('#mScrape'), mClear = $('#mClear'), mSide = $('#mSide');
const sph = new T.Spherical();
let fps = 0, frames = 0, fpsT = 0, probed = false, slowSamples = 0;
let visibleSince = performance.now();
document.addEventListener('visibilitychange', () => { visibleSince = performance.now(); slowSamples = 0; });

function renderFrame() {
  if (S.fx && composer) composer.render();
  else renderer.render(scene, camera);
}

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  renderer.info.reset();

  /* lean */
  if (S.chicane) {
    S.chicaneT += dt * 0.55;
    const s = Math.sin(S.chicaneT);
    S.leanTarget = s * (s > 0 ? S.limitL : S.limitR) * 0.94;
  }
  S.lean = REDUCED ? S.leanTarget : lerp(S.lean, S.leanTarget, 1 - Math.pow(0.002, dt));
  if (Math.abs(S.lean - S.leanTarget) < 0.005) S.lean = S.leanTarget;

  const rad = S.lean * DEG;
  leanPivot.rotation.z = rad;
  leanPivot.position.y = liftFor(rad);
  leanPivot.updateMatrixWorld(true);

  const absL = Math.abs(S.lean);
  const limit = S.lean < 0 ? S.limitR : S.limitL;
  const atLimit = absL >= limit - 0.15;
  document.body.classList.toggle('is-scraping', atLimit);

  /* protractor follows the machine */
  if (proGroup.visible) {
    const steps = Math.max(1, Math.round(absL / ARC_STEP));
    const g = PRO.live.geometry;
    if (S.lean >= 0) g.setDrawRange(ARC_MID, steps + 1);
    else g.setDrawRange(ARC_MID - steps, steps + 1);
    proGroup.position.y = leanPivot.position.y;
  }

  /* contact-pool shadow shifts and squashes with the machine */
  blob.position.x = Math.sin(rad) * 0.10;
  blob.scale.set(0.62 + absL / 60 * 0.30, 1.55, 1);
  blob.material.opacity = (S.shadow ? 0.9 : 0.55) * (1 - absL / 60 * 0.35);

  /* section sweep */
  if (S.cutSweep && S.cutOn) {
    S.cutPos = Math.sin(now * 0.00055);
    applyCut(); syncSegs();
  }

  /* teardown */
  if (S.chapter === 'explode') {
    if (S.explodeAuto) {
      S.explodeT += dt * 0.45;
      S.explodeTarget = Math.sin(S.explodeT) * 0.5 + 0.5;
    }
    const e = REDUCED ? S.explodeTarget : lerp(S.explode, S.explodeTarget, 1 - Math.pow(0.004, dt));
    if (Math.abs(e - S.explode) > 0.0004 || S.dirtyParts) { S.dirtyParts = false; applyExplode(e); }
  }

  if (gradePass) gradePass.uniforms.uTime.value = now * 0.001;

  controls.update();

  /* camera flight runs after the controls so it owns the final pose */
  if (fly.on) {
    fly.t = Math.min(1, fly.t + dt / fly.dur);
    const t = fly.t;
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const f = fly.from, g = fly.to;
    applyView({
      az: lerp(f.az, g.az, e), el: lerp(f.el, g.el, e), dist: lerp(f.dist, g.dist, e),
      tx: lerp(f.tx, g.tx, e), ty: lerp(f.ty, g.ty, e), tz: lerp(f.tz, g.tz, e),
      fov: lerp(f.fov, g.fov, e),
    });
    if (fly.t >= 1) fly.on = false;
  }

  updateHotspots();
  renderFrame();

  /* telemetry */
  frames++;
  if (now - fpsT > 420) {
    fps = Math.round(frames * 1000 / (now - fpsT)); frames = 0; fpsT = now;
    tFps.textContent = fps;
    tDraw.textContent = renderer.info.render.calls;
    tTri.textContent = (triCount / 1e6).toFixed(2) + 'M';
    if (S.chicane && S.chapter === 'lean') syncSegs();   // let the slider follow the swing

    /* One-shot quality probe. A backgrounded tab reports ~0 fps, so only
       trust samples taken while the page has been continuously visible. */
    if (!probed && triCount && document.visibilityState === 'visible' && now - visibleSince > 4000) {
      slowSamples = fps > 0 && fps < 42 ? slowSamples + 1 : 0;
      if (slowSamples >= 3) {
        probed = true;
        if (S.reflect) S.reflect = false;
        if (fps < 28 && S.fx) S.fx = false;
        applyQualityFlags();
      } else if (fps >= 50) probed = true;
    }
  }
  sph.setFromVector3(camera.position.clone().sub(controls.target));
  tAz.textContent = Math.round(((sph.theta / DEG) % 360 + 360) % 360) + '°';
  tEl.textContent = Math.round(90 - sph.phi / DEG) + '°';
  tDist.textContent = (sph.radius * unitToMM / 1000).toFixed(2) + 'm';
  tLean.textContent = S.lean.toFixed(1) + '°';

  if (S.chapter === 'lean') {
    leanBig.textContent = absL.toFixed(1);
    if (mScrape) {
      mScrape.textContent = limit.toFixed(1) + '°';
      mClear.textContent = atLimit ? '触地' : (limit - absL).toFixed(1) + '°';
      mSide.textContent = absL < 0.15 ? '直立' : (S.lean > 0 ? '左 LEFT' : '右 RIGHT');
    }
  }
});

/* first paint of the boot bar */
setBoot(2, '初始化渲染管线');

/* debug handle */
window.__RIG = {
  S, scene, camera, controls, renderer, leanPivot, bikeGroup, proGroup,
  reflector, floor, backdrop, blob, shadowCatcher, key,
  get mats() { return { matOrig, matClay, matXray, matNormals }; },
  get mesh() { return bikeMesh; },
  HOTSPOTS, hsEls, PARTS, partMeshes, loadParts, applyExplode, selectPart, pickPart, applyPartFinish,
  liftFor, bodyClear, goto, flyTo, applyEnv, applyFinish, applyMode, setLean,
  env: () => ({ n: envN, x: envX, y: envY, unitToMM, tLo, tHi }),
};
