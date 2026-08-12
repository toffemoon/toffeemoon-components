import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
// 卡面图以模块方式导入:dev 走 URL,build 内联成 base64 data URI
import cover1 from './assets/covers/cover1.png';
import cover2 from './assets/covers/cover2.png';
import cover3 from './assets/covers/cover3.jpg';
import cover4 from './assets/covers/cover4.jpg';
import cover5 from './assets/covers/cover5.jpg';

// ---------- 配置 ----------
const CONFIG = {
  cardCount: 8,
  radius: 3.4,
  autoSpeed: -0.15,      // rad/s，负值 = 俯视顺时针
  rotPerPixel: 0.005,    // 拖拽灵敏度
  inertiaDamping: 2.2,   // 惯性衰减系数
  cardWidth: 1.45,
  cardHeight: 2.05,
};

// 占位故事数据（之后替换成首页热门故事接口数据）
// cover 有值的用真实封面图,没有的走程序化占位卡面;标题都是占位,随便改
const STORIES = [
  { title: '猫尾咖啡馆', stars: 5, colors: ['#3b2a66', '#c46ba8'], cover: cover1 },
  { title: '灵魂摆渡人', stars: 5, colors: ['#16324a', '#4ba3c4'], cover: cover2 },
  { title: '卧龙', stars: 4, colors: ['#3a3142', '#9b8ec4'], cover: cover3 },
  { title: '湖畔黄昏', stars: 4, colors: ['#274a2c', '#a3c46b'], cover: cover4 },
  { title: '紫眸', stars: 4, colors: ['#4a2a16', '#c48a4b'], cover: cover5 },
  { title: '蝶梦山海', stars: 5, colors: ['#451d3a', '#d977a0'] },
  { title: '孤岛电台', stars: 4, colors: ['#1d3445', '#6bb8c4'] },
  { title: '时之沙漏', stars: 5, colors: ['#46391b', '#d4b35e'] },
];

// ---------- 卡面贴图（canvas 程序化生成，正式版换成故事封面图） ----------
function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGoldBorder(ctx, W, H) {
  const gold = ctx.createLinearGradient(0, 0, W, H);
  gold.addColorStop(0, '#e8c87a');
  gold.addColorStop(0.5, '#fff2cc');
  gold.addColorStop(1, '#b88d3f');
  ctx.strokeStyle = gold;
  ctx.lineWidth = 7;
  roundedRectPath(ctx, 9, 9, W - 18, H - 18, 24);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.55)';
  ctx.lineWidth = 2;
  roundedRectPath(ctx, 22, 22, W - 44, H - 44, 16);
  ctx.stroke();
}

function makeFrontTexture(story) {
  const W = 512, H = 736;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const paint = (img) => {
    ctx.clearRect(0, 0, W, H);
    roundedRectPath(ctx, 2, 2, W - 4, H - 4, 28);
    ctx.save();
    ctx.clip();

    if (img) {
      // 封面图等比裁切铺满
      const s = Math.max(W / img.width, H / img.height);
      const dw = img.width * s, dh = img.height * s;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      // 背景渐变
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, story.colors[0]);
      bg.addColorStop(1, story.colors[1]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 装饰圆环 + 光斑，充当占位"立绘"
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = '#ffffff';
      for (let i = 0; i < 4; i++) {
        ctx.lineWidth = 2 + i;
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.4, 60 + i * 52, i * 0.8, i * 0.8 + Math.PI * 1.4);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.3;
      const glow = ctx.createRadialGradient(W * 0.5, H * 0.38, 10, W * 0.5, H * 0.38, 220);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // 底部信息条
    const band = ctx.createLinearGradient(0, H - 260, 0, H);
    band.addColorStop(0, 'transparent');
    band.addColorStop(0.45, 'rgba(10, 6, 2, 0.78)');
    band.addColorStop(1, 'rgba(10, 6, 2, 0.92)');
    ctx.fillStyle = band;
    ctx.fillRect(0, H - 260, W, 260);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 52px "Microsoft YaHei", sans-serif';
    ctx.fillText(story.title, W / 2, H - 130);

    ctx.fillStyle = '#ffaa33';
    ctx.font = '40px sans-serif';
    const starText = '★'.repeat(story.stars);
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 14;
    ctx.fillText(starText, W / 2, H - 62);
    ctx.shadowBlur = 0;

    ctx.restore();
    drawGoldBorder(ctx, W, H);
  };

  paint(null);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  if (story.cover) {
    const img = new Image();
    img.onload = () => {
      paint(img);
      tex.needsUpdate = true;
    };
    img.onerror = () => console.warn(`封面加载失败: ${story.cover}`);
    img.src = story.cover;
  }
  return tex;
}

function makeBackTexture() {
  const W = 512, H = 736;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  roundedRectPath(ctx, 2, 2, W - 4, H - 4, 28);
  ctx.save();
  ctx.clip();
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1b1426');
  bg.addColorStop(1, '#0d0a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 中央菱形纹章
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = 'rgba(216, 178, 110, 0.8)';
  ctx.lineWidth = 4;
  ctx.strokeRect(-90, -90, 180, 180);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-110, -110, 220, 220);
  ctx.restore();

  drawGoldBorder(ctx, W, H);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGlowTexture() {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255, 196, 110, 0.55)');
  g.addColorStop(0.5, 'rgba(214, 142, 60, 0.18)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(canvas);
}

function makeSheenTexture() {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  // 斜向高光带,卡片转动时横扫过卡面
  const g = ctx.createLinearGradient(0, S, S, 0);
  g.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
  g.addColorStop(0.47, 'rgba(255, 243, 214, 0.5)');
  g.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
  g.addColorStop(0.53, 'rgba(255, 243, 214, 0.5)');
  g.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function makeBeamTexture() {
  const W = 256, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(255, 208, 130, 0.32)');
  g.addColorStop(0.6, 'rgba(255, 180, 90, 0.08)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  // 上窄下宽的梯形光束
  ctx.beginPath();
  ctx.moveTo(W * 0.32, 0);
  ctx.lineTo(W * 0.68, 0);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  // 水平方向再淡出一次，柔化光束硬边
  ctx.globalCompositeOperation = 'destination-in';
  const soft = ctx.createLinearGradient(0, 0, W, 0);
  soft.addColorStop(0, 'transparent');
  soft.addColorStop(0.35, 'rgba(0,0,0,1)');
  soft.addColorStop(0.65, 'rgba(0,0,0,1)');
  soft.addColorStop(1, 'transparent');
  ctx.fillStyle = soft;
  ctx.fillRect(0, 0, W, H);
  return new THREE.CanvasTexture(canvas);
}

// ---------- 场景 ----------
const container = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x070503);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.9, 10.5);
camera.lookAt(0, 0, 0);

// 环境反射 + 暖色主光,给 PBR 卡面提供光泽来源
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;
  scene.environmentIntensity = 0.45;

  const keyLight = new THREE.DirectionalLight(0xffd9a8, 1.1);
  keyLight.position.set(3, 6, 5);
  scene.add(keyLight);
  scene.add(new THREE.AmbientLight(0x886644, 0.35));
}

// 星尘背景
{
  const starCount = 400;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 14 + Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.6;
    positions[i * 3 + 2] = -Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffe9c4, size: 0.05, sizeAttenuation: true,
    transparent: true, opacity: 0.75, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(geo, mat));
}

// 顶部光束 + 底部光晕
{
  const beamMat = new THREE.MeshBasicMaterial({
    map: makeBeamTexture(), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(9, 11), beamMat);
  beam.position.set(0.5, 2.2, -3.2);
  beam.rotation.z = -0.12;
  scene.add(beam);

  const glowMat = new THREE.MeshBasicMaterial({
    map: makeGlowTexture(), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), glowMat);
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -1.6;
  scene.add(floorGlow);
}

// ---------- 卡环 ----------
// 倾斜容器:卡环装在斜置的"圆柱"里自转,卡片随旋转自然高低起伏
const carousel = new THREE.Group();
carousel.rotation.set(0.05, 0, 0.13);
scene.add(carousel);

const ring = new THREE.Group();
carousel.add(ring);

const backTexture = makeBackTexture();
const sheenBase = makeSheenTexture();
const cardGeometry = new THREE.PlaneGeometry(CONFIG.cardWidth, CONFIG.cardHeight);
const cardBoxGeometry = new THREE.BoxGeometry(CONFIG.cardWidth, CONFIG.cardHeight, 0.045);
// 卡片厚度截面的鎏金材质,所有卡共享
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xc9a86a, metalness: 0.85, roughness: 0.35 });
const cards = [];          // { group, frontMat, baseAngle, phase }
const raycastTargets = [];

STORIES.slice(0, CONFIG.cardCount).forEach((story, i) => {
  const baseAngle = (i / CONFIG.cardCount) * Math.PI * 2;
  const group = new THREE.Group();
  group.position.set(
    Math.sin(baseAngle) * CONFIG.radius,
    0,
    Math.cos(baseAngle) * CONFIG.radius,
  );
  group.rotation.y = baseAngle; // 卡面朝外

  const frontMat = new THREE.MeshStandardMaterial({
    map: makeFrontTexture(story), transparent: true, alphaTest: 0.1,
    roughness: 0.3, metalness: 0.35,
  });
  const backMat = new THREE.MeshStandardMaterial({
    map: backTexture, transparent: true, alphaTest: 0.1,
    roughness: 0.45, metalness: 0.35,
  });
  // 薄盒卡身:正面卡面、背面卡背、四边鎏金厚度截面
  const body = new THREE.Mesh(cardBoxGeometry, [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat]);
  body.userData.index = i;
  group.add(body);
  raycastTargets.push(body);

  // 扫光层:转到正面时一道高光横扫过卡面
  const sheenTex = sheenBase.clone();
  const sheenMat = new THREE.MeshBasicMaterial({
    map: sheenTex, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sheen = new THREE.Mesh(cardGeometry, sheenMat);
  sheen.position.z = 0.028;
  group.add(sheen);

  // 后面垫一张暗卡，做出"卡包堆叠"感
  const stackMat = new THREE.MeshStandardMaterial({
    map: backTexture, transparent: true, color: 0x777777,
    roughness: 0.5, metalness: 0.3,
  });
  const stack = new THREE.Mesh(cardGeometry, stackMat);
  stack.position.set(0.05, -0.04, -0.09);
  stack.rotation.z = 0.05;
  stack.scale.setScalar(0.98);
  group.add(stack);

  ring.add(group);
  cards.push({
    group, frontMat, baseAngle, phase: i * 1.7, sheenMat, sheenTex,
    // 每张卡固定的随机歪斜,模仿实卡摆放的不齐整
    tiltZ: Math.sin(i * 4.7) * 0.06,
    tiltX: Math.cos(i * 3.3) * 0.035,
  });
});

// ---------- 后处理 ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35,  // strength
  0.5,   // radius
  0.75,  // threshold
);
composer.addPass(bloomPass);

// ---------- 交互 ----------
const captionTitle = document.getElementById('caption-title');
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

let velocity = 0;            // 拖拽惯性角速度
let focusTarget = null;      // 点击聚焦的目标角度
let holdUntil = 0;           // 聚焦完成后停留到该时刻再恢复自动旋转
const drag = { active: false, lastX: 0, lastT: 0, moved: 0 };

const el = renderer.domElement;

el.addEventListener('pointerdown', (e) => {
  try { el.setPointerCapture(e.pointerId); } catch { /* 合成事件没有活动指针 */ }
  drag.active = true;
  drag.lastX = e.clientX;
  drag.lastT = performance.now();
  drag.moved = 0;
  velocity = 0;
  focusTarget = null;
  el.classList.add('dragging');
});

el.addEventListener('pointermove', (e) => {
  if (!drag.active) return;
  const now = performance.now();
  const dx = e.clientX - drag.lastX;
  const dt = Math.max(1, now - drag.lastT) / 1000;
  drag.lastX = e.clientX;
  drag.lastT = now;
  drag.moved += Math.abs(dx);

  const delta = dx * CONFIG.rotPerPixel;
  ring.rotation.y += delta;
  // 平滑跟踪释放瞬间的角速度
  velocity = velocity * 0.7 + (delta / dt) * 0.3;
});

el.addEventListener('pointerup', (e) => {
  drag.active = false;
  el.classList.remove('dragging');
  velocity = THREE.MathUtils.clamp(velocity, -6, 6);

  if (drag.moved < 6) {
    velocity = 0;
    handleClick(e);
  }
});

el.addEventListener('pointercancel', () => {
  drag.active = false;
  el.classList.remove('dragging');
});

function handleClick(e) {
  const rect = el.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(raycastTargets, false);
  if (hits.length === 0) return;

  // 把点中的卡转到正面（取最短弧）
  const { baseAngle } = cards[hits[0].object.userData.index];
  const current = ring.rotation.y;
  let target = -baseAngle;
  target += Math.round((current - target) / (Math.PI * 2)) * Math.PI * 2;
  focusTarget = target;
}

// ---------- 主循环 ----------
let lastTime = performance.now();
let elapsed = 0;
let frontIndex = -1;
let prevRot = 0;
let smoothedVel = 0; // 平滑后的环角速度,驱动卡片甩动


function wrapAngle(a) {
  return THREE.MathUtils.euclideanModulo(a + Math.PI, Math.PI * 2) - Math.PI;
}

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  elapsed += dt;
  const t = elapsed;

  if (!drag.active) {
    if (focusTarget !== null) {
      // 点击聚焦：缓动到目标角度
      const diff = focusTarget - ring.rotation.y;
      ring.rotation.y += diff * Math.min(1, 5 * dt);
      if (Math.abs(diff) < 0.002) {
        focusTarget = null;
        holdUntil = t + 3; // 聚焦后停留 3 秒
      }
    } else {
      // 惯性 + 自动慢转(聚焦停留期内只走惯性)
      velocity *= Math.exp(-CONFIG.inertiaDamping * dt);
      const auto = t < holdUntil ? 0 : CONFIG.autoSpeed;
      ring.rotation.y += (velocity + auto) * dt;
    }
  }

  // 环角速度(平滑),让卡片对转动有滞后甩动的反应
  const instVel = (ring.rotation.y - prevRot) / Math.max(dt, 1e-4);
  prevRot = ring.rotation.y;
  smoothedVel += (instVel - smoothedVel) * Math.min(1, 8 * dt);
  const lagY = THREE.MathUtils.clamp(smoothedVel * 0.07, -0.25, 0.25);
  const leanZ = THREE.MathUtils.clamp(smoothedVel * 0.05, -0.1, 0.1);

  // 朝向相机的卡放大提亮，其余压暗;附带多轴微摆
  let bestT = -1, bestI = -1;
  cards.forEach((card, i) => {
    const ang = wrapAngle(card.baseAngle + ring.rotation.y);
    const f = Math.max(0, Math.cos(ang));
    card.group.scale.setScalar(0.88 + 0.3 * f * f);
    card.frontMat.color.setScalar(0.45 + 0.55 * f);
    // 扫光:越接近正面越亮,光带位置随角度滑动
    card.sheenMat.opacity = f * f * f * 0.18;
    card.sheenTex.offset.x = -ang * 0.45;
    card.group.position.y = Math.sin(t * 0.9 + card.phase) * 0.07;
    card.group.rotation.y = card.baseAngle - lagY;
    card.group.rotation.z = card.tiltZ + Math.sin(t * 0.7 + card.phase) * 0.03 + leanZ;
    card.group.rotation.x = card.tiltX + Math.sin(t * 0.5 + card.phase * 1.3) * 0.025;
    if (f > bestT) { bestT = f; bestI = i; }
  });
  if (bestI !== frontIndex) {
    frontIndex = bestI;
    captionTitle.textContent = `《${STORIES[bestI].title}》`;
  }

  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// 调试/集成用句柄
window.__carousel = {
  ring, cards, camera, STORIES,
  debugClick(clientX, clientY) {
    const rect = el.getBoundingClientRect();
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObjects(raycastTargets, false);
    return {
      ndc: [pointerNDC.x.toFixed(3), pointerNDC.y.toFixed(3)],
      hits: hits.map(h => STORIES[h.object.userData.index].title),
      focusTarget,
    };
  },
};
