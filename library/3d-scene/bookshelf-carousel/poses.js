// 姿态、展开曲线、时间轴参数 —— 对照参考视频微调都改这里,不要散进 bookshelf.js
//
// ## 核心模型:连续位置 + 展开度
//
// 组件只有一个连续量 `pos`(浮点索引)。pos = 6 表示第 6 本完全展开;
// pos = 6.5 表示正处在第 6 本和第 7 本之间。
//
// 每本书的姿态只由 t = pos - index 决定,拆成两个通道(见下面"两段式"):
//   extend 抽出度 —— 探出书架多少(书脊仍朝镜头)
//   swing  转开度 —— 在抽出的基础上绕书脊转开多少
//
// 于是"书与书之间的切换"就是 pos 从 6 走到 7 的过程,第 6 本先转回书脊再推回架里,
// 第 7 本先探出架子再转开封面,两者的抽出段首尾搭接 —— 画面上始终有书在动。
//
// 拖动 = 直接改 pos;点箭头 / 键盘 = 用 GSAP 把 pos 补间到下一个整数。
// 快速划过很多本,就是同一段开合动画被加速连播,而不是"全程只看书脊"。
//
// ## 坐标约定(three.js,书架局部空间)
//   书竖直排列,厚度沿 X,书脊朝 +Z(朝镜头),封面在 +X 面。
//   每本书有一个 pivot(Group),位于书的【左前竖棱】= 书脊那条边;
//   mesh 相对 pivot 固定偏移 (+T/2, 0, -D/2)。转 pivot.rotation.y 即"绕书脊为铰链"。
//   rotY = 0 → 书脊正对镜头;rotY = -π/2 → 封面正对镜头、书脊朝左。
//
// ## 参考视频实测(2560×1440 @120fps)
//   单次切换 ≈470ms。交接那一拍下一本已经探出书架了,不是整排平齐地等着 ——
//   这就是把"抽出"和"转开"拆成两段的原因。

/** 展示态:封面朝镜头,留 24° 让书脊在左侧仍可读 */
export const OPEN_YAW_BACK = 0.42;   // rad,越大越"侧",0 = 封面完全正对
export const OPEN_ROT_Z = 0.12;      // 顺时针轻微倾斜(prompt 的 rotateZ 7°)
export const OPEN_ROT_X = -0.05;     // 上沿略后仰

// ## 两段式:先抽出,再转开
//
// 一本书从书架到展示位分两个阶段,分开控制才连贯(参考视频里看得很清楚:
// 交接那一拍下一本已经"书脊朝外地探出书架"了,不是整排平齐地干等着):
//
//   extend(抽出度):向前推出书架 + 略微放大点亮 + 轻微歪一点,书脊始终朝镜头
//   swing (转开度):在抽出的基础上绕书脊转,把封面甩向镜头
//
// swing 的跨度完全包在 extend 内部,于是自然形成:
//   收回 = 先转回书脊(swing→0)再推回书架(extend→0)
//   展开 = 先探出书架(extend↑)再转开封面(swing↑)
// 相邻两本的 extend 首尾搭接,交接时画面上始终有书在动 —— 这就是"连贯"。
//
// t = pos - index。t>0 这本正在被离开,t<0 正在进来。
export const EXT_LEAVE = 0.45;       // 推回书架有多快(小 = 更快)
export const EXT_ENTER = 0.68;       // 多早开始探出书架(大 = 更早)
export const SWING_LEAVE = 0.22;     // 转回书脊有多快
export const SWING_ENTER = 0.38;     // 多晚才开始转开封面(小 = 更晚、更集中)

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function ramp(t, leaveSpan, enterSpan) {
  if (t >= 0) {
    const k = 1 - t / leaveSpan;
    return k <= 0 ? 0 : k >= 1 ? 1 : easeInOutCubic(k);
  }
  const k = 1 + t / enterSpan;
  return k <= 0 ? 0 : k >= 1 ? 1 : easeOutCubic(k);
}

/** 抽出度:书脊朝外地探出书架 */
export function extendAt(t) { return ramp(t, EXT_LEAVE, EXT_ENTER); }
/** 转开度:绕书脊把封面转向镜头 */
export function swingAt(t) { return ramp(t, SWING_LEAVE, SWING_ENTER); }
/** 兼容旧名:整体展开程度以转开度为准 */
export function opennessAt(t) { return swingAt(t); }

// ## 变速曲线
//
// 一次切换里三件事的节奏不一样,不能用一条均匀的 easeInOut:
//   ① 旧书转回书脊、推回架里 —— 中速
//   ② 书脊在架子里横移交接    —— 最快,一掠而过
//   ③ 新书探出、绕书脊转开    —— 最慢,这是要给人看的
// 所以把线性时间 u 重映射成 pos 进度 p:前段加速到交接点,后段长长地减速。
// PIVOT 是交接点在 pos 上的位置,PIVOT_T 是它占的时间比例 —— 后者小于前者,
// 于是"到交接点"用的时间少(快),"交接点之后"用的时间多(慢)。
const PIVOT = 0.38;      // 交接点(pos 进度)
const PIVOT_T = 0.30;    // 交接点占的时间比例
export function stepEaseFn(u) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (u < PIVOT_T) {
    const k = u / PIVOT_T;
    return PIVOT * Math.pow(k, 1.7);              // 慢起 → 加速冲到交接点
  }
  const k = (u - PIVOT_T) / (1 - PIVOT_T);
  return PIVOT + (1 - PIVOT) * (1 - Math.pow(1 - k, 2.6));   // 长长地减速展开
}

/** 时间轴(秒):离散切换时把 pos 补间过去用的 */
export const T = {
  stepDur: 0.95,           // 走一本的总时长
  stepEase: stepEaseFn,
  settleDur: 0.13,         // 末尾极短收束,不带弹性
  settleEase: 'power1.out',
  settleAmount: 0.055,     // 收束幅度(叠加在 rotZ / z 上的比例)
  lockExtra: 0.04,         // 动画结束后再锁一小会儿,防连点穿插
  reducedDur: 0.18,        // prefers-reduced-motion 的简化时长
  snapDur: 0.58,           // 拖动松手后吸附到整数
  snapEase: 'power3.out',
  flingFactor: 0.11,       // 惯性:松手速度换算成额外滑过的本数
  flingMax: 3.5,           // 一次最多甩过几本
};

/** 尺寸档:桌面 / 窄屏 */
export function metrics(isMobile) {
  return {
    activeZ: isMobile ? 0.34 : 0.33,      // 展开态前推
    activeScale: isMobile ? 0.98 : 1.0,
    activeY: isMobile ? 0.018 : 0.022,    // 略高于书架中心
    // 展开后 mesh 中心落在 pivot 右侧约 0.10(D/2·sin + T/2·cos),
    // pivot 要向左让这么多,封面才压住画面中心。几何量,两档一样。
    activeXBias: -0.088,
    shelfZ: -0.02,
    shelfScale: 0.97,
    shelfY: 0,
    neighborDim: 0.52,                     // 相邻书脊压暗到多少
    activeBright: 1.0,
    dimFalloff: 0.02,                      // 每远一本再暗多少
    lockedDim: 0.55,                       // 未开放的再压一档
    // 抽出阶段(还没转开时)的中间目标 —— 参考视频里"探出书架的书脊"就长这样
    extZ: isMobile ? 0.15 : 0.15,          // 探出多远
    extScale: 1.02,                        // 探出时略大一点(近大远小之外再加一点)
    extY: 0.008,                           // 略微抬起
    extTilt: 0.05,                         // 探出时轻微歪,不是笔直的
    extBright: 0.86,                       // 探出就先亮起来,让人知道下一本是它
  };
}

/**
 * 把一本书摆到 t = pos - index(循环时已 wrap)对应的姿态。分两段插值:
 *   书架态 --extend--> 探出态(书脊仍朝镜头) --swing--> 展开态(封面朝镜头)
 * settle 是末尾收束的余量(0..1),只轻微影响 rotZ 与 z。
 * 返回 { ext, swing },调用方拿它决定分层、灯光与虚化。
 */
export function applyPose(book, t, m, settle = 0, xOff = 0) {
  const u = book.userData;
  const px = u.rest.px + xOff;
  const locked = u.item.locked;
  const ext = locked ? 0 : extendAt(t);
  const sw = locked ? 0 : swingAt(t);

  const d = Math.abs(t);
  const dim = Math.max(0.34, m.neighborDim - Math.min(d, 8) * m.dimFalloff);
  const shelfBright = locked ? dim * m.lockedDim : dim;
  const sz = m.shelfZ + (u.rest.dz || 0) - Math.min(d, 8) * 0.004;

  let x, y, z, rotX, rotY, rotZ, scale, bright;
  if (ext <= 0) {
    x = px; y = m.shelfY; z = sz;
    rotX = 0; rotY = 0; rotZ = u.rest.tilt; scale = m.shelfScale; bright = shelfBright;
  } else {
    const st = 1 + settle * T.settleAmount;
    // 第一段:书架 → 探出(只前推,不转)
    const ez = sz + (m.extZ - sz) * ext;
    const ey = m.shelfY + (m.extY - m.shelfY) * ext;
    const eTilt = u.rest.tilt + (m.extTilt - u.rest.tilt) * ext;
    const eScale = m.shelfScale + (m.extScale - m.shelfScale) * ext;
    const eBright = shelfBright + (m.extBright - shelfBright) * ext;
    // 第二段:探出 → 展开(绕书脊转开,继续前推居中放大)
    x = px + m.activeXBias * sw;
    y = ey + (m.activeY - ey) * sw;
    z = ez + (m.activeZ * st - ez) * sw;
    rotX = OPEN_ROT_X * sw;
    rotY = (-Math.PI / 2 + OPEN_YAW_BACK) * sw;
    rotZ = eTilt + (OPEN_ROT_Z * st - eTilt) * sw;
    scale = eScale + (m.activeScale - eScale) * sw;
    bright = eBright + (m.activeBright - eBright) * sw;
  }

  const pv = u.pivot;
  pv.position.set(x, u.rest.py + y, z);
  pv.rotation.set(rotX, rotY, rotZ, 'ZYX');
  pv.scale.setScalar(scale);
  // 越突出画得越靠后,免得和相邻书脊在同深度上打架
  u.mesh.renderOrder = ext > 0.02 ? 10 + Math.round(ext * 10) : 0;
  if (Math.abs(u.bright - bright) > 0.002) {
    u.bright = bright;
    for (const mat of u.brightMats) mat.color.copy(mat.userData.base).multiplyScalar(bright);
  }
  u.ext = ext; u.swing = sw;
  u.openness = sw;   // 兼容旧字段
  return ext;
}
