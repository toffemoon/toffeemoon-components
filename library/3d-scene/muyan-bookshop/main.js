import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// 资源以模块方式导入:dev 下走 URL,build 下被 Vite 内联成 base64 data URI
import bookshopUrl from './assets/bookshop.glb';
import tangmuUrl from './assets/tangmu.png';

// ---------- 3渲2 配置 ----------
const TOON = {
  enabled: true,
  outline: true,
  outlineColor: new THREE.Color(0x3a2418), // 暖棕描边,不用纯黑
  outlineThreshold: 0.0012,                // 深度差阈值,越小线越多
};

// ---------- 镜头节点(three 坐标系:Blender (x,y,z) → (x, z, -y)) ----------
const POSES = {
  overview:     { pos: [0, 1.6, 2.2],    look: [0, 1.0, -2.0],      fov: 65, panel: null },
  cashier:      { pos: [0, 1.55, 0.15],  look: [0, 1.1, -2.6],      fov: 48, panel: 'cashier' },
  storyDisplay: { pos: [-1.2, 1.6, 0.4], look: [-1.8, 0.95, -1.0],  fov: 42, panel: 'stories' },
  // 正视右墙:侧门和门边书都在画面里
  currentStory: { pos: [2.7, 1.3, -1.0], look: [4.4, 1.15, -1.0],   fov: 50, panel: 'currentStory' },
  // 坐在玩家椅位置,平视对面的 OC 虚影
  creationDesk: { pos: [2.6, 1.18, 0.35], look: [2.6, 1.1, -1.55],  fov: 46, panel: 'creation' },
  phone:        { pos: [-1.9, 1.25, 1.0],look: [-2.4, 0.6, 0.3],    fov: 38, panel: 'chat' },
  myShelf:      { pos: [-2.7, 1.45, -1.4],look: [-4.3, 1.25, -1.5], fov: 55, panel: 'mine' },
};

// 物件名前缀 → 镜头节点(对象名来自 Blender)
const HOTSPOT_RULES = [
  ['收银台', 'cashier'], ['糖沐', 'cashier'], ['咖啡', 'cashier'], ['收银牌', 'cashier'],
  ['故事展台', 'storyDisplay'], ['展台样书', 'storyDisplay'],
  ['当前故事书', 'currentStory'], ['门边书托', 'currentStory'], ['侧门', 'currentStory'],
  ['创作桌', 'creationDesk'], ['椅-', 'creationDesk'], ['OC虚影', 'creationDesk'],
  ['手机', 'phone'],
  ['书架-', 'myShelf'],
];

const PANELS = {
  cashier:      { title: '糖沐 · 收银台', desc: '推荐、搜索、代币入口(mock)。', entries: ['看看故事书', '帮我推荐一本', '买一杯咖啡'] },
  stories:      { title: '故事书展台', desc: '热门与预设故事(mock)。', entries: ['雾港来信', '星海旅人', '月下茶会', '时之回响'] },
  currentStory: { title: '当前故事', desc: '门边那本书:你正在进行的故事。', entries: ['继续故事', '查看存档'] },
  creation:     { title: '创作桌', desc: '坐在 OC 对面创作角色、世界和故事。', entries: ['创建角色卡', '创建世界书', '创建故事卡'] },
  chat:         { title: '手机', desc: '角色一对一聊天入口。', entries: ['最近联系人', '选择角色'] },
  mine:         { title: '我的书架', desc: '存档、我的故事、卡库。', entries: ['存档', '我的故事', '角色卡', '世界书'] },
};

// ---------- 基础场景 ----------
const container = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
// 3渲2 用平直输出保色阶;写实模式用 ACES
renderer.toneMapping = TOON.enabled ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x171210);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.05, 60);
camera.position.set(...POSES.overview.pos);
camera.lookAt(new THREE.Vector3(...POSES.overview.look));

// 灯光:吊灯暖光 ×3 + 窗口冷光 + 环境底光
scene.add(new THREE.HemisphereLight(0xffe8cc, 0x2a1d12, TOON.enabled ? 1.0 : 0.4));
for (const [x, z] of [[-2.0, -0.6], [0.0, -0.2], [2.4, 0.0]]) {
  const p = new THREE.PointLight(0xffb870, TOON.enabled ? 8 : 6, 9, 2);
  p.position.set(x, 2.5, z);
  scene.add(p);
}
const windowLight = new THREE.PointLight(0xbfd8ff, 2.5, 10, 2);
windowLight.position.set(-2.6, 1.7, -3.0);
scene.add(windowLight);

// ---------- 3渲2:色阶贴图 + 材质替换 ----------
function makeGradientMap() {
  // 四阶明暗,NearestFilter 出硬色阶
  const data = new Uint8Array([
    100, 100, 100, 255,
    160, 160, 160, 255,
    219, 219, 219, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
const gradientMap = makeGradientMap();

function toonify(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const old = o.material;
    // 自发光的灯泡之类直接用纯色
    if (old.emissive && (old.emissive.getHex() !== 0 || old.emissiveIntensity > 1)) {
      o.material = new THREE.MeshBasicMaterial({ color: 0xffe2b0 });
      return;
    }
    o.material = new THREE.MeshToonMaterial({
      color: old.color ? old.color.clone() : new THREE.Color(0xffffff),
      gradientMap,
      vertexColors: !!old.vertexColors,
      transparent: old.transparent,
      opacity: old.opacity,
    });
  });
}

// ---------- 模型 ----------
const raycastTargets = [];
let tangmu = null; // 糖沐立绘 billboard

new GLTFLoader().load(bookshopUrl, (gltf) => {
  if (TOON.enabled) toonify(gltf.scene);
  scene.add(gltf.scene);
  gltf.scene.traverse((o) => {
    if (o.isMesh) {
      // 立绘替代圆柱占位
      if (o.name === '糖沐-占位' || o.name === '糖沐-头') {
        o.visible = false;
        return;
      }
      // 窗玻璃:不受光的固定天色,压暗避免刺眼
      if (o.name.startsWith('窗-')) {
        o.material = new THREE.MeshBasicMaterial({ color: 0x8fa3ad });
      }
      raycastTargets.push(o);
      o.userData.pose = poseForName(o.name);
    }
  });
  document.getElementById('loading').style.opacity = '0';
  setTimeout(() => document.getElementById('loading').remove(), 600);
  document.body.classList.add('ready');
});

// 糖沐立绘:站在收银台后,Y 轴 billboard(只绕竖轴面向相机)
new THREE.TextureLoader().load(tangmuUrl, (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  const H = 1.8;                                   // 身高(米)
  const W = H * tex.image.width / tex.image.height;
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, alphaTest: 0.5,
  });
  tangmu = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
  tangmu.position.set(0, H / 2, -2.75);
  tangmu.name = '糖沐';
  tangmu.userData.pose = 'cashier';
  scene.add(tangmu);
  raycastTargets.push(tangmu);

  // 脚下假接触影
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({ color: 0x1a0e06, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.y = 0.6;
  shadow.position.set(0, 0.012, -2.75);
  scene.add(shadow);
});

function poseForName(name) {
  for (const [prefix, pose] of HOTSPOT_RULES) {
    if (name.startsWith(prefix)) return pose;
  }
  return null;
}

// ---------- 镜头状态与缓动 ----------
const cur = { pos: new THREE.Vector3(...POSES.overview.pos), look: new THREE.Vector3(...POSES.overview.look), fov: POSES.overview.fov };
let tween = null; // {fromPos, fromLook, fromFov, toPos, toLook, toFov, start, duration, poseId}
let currentPose = 'overview';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function goTo(poseId, duration = 1100) {
  const p = POSES[poseId];
  if (!p) return;
  tween = {
    fromPos: cur.pos.clone(), fromLook: cur.look.clone(), fromFov: cur.fov,
    toPos: new THREE.Vector3(...p.pos), toLook: new THREE.Vector3(...p.look), toFov: p.fov,
    start: performance.now(), duration, poseId,
  };
  currentPose = poseId;
  closePanel();
}

// ---------- 面板 ----------
const panelEl = document.getElementById('panel');
function openPanel(id) {
  const def = PANELS[id];
  if (!def) return;
  document.getElementById('panel-title').textContent = def.title;
  document.getElementById('panel-desc').textContent = def.desc;
  const box = document.getElementById('panel-entries');
  box.innerHTML = '';
  def.entries.forEach((label) => {
    const b = document.createElement('button');
    b.className = 'entry';
    b.textContent = label;
    b.onclick = () => console.log('[entry]', label);
    box.appendChild(b);
  });
  panelEl.classList.add('open');
}
function closePanel() {
  panelEl.classList.remove('open');
}
document.getElementById('panel-close').onclick = () => { closePanel(); goTo('overview'); };

// ---------- 交互:拖动环视 + 点击热点 ----------
const el = renderer.domElement;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const drag = { active: false, lastX: 0, lastY: 0, moved: 0 };

function lookAngles() {
  const dir = cur.look.clone().sub(cur.pos);
  const yaw = Math.atan2(dir.x, -dir.z);
  const pitch = Math.asin(THREE.MathUtils.clamp(dir.y / dir.length(), -1, 1));
  return { yaw, pitch, dist: dir.length() };
}

el.addEventListener('pointerdown', (e) => {
  try { el.setPointerCapture(e.pointerId); } catch { /* 合成事件 */ }
  drag.active = true;
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  drag.moved = 0;
  el.classList.add('dragging');
});

el.addEventListener('pointermove', (e) => {
  if (drag.active && !tween) {
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    const { yaw, pitch, dist } = lookAngles();
    const nyaw = yaw - dx * 0.003;
    const npitch = THREE.MathUtils.clamp(pitch + dy * 0.003, -1.0, 1.0);
    cur.look.set(
      cur.pos.x + Math.sin(nyaw) * Math.cos(npitch) * dist,
      cur.pos.y + Math.sin(npitch) * dist,
      cur.pos.z - Math.cos(nyaw) * Math.cos(npitch) * dist,
    );
  } else if (!drag.active) {
    // hover:热点上换鼠标手势
    setNdc(e);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(raycastTargets, false)[0];
    el.classList.toggle('hotspot', !!(hit && hit.object.userData.pose));
  }
});

el.addEventListener('pointerup', (e) => {
  drag.active = false;
  el.classList.remove('dragging');
  if (drag.moved > 8) return; // 是拖拽不是点击

  setNdc(e);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(raycastTargets, false)[0];
  if (hit && hit.object.userData.pose) {
    goTo(hit.object.userData.pose);
  } else if (currentPose !== 'overview') {
    goTo('overview'); // 点空白回全景
  }
});

el.addEventListener('pointercancel', () => {
  drag.active = false;
  el.classList.remove('dragging');
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') goTo('overview');
});

function setNdc(e) {
  const r = el.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

// ---------- 描边后处理(基于深度的轮廓线) ----------
function makeSceneTarget() {
  const pr = renderer.getPixelRatio();
  const w = Math.floor(window.innerWidth * pr);
  const h = Math.floor(window.innerHeight * pr);
  const target = new THREE.WebGLRenderTarget(w, h);
  target.depthTexture = new THREE.DepthTexture(w, h);
  return target;
}
let sceneTarget = makeSceneTarget();

const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMat = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: sceneTarget.texture },
    tDepth: { value: sceneTarget.depthTexture },
    resolution: { value: new THREE.Vector2(sceneTarget.width, sceneTarget.height) },
    cameraNear: { value: camera.near },
    cameraFar: { value: camera.far },
    outlineColor: { value: TOON.outlineColor },
    threshold: { value: 0.03 },   // 相对深度差阈值
    outlineOn: { value: TOON.outline ? 1.0 : 0.0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tColor;
    uniform sampler2D tDepth;
    uniform vec2 resolution;
    uniform float cameraNear, cameraFar, threshold, outlineOn;
    uniform vec3 outlineColor;
    varying vec2 vUv;

    float linearDepth(vec2 uv) {
      float d = texture2D(tDepth, uv).x;
      float z = d * 2.0 - 1.0;
      return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
    }

    void main() {
      vec4 col = texture2D(tColor, vUv);
      if (outlineOn > 0.5) {
        vec2 px = 1.5 / resolution;
        float c = linearDepth(vUv);
        float dx = abs(linearDepth(vUv + vec2(px.x, 0.0)) - linearDepth(vUv - vec2(px.x, 0.0)));
        float dy = abs(linearDepth(vUv + vec2(0.0, px.y)) - linearDepth(vUv - vec2(0.0, px.y)));
        float rel = (dx + dy) / max(c, 0.1);          // 相对深度跳变 = 轮廓
        float line = smoothstep(threshold, threshold * 2.5, rel);
        col.rgb = mix(col.rgb, outlineColor, line * 0.8);
      }
      gl_FragColor = col;
      #include <colorspace_fragment>
    }`,
  depthTest: false,
  depthWrite: false,
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

// ---------- 主循环 ----------
function animate(now) {
  requestAnimationFrame(animate);

  if (tween) {
    const t = Math.min(1, (now - tween.start) / tween.duration);
    const k = easeInOutCubic(t);
    cur.pos.lerpVectors(tween.fromPos, tween.toPos, k);
    cur.look.lerpVectors(tween.fromLook, tween.toLook, k);
    cur.fov = THREE.MathUtils.lerp(tween.fromFov, tween.toFov, k);
    if (t >= 1) {
      const id = tween.poseId;
      tween = null;
      const panel = POSES[id].panel;
      if (panel) openPanel(panel);
    }
  }

  // 立绘只绕 Y 轴面向相机,保持直立
  if (tangmu) {
    tangmu.rotation.y = Math.atan2(
      camera.position.x - tangmu.position.x,
      camera.position.z - tangmu.position.z,
    );
  }

  camera.position.copy(cur.pos);
  camera.lookAt(cur.look);
  camera.fov = cur.fov;
  camera.updateProjectionMatrix();

  if (TOON.enabled && TOON.outline) {
    renderer.setRenderTarget(sceneTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  } else {
    renderer.render(scene, camera);
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  sceneTarget.dispose();
  sceneTarget = makeSceneTarget();
  postMat.uniforms.tColor.value = sceneTarget.texture;
  postMat.uniforms.tDepth.value = sceneTarget.depthTexture;
  postMat.uniforms.resolution.value.set(sceneTarget.width, sceneTarget.height);
});

requestAnimationFrame(animate);

// 调试/测试句柄
window.__bookshop = {
  goTo, POSES, TOON, scene, camera, raycastTargets,
  get currentPose() { return currentPose; },
  setOutline(on) { TOON.outline = on; postMat.uniforms.outlineOn.value = on ? 1 : 0; },
};
