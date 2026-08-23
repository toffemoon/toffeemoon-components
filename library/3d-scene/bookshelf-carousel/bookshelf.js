// 书架轮播 · Bookshelf
//
// 所有书持续渲染在书架里,未选中的以竖直书脊排列,当前那本【绕自己的书脊为铰链】
// 从书架中向外展开,以 3/4 视角悬在书架前方 —— 封面和左侧书脊同时可见。
//
// 驱动模型只有一个连续量 pos(浮点索引),见 poses.js 顶部的长注释:
//   pos 从 6 走到 7 = 第 6 本合回书架、第 7 本展开,中间有一拍只剩书脊。
//   点箭头 / 键盘 = 用 GSAP 把 pos 补间到下一个整数;
//   拖动 = 直接改 pos,划过很多本就是这段开合动画被加速连播。
// 两种操作跑的是同一套姿态计算,没有第二条代码路径。
//
// 多排之间切换:整帧糊掉 → 换排(从中间那本开始)→ 清晰 → 展开。
//
// 用法:
//   const shelf = new Bookshelf(container, { rows, onChange, onActivate });
//   shelf.next() / shelf.prev() / shelf.select(i) / shelf.switchRow(1)
//
// rows: [{ id, label, items: [{ id, title, subtitle, code, color, cover, locked }] }]
import * as THREE from 'three';
import { gsap } from 'gsap';
import { makeSpineTexture, makeCoverTexture, makePaperTexture, makeGridTexture } from './textures.js';
import { LayeredBlurPost } from './post.js';
import { applyPose, metrics, T } from './poses.js';

const DEFAULTS = {
  switchMode: 'slide',        // 'slide':镜头在上下排之间滑;'swap':排在原地替换
  dragMode: 'free',           // 'free':拖多远滑多少本;'step':一次手势一本
  dragScale: 2.6,             // 拖动阻尼:要拖过一本书宽度的几倍才滑一本(大 = 更钝)
  rowGap: 0.5,                // slide 模式排间距
  depth: 0.2,                 // 书深(封面宽)
  heightRange: [0.27, 0.33],
  thicknessRange: [0.030, 0.062],
  gap: 0.019,                 // 书间隙 —— 参考图里书是分开的,能看到缝隙后面
  tiltRange: 0.13,            // 书架里每本的倾斜幅度(rad,±)
  depthJitter: 0.022,         // 每本前后错开多少,别排成一条直线
  cameraDistance: 0.95,
  fov: 36,
  hFov: 34,                   // 竖屏锁水平视角:太宽书会很小,太窄封面出画
  cameraTilt: 0.025,          // 镜头绕视轴的轻微倾斜
  touchAction: 'none',        // 页面自己不滚就 'none';宿主页要竖向滚动传 'pan-y'
  coverCache: 6,              // 同时保留几张封面贴图(按需生成,LRU)
  focusRange: 0.62,           // 景深:离焦平面多远算全糊(世界单位)。太小背景会糊成色块
  minBlurOpen: 0.06,          // 展开静止时焦点处的最低软度
  minBlurMoving: 0.22,        // 开合过程中整体再软一点
  background: 0x0b0c10,
  loop: true,                 // 书架首尾相接,可以一直往一个方向翻
  skipLocked: true,           // 切换时跳过未开放
  intro: true,                // 入场走一次"糊 → 清"
  mobileBreakpoint: 760,
  seed: 7,
};

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Bookshelf {
  constructor(container, options = {}) {
    this.container = container;
    this.opt = { ...DEFAULTS, ...options };
    this.rows = (options.rows || []).map((r, ri) => ({ ...r, index: ri, items: (r.items || []).map((it, i) => ({ ...it, index: i, rowIndex: ri })) }));

    // 宿主回调一律包起来:它们抛错不能把内部状态机卡死
    const guard = (fn) => (fn ? (...a) => { try { fn(...a); } catch (err) { console.error('[Bookshelf] host callback threw', err); } } : () => {});
    this.onChange = guard(options.onChange);
    this.onOpen = guard(options.onOpen);
    this.onActivate = guard(options.onActivate);

    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 驱动量:pos 是连续浮点索引,settle 是末尾收束余量
    this.pos = 0;
    this.settle = 0;
    this.state = { rowIndex: 0, index: 0, opened: false, moving: false, transitioning: false };
    this.books = [];
    this.rowGroups = [];
    this._coverLRU = [];
    this._decor = [];
    this._rowWidth = [];
    this._posTween = null;
    this._queued = null;      // 缓存一次输入,不堆积
    this._lastEmit = null;
    this._tmp = new THREE.Vector3();
    this._disposed = false;
    this.m = metrics(false);

    this._initRenderer();
    this._initScene();
    this._buildRows();
    this._initInteraction();

    this.post = new LayeredBlurPost(this.renderer);
    this._bg = new THREE.Color(this.opt.background);
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(container);

    this._cam = { x: 0, y: this._rowY(0) };
    this._blur = { amount: this.opt.intro ? 1 : 0, locked: false };
    this._jumpToRow(0);
    if (this.opt.intro && !this.reduced) this._blurIn(0.7);
    this.post.amount = this._blur.amount;

    this._last = performance.now();
    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  // ---------- 初始化 ----------
  _initRenderer() {
    const r = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.98;
    r.domElement.style.display = 'block';
    r.domElement.style.width = '100%';
    r.domElement.style.height = '100%';
    r.domElement.style.touchAction = this.opt.touchAction;
    this.container.appendChild(r.domElement);
    this.renderer = r;
  }

  _initScene() {
    const { opt } = this;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(opt.fov, 1, 0.02, 20);

    const hemi = new THREE.HemisphereLight(0x8e98b8, 0x17120e, 0.55);
    const key = new THREE.SpotLight(0xfff1dc, 9, 5, 0.55, 0.7, 1.4);
    key.target = new THREE.Object3D();
    const fill = new THREE.DirectionalLight(0x6f7ea8, 0.7);
    fill.position.set(-1.2, 0.6, 1.4);
    const rim = new THREE.PointLight(0xff7a45, 1.0, 1.6, 1.6);
    // 展开后书脊朝左,补一盏只照清晰层的左侧弱光,免得书脊黑成一条
    const spineFill = new THREE.DirectionalLight(0xd8dcff, 1.2);
    spineFill.position.set(-1, 0.3, 0.8);
    spineFill.layers.set(1);
    this.scene.add(spineFill);
    for (const l of [hemi, key, fill, rim]) { l.layers.enable(1); this.scene.add(l); }
    this.scene.add(key.target);
    this.lights = { hemi, key, fill, rim };

    this.paperTex = makePaperTexture();
    const grid = makeGridTexture();
    grid.repeat.set(16, 9);
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 5),
      new THREE.MeshStandardMaterial({ map: grid, roughness: 0.92, metalness: 0.25, color: 0xffffff }),
    );
    back.position.set(0, -(this.rows.length - 1) * opt.rowGap / 2, -opt.depth / 2 - 0.035);
    this.scene.add(back);
    this.backPanel = back;

    this.shelfMat = new THREE.MeshStandardMaterial({ color: 0x1d1a1c, roughness: 0.8, metalness: 0.1 });
    this.paperMat = new THREE.MeshStandardMaterial({ map: this.paperTex, roughness: 0.95 });
    this.paperMatSide = new THREE.MeshStandardMaterial({ map: this.paperTex, roughness: 0.95 });
  }

  _rowY(ri) { return this.opt.switchMode === 'slide' ? -ri * this.opt.rowGap : 0; }

  _buildRows() {
    const { opt } = this;
    const rng = mulberry32(opt.seed);
    this.rows.forEach((row, ri) => {
      const g = new THREE.Group();
      g.position.y = this._rowY(ri);
      this.scene.add(g);
      this.rowGroups.push(g);

      // 书脊排列不做成表格:厚度和间距都带轻微随机
      const specs = row.items.map((item) => ({
        item,
        H: lerp(opt.heightRange[0], opt.heightRange[1], rng()),
        Th: lerp(opt.thicknessRange[0], opt.thicknessRange[1], rng()),
        tilt: (rng() - 0.5) * 2 * opt.tiltRange,
        dz: (rng() - 0.5) * 2 * opt.depthJitter,
        jitter: (rng() - 0.5) * 0.004,
      }));
      const total = specs.reduce((s, sp) => s + sp.Th + sp.jitter, 0) + opt.gap * (specs.length - 1);
      // 循环一圈的宽度:首尾之间也留一个 gap
      this._rowWidth[ri] = total + opt.gap;
      let x = -total / 2;
      const baseY = -0.165;
      for (const sp of specs) {
        this.books.push(this._makeBook(sp, g, x, baseY, sp.H));
        x += sp.Th + sp.jitter + opt.gap;
      }

      const board = new THREE.Mesh(new THREE.BoxGeometry(Math.max(3.2, total + 1.2), 0.024, opt.depth + 0.1), this.shelfMat);
      board.position.set(0, baseY - 0.012, 0.01);
      g.add(board); this._decor.push(board);
      let fx = -total / 2 - 0.3;
      const lyingMat = this.lyingMat || (this.lyingMat = new THREE.MeshStandardMaterial({ color: 0x23262c, roughness: 0.85 }));
      while (fx < total / 2 + 0.3) {
        const w = 0.16 + rng() * 0.1, h = 0.03 + rng() * 0.02;
        const mm = new THREE.Mesh(new THREE.BoxGeometry(w, h, opt.depth * 0.95), lyingMat);
        mm.position.set(fx + w / 2, baseY - 0.024 - opt.rowGap * 0.22 + h / 2 + rng() * 0.02, -0.01);
        mm.rotation.y = (rng() - 0.5) * 0.25;
        g.add(mm); this._decor.push(mm);
        fx += w + 0.02 + rng() * 0.06;
      }
      const board2 = new THREE.Mesh(new THREE.BoxGeometry(Math.max(3.2, total + 1.2), 0.024, opt.depth + 0.1), this.shelfMat);
      board2.position.set(0, baseY - 0.024 - opt.rowGap * 0.22 - 0.012, 0.01);
      g.add(board2); this._decor.push(board2);
    });
    this._applyRowVisibility();
  }

  _makeBook(sp, group, px, baseY, H) {
    const { opt } = this;
    const { item, Th } = sp;
    const D = opt.depth;
    const geom = new THREE.BoxGeometry(Th, H, D);
    const spine = makeSpineTexture(item, Th, H, item.locked ? 512 : 1024);
    const base = new THREE.Color(item.locked ? '#26262b' : item.color);
    const std = (map, color) => {
      const mat = new THREE.MeshStandardMaterial({ map, color, roughness: 0.72, metalness: 0.04 });
      mat.userData.base = mat.color.clone();
      return mat;
    };
    // 封面按需生成(_ensureCover),先给纯色;封底永远看不见;未开放的书封面永不展开
    const coverMat = std(null, base.clone().multiplyScalar(0.55));
    const backMat = std(null, base.clone().multiplyScalar(0.45));
    const spineMat = std(spine, new THREE.Color(0xffffff));
    const topMat = std(this.paperTex, new THREE.Color(0xffffff));
    const sideMat = std(this.paperTex, new THREE.Color(0xffffff));

    const mesh = new THREE.Mesh(geom, [coverMat, backMat, topMat, topMat, spineMat, sideMat]);
    // pivot 在左前竖棱(= 书脊那条边)→ mesh 中心相对它 (+Th/2, 0, -D/2)
    mesh.position.set(Th / 2, 0, -D / 2);

    const pivot = new THREE.Group();
    pivot.position.set(px, baseY + H / 2, 0);
    pivot.add(mesh);
    group.add(pivot);

    mesh.userData.owner = pivot;
    pivot.userData = {
      item, H, T: Th, pivot, mesh,
      rest: { px, py: baseY + H / 2, tilt: sp.tilt, dz: sp.dz },
      brightMats: [coverMat, backMat, spineMat, topMat, sideMat],
      bright: -1, ext: 0, swing: 0, openness: 0,
      textures: [spine],
      cover: null,
    };
    return pivot;
  }

  /** 给这本书生成封面贴图(没有就画),并维护 LRU */
  _ensureCover(book) {
    if (!book || book.userData.item.locked) return;
    const u = book.userData;
    const lru = this._coverLRU;
    const i = lru.indexOf(book);
    if (i >= 0) { lru.splice(i, 1); lru.push(book); return; }
    const mat = u.mesh.material[0];
    u.cover = makeCoverTexture(u.item, this.opt.depth, u.H);
    mat.map = u.cover;
    mat.userData.base.set(0xffffff);
    mat.color.copy(mat.userData.base).multiplyScalar(Math.max(u.bright, 0.34));
    mat.needsUpdate = true;
    lru.push(book);
    while (lru.length > this.opt.coverCache) {
      const old = lru.shift();
      if (old.userData.ext > 0.01) { lru.push(old); break; }   // 还在画面上就别拆
      const om = old.userData.mesh.material[0];
      om.map = null;
      om.userData.base.set(new THREE.Color(old.userData.item.color).multiplyScalar(0.55));
      om.color.copy(om.userData.base).multiplyScalar(Math.max(old.userData.bright, 0.34));
      om.needsUpdate = true;
      old.userData.cover.dispose();
      const img = old.userData.cover.image; if (img && img.width > 1) { img.width = img.height = 1; }
      old.userData.cover = null;
    }
  }

  // ---------- 状态查询 ----------
  get row() { return this.rows[this.state.rowIndex]; }
  get current() { return this.row ? this.row.items[this.state.index] : null; }
  get isAnimating() { return !!(this._posTween && this._posTween.isActive()) || this.state.transitioning; }
  get dragging() { return !!(this._dragState && this._dragState.active); }
  _bookOf(ri, i) { return this.books.find((b) => b.userData.item.rowIndex === ri && b.userData.item.index === i); }
  get selectedBook() { return this._bookOf(this.state.rowIndex, this.state.index); }
  _count(ri = this.state.rowIndex) { const r = this.rows[ri]; return r ? r.items.length : 0; }
  get looping() { return this.opt.loop && this._count() > 2; }
  /** 把任意索引折回 [0, n) */
  _wrapIndex(i, ri = this.state.rowIndex) {
    const n = this._count(ri);
    if (!n) return 0;
    return ((i % n) + n) % n;
  }
  _limits(ri = this.state.rowIndex) {
    if (this.looping) return [-Infinity, Infinity];
    const items = this.rows[ri] ? this.rows[ri].items : [];
    const usable = items.map((it, i) => (this.opt.skipLocked && it.locked ? -1 : i)).filter((i) => i >= 0);
    return usable.length ? [usable[0], usable[usable.length - 1]] : [0, Math.max(0, items.length - 1)];
  }
  /** 离 p 最近的可停位置(未开放的跳过)。循环时返回绝对位置,可以超出 [0,n) */
  _snapIndex(p, ri = this.state.rowIndex) {
    const items = this.rows[ri] ? this.rows[ri].items : [];
    const n = items.length;
    if (!n) return 0;
    let best = Math.round(p), bd = Infinity;
    for (let i = 0; i < n; i++) {
      if (this.opt.skipLocked && items[i].locked) continue;
      // 循环时把候选平移到离 p 最近的那一圈
      const cand = this.looping ? i + Math.round((p - i) / n) * n : i;
      const d = Math.abs(cand - p);
      if (d < bd) { bd = d; best = cand; }
    }
    return best;
  }
  _middleIndex(ri) { return this._wrapIndex(this._snapIndex((this._count(ri) - 1) / 2, ri), ri); }
  /** 浮点位置对应的书架 x。循环时加上整圈偏移 */
  _xAt(p, ri = this.state.rowIndex) {
    const n = this._count(ri);
    if (!n) return 0;
    const ip = Math.floor(p), f = p - ip;
    if (!this.looping) {
      const i0 = clamp(ip, 0, n - 1), i1 = clamp(i0 + 1, 0, n - 1);
      const a0 = this._bookOf(ri, i0), b0 = this._bookOf(ri, i1);
      if (!a0) return 0;
      if (!b0 || i0 === i1) return a0.userData.rest.px;
      return lerp(a0.userData.rest.px, b0.userData.rest.px, clamp(f, 0, 1));
    }
    const W = this._rowWidth[ri] || 0;
    const k = Math.floor(ip / n), im = ip - k * n;
    const a = this._bookOf(ri, im);
    if (!a) return 0;
    const nx = im + 1 < n ? im + 1 : 0;
    const b = this._bookOf(ri, nx);
    const x0 = a.userData.rest.px + k * W;
    const x1 = im + 1 < n ? b.userData.rest.px + k * W : b.userData.rest.px + (k + 1) * W;
    return lerp(x0, x1, f);
  }
  /** 这本书当前该显示在哪一圈:返回 { t, xOff } */
  _relOf(book, pos) {
    const u = book.userData;
    const ri = u.item.rowIndex;
    const n = this._count(ri);
    if (!this.looping || !n) return { t: pos - u.item.index, xOff: 0 };
    const k = Math.round((pos - u.item.index) / n);
    return { t: pos - u.item.index - k * n, xOff: k * (this._rowWidth[ri] || 0) };
  }
  /** 一本书在屏幕上大约多少像素宽 —— 拖动手感的换算基准 */
  _pxPerBook() {
    const h = this.container.clientHeight || 1;
    const worldPerPx = (2 * this.opt.cameraDistance * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)) / h;
    const n = this._count();
    if (n < 2) return 140;
    const span = Math.abs(this._xAt(n - 1) - this._xAt(0)) / (n - 1);
    return Math.max(24, span / worldPerPx) * this.opt.dragScale;
  }

  _emit(force = false) {
    const sig = this.state.rowIndex + '|' + this.state.index + '|' + this.state.opened + '|' + this.state.moving + '|' + this.state.transitioning;
    if (!force && sig === this._lastEmit) return;
    this._lastEmit = sig;
    const [lo, hi] = this._limits();
    this.onChange({
      rowIndex: this.state.rowIndex, row: this.row,
      index: this.state.index, item: this.current,
      opened: this.state.opened, moving: this.state.moving, transitioning: this.state.transitioning,
      animating: this.isAnimating,
      canPrev: this.looping || this.state.index > lo,
      canNext: this.looping || this.state.index < hi,
    });
  }

  // ---------- 驱动 ----------
  /** 把 pos 补间到某个整数索引 —— 这就是"一次切换"的全部 */
  _tweenTo(index, opts) {
    const o = opts || {};
    const [lo, hi] = this._limits();
    const target = this.looping ? index : clamp(index, lo, hi);
    if (this._posTween) this._posTween.kill();
    gsap.killTweensOf(this);
    const dist = Math.abs(target - this.pos);
    if (dist < 1e-4) { this.pos = target; this._afterSettle(); return; }
    if (this.reduced) {
      this._posTween = gsap.to(this, { pos: target, duration: T.reducedDur, ease: 'power1.out', onComplete: () => this._afterSettle() });
      return;
    }
    // 走多本时时长按距离开方增长,不是线性 —— 划过 5 本不该等 5 倍时间
    const dur = o.duration != null ? o.duration : T.stepDur * Math.min(2.1, Math.pow(dist, 0.55));
    this._posTween = gsap.to(this, {
      pos: target, duration: dur, ease: o.ease || T.stepEase,
      onComplete: () => {
        // 末尾极短收束:1 → 0,不带弹性
        gsap.fromTo(this, { settle: 1 }, { settle: 0, duration: T.settleDur, ease: T.settleEase, onComplete: () => this._afterSettle() });
      },
    });
  }

  _afterSettle() {
    this.settle = 0;
    const idx = this.looping ? this._wrapIndex(Math.round(this.pos)) : Math.round(this.pos);
    if (idx !== this.state.index) this.state.index = idx;
    const b = this.selectedBook;
    const nowOpen = !!b && !b.userData.item.locked;
    const changed = nowOpen !== this.state.opened;
    this.state.opened = nowOpen;
    this._emit();
    if (changed && nowOpen) this.onOpen(b.userData.item);
    const q = this._queued; this._queued = null;
    if (q != null) gsap.delayedCall(T.lockExtra, () => { if (!this._disposed) this._tweenTo(q); });
  }

  _posTarget() { return this._posTween && this._posTween.isActive() ? this._posTween.vars.pos : this.pos; }

  /** 下一本 / 上一本:pos 走一格,中间自然演出"旧书合回 → 只剩书脊 → 新书展开" */
  _request(dir) {
    if (this.state.transitioning) return;
    const from = Math.round(this._posTarget());
    const items = this.row ? this.row.items : [];
    let next = from + dir;
    // 跳过未开放的(循环时按取模查)
    for (let guard = 0; guard < items.length + 2; guard++) {
      const it = items[this.looping ? this._wrapIndex(next) : next];
      if (!(this.opt.skipLocked && it && it.locked)) break;
      next += dir;
    }
    const [lo, hi] = this._limits();
    if (next < lo || next > hi) return;
    if (this.isAnimating) { this._queued = next; return; }   // 只缓存一次,不堆积
    this._tweenTo(next);
  }
  next() { this._request(1); }
  prev() { this._request(-1); }
  /** 滑到第 i 本 */
  select(i) {
    const items = this.row ? this.row.items : [];
    if (!items.length || i < 0 || i >= items.length || this.state.transitioning) return;
    if (this.opt.skipLocked && items[i].locked) return;
    this._queued = null;
    // 循环时走最近的一圈,不要绕远路
    const n = items.length;
    this._tweenTo(this.looping ? i + Math.round((this.pos - i) / n) * n : i);
  }
  /** 展开状态下再点 = 进入详情,交给宿主 */
  activate() { const it = this.current; if (it && !it.locked && this.state.opened) this.onActivate(it); }
  close() { /* 连续模型里没有"合上但停在原地"这一态;留空实现给宿主调 */ }

  // ---------- 层与可见性 ----------
  _applyRowVisibility() {
    if (this.opt.switchMode !== 'swap') return;
    this.rowGroups.forEach((g, ri) => { g.visible = ri === this.state.rowIndex; });
  }

  /** 切排:整帧糊 → 换排(从中间那本开始)→ 清晰 → 展开 */
  switchRow(ri) {
    if (ri < 0 || ri >= this.rows.length || ri === this.state.rowIndex || this.state.transitioning) return;
    if (this._posTween) this._posTween.kill();
    gsap.killTweensOf(this);
    this.state.transitioning = true;
    this.state.opened = false;
    this._blur.locked = true;
    this.post.blurAll = true;
    const o = { b: this._blur.amount, m: this.post.selMix };
    gsap.to(o, { m: 0, duration: 0.14, ease: 'power1.out', onUpdate: () => { this.post.selMix = o.m; } });
    gsap.to(o, {
      b: 1, duration: 0.30, ease: 'power2.inOut',
      onUpdate: () => { this._blur.amount = o.b; },
      onComplete: () => { this._jumpToRow(ri); this._blurIn(0.46); },
    });
    this._emit(true);
  }
  nextRow() { this.switchRow(Math.min(this.rows.length - 1, this.state.rowIndex + 1)); }
  prevRow() { this.switchRow(Math.max(0, this.state.rowIndex - 1)); }

  /** 峰值处换排:落到中间那本,pos 直接对齐 */
  _jumpToRow(ri) {
    this.state.rowIndex = ri;
    this.state.index = this._middleIndex(ri);
    this.state.opened = false;
    this.pos = this.state.index;
    this.settle = 0;
    this._cam.x = this._xAt(this.pos, ri);
    this._applyRowVisibility();
    this._ensureCover(this.selectedBook);
    this._emit(true);
  }

  /** 从全糊退回常态 */
  _blurIn(duration) {
    this.state.transitioning = true;
    this._blur.locked = true;
    this.post.blurAll = true;
    this.post.selMix = 0;
    const o = { b: this._blur.amount };
    gsap.to(o, {
      b: 0, duration, ease: 'power3.out',
      onUpdate: () => {
        this._blur.amount = o.b;
        this.post.selMix = clamp((1 - o.b - 0.45) / 0.55, 0, 1);
      },
      onComplete: () => {
        this.post.blurAll = false;
        this.post.selMix = 1;
        this._blur.locked = false;
        this.state.transitioning = false;
        this.state.opened = !!this.current && !this.current.locked;
        this._emit(true);
        if (this.state.opened) this.onOpen(this.current);
      },
    });
  }

  // ---------- 交互 ----------
  _initInteraction() {
    const el = this.renderer.domElement;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.layers.enableAll();
    this._ndc = new THREE.Vector2();
    const drag = { active: false, id: null, x0: 0, y0: 0, p0: 0, moved: 0, lastX: 0, lastT: 0, v: 0, stepped: false };
    this._dragState = drag;

    const setNdc = (e) => {
      const r = el.getBoundingClientRect();
      this._ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const pick = (e) => {
      setNdc(e);
      this.raycaster.setFromCamera(this._ndc, this.camera);
      // three 的 Raycaster 不看 visible:swap 模式下隐藏排和当前排共面,必须只给当前排
      const ri = this.state.rowIndex;
      const meshes = this.books.filter((b) => b.parent.visible && b.userData.item.rowIndex === ri).map((b) => b.userData.mesh);
      const hits = this.raycaster.intersectObjects(meshes, false);
      return hits.length ? hits[0].object.userData.owner : null;
    };

    this._onDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (this.state.transitioning || drag.active) return;
      if (this._posTween) this._posTween.kill();
      gsap.killTweensOf(this);
      this.settle = 0;
      drag.active = true; drag.id = e.pointerId; drag.x0 = drag.lastX = e.clientX; drag.y0 = e.clientY;
      drag.p0 = this.pos; drag.moved = 0; drag.v = 0; drag.stepped = false; drag.lastT = performance.now();
      try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
    };
    this._onMove = (e) => {
      if (drag.active) {
        if (e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x0;
        drag.moved = Math.max(drag.moved, Math.hypot(dx, e.clientY - drag.y0));
        if (this.opt.dragMode === 'step') {
          if (!drag.stepped && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - drag.y0) * 1.2) {
            drag.stepped = true;
            this._request(dx < 0 ? 1 : -1);
          }
          return;
        }
        // 连续:拖多远滑多少本,pos 直接跟手 —— 开合动画随之被"擦洗"播放
        const per = this._pxPerBook();
        let p = drag.p0 - dx / per;
        if (!this.looping) {
          const [lo, hi] = this._limits();
          if (p < lo) p = lo - (lo - p) * 0.35;    // 边界阻力
          if (p > hi) p = hi + (p - hi) * 0.35;
        }
        this.pos = p;
        const now = performance.now(), dt = Math.max(1, now - drag.lastT) / 1000;
        drag.v = lerp(drag.v, -(e.clientX - drag.lastX) / per / dt, 0.5);   // 本/秒
        drag.lastX = e.clientX; drag.lastT = now;
        return;
      }
      if (e.pointerType === 'mouse') el.style.cursor = pick(e) ? 'pointer' : '';
    };
    this._onUp = (e) => {
      if (!drag.active || e.pointerId !== drag.id) return;
      drag.active = false; drag.id = null;
      if (drag.moved > 8) {
        if (this.opt.dragMode === 'step') return;
        // 松手:按速度甩出去若干本,再吸附到最近的可停位
        const stale = performance.now() - drag.lastT > 80;
        const fling = stale ? 0 : clamp(drag.v * T.flingFactor, -T.flingMax, T.flingMax);
        const target = this._snapIndex(this.pos + fling);
        this._tweenTo(target, { duration: Math.max(T.snapDur, Math.min(1.05, Math.abs(target - this.pos) * 0.2)), ease: T.snapEase });
        return;
      }
      const hit = pick(e);
      if (!hit || this.state.transitioning) return;
      const { item } = hit.userData;
      if (item.index === this.state.index) { if (this.state.opened) this.activate(); }
      else this.select(item.index);
    };
    let wheelLock = 0;
    this._onWheel = (e) => {
      if (this.state.transitioning) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLock) return;
      wheelLock = now + 260;   // 节流:触控板一次滚动不要连跳好几本
      this._request(d > 0 ? 1 : -1);
    };
    this._onKey = (e) => {
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      switch (e.key) {
        case 'ArrowRight': this.next(); break;
        case 'ArrowLeft': this.prev(); break;
        case 'ArrowDown': this.nextRow(); break;
        case 'ArrowUp': this.prevRow(); break;
        case 'Enter': case ' ': this.activate(); e.preventDefault(); break;
        default: return;
      }
    };
    el.addEventListener('pointerdown', this._onDown);
    el.addEventListener('pointermove', this._onMove);
    el.addEventListener('pointerup', this._onUp);
    el.addEventListener('pointercancel', this._onUp);
    el.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKey);
  }

  // ---------- 每帧 ----------
  _resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    const hFov = THREE.MathUtils.degToRad(this.opt.hFov);
    this.camera.fov = aspect < 1 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hFov / 2) / aspect)) : this.opt.fov;
    this.camera.updateProjectionMatrix();
    this.post.setSize(w, h);
    this.m = metrics(w < this.opt.mobileBreakpoint);
  }

  _loop(now) {
    if (this._disposed) return;
    this._raf = requestAnimationFrame((t) => this._loop(t));
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;

    const ri = this.state.rowIndex;
    // 所有书按同一个 pos 摆位 —— 拖动和补间跑的是同一条路径
    let maxExt = 0, maxSwing = 0, hot = null;
    for (const b of this.books) {
      const own = b.userData.item.rowIndex === ri;
      const rel = own ? this._relOf(b, this.pos) : { t: 9, xOff: 0 };
      const ext = applyPose(b, rel.t, this.m, this.settle, rel.xOff);
      // 只要探出书架就进清晰层 —— 交接那一拍两本都清晰,才连得上
      const on = b.userData.item.rowIndex === ri && ext > 0.04;
      b.userData.mesh.layers.set(on ? 1 : 0);
      if (on && ext > maxExt) { maxExt = ext; hot = b; }
      if (on && b.userData.swing > maxSwing) maxSwing = b.userData.swing;
    }

    // 当前索引 = pos 四舍五入
    const idx = this.looping ? this._wrapIndex(Math.round(this.pos))
      : clamp(Math.round(this.pos), 0, Math.max(0, this._count() - 1));
    if (idx !== this.state.index) {
      this.state.index = idx;
      this.state.opened = false;
      this._ensureCover(this.selectedBook);
    }
    const moving = this.dragging || this.isAnimating || Math.abs(this.pos - Math.round(this.pos)) > 0.004;
    if (moving !== this.state.moving) this.state.moving = moving;
    if (!moving && !this.state.transitioning && !this.state.opened) {
      const cur = this.current;
      if (cur && !cur.locked) { this.state.opened = true; this.onOpen(cur); }
    }
    // 提前把即将展开的那本的封面画出来,避免开到一半才出现
    if (moving) this._ensureCover(this._bookOf(ri, this._snapIndex(this.pos)));
    this._emit();

    // 镜头:x 跟着 pos 在书架上平移,y 跟排
    this._cam.x = this._xAt(this.pos, ri);
    this._cam.y = damp(this._cam.y, this._rowY(ri) + 0.015, 8, dt);
    this.camera.position.set(this._cam.x, this._cam.y, this.opt.cameraDistance);
    this.camera.lookAt(this._cam.x, this._cam.y, 0);
    this.camera.rotateZ(this.opt.cameraTilt);

    // 灯跟随开得最大的那本
    const lit = hot || this.selectedBook;
    if (lit) {
      const p = lit.userData.mesh.getWorldPosition(this._tmp);
      const { key, rim } = this.lights;
      const kx = lerp(0.25, -0.3, maxSwing);   // 转开后主灯换到左前,照到书脊
      key.position.set(damp(key.position.x, p.x + kx, 9, dt), damp(key.position.y, p.y + 0.75, 9, dt), damp(key.position.z, p.z + 0.65, 9, dt));
      key.target.position.set(damp(key.target.position.x, p.x, 9, dt), damp(key.target.position.y, p.y, 9, dt), damp(key.target.position.z, p.z, 9, dt));
      key.target.updateMatrixWorld();
      rim.position.set(p.x + 0.5, p.y + 0.2, p.z - 0.05);
      rim.intensity = damp(rim.intensity, lerp(1.0, 1.5, maxSwing), 6, dt);
    }

    // 景深:焦平面跟着"最突出的那本"走,书开得越大焦点越靠前、背景越糊得开
    const focusZ = lit ? this.opt.cameraDistance - lit.position.z : this.opt.cameraDistance;
    this.post.focus = damp(this.post.focus, focusZ, 10, dt);
    this.post.focusRange = this.opt.focusRange;
    this.post.minBlur = damp(this.post.minBlur, lerp(this.opt.minBlurMoving, this.opt.minBlurOpen, maxSwing), 8, dt);
    // amount 只在切排过场时推满,平时为 0(景深自己管背景)
    if (!this._blur.locked) this._blur.amount = damp(this._blur.amount, 0, 9, dt);
    this.post.amount = this._blur.amount;

    this.post.render(this.scene, this.camera, this._bg, dt);
  }

  dispose() {
    this._disposed = true;
    cancelAnimationFrame(this._raf);
    if (this._posTween) this._posTween.kill();
    gsap.killTweensOf(this);
    this._ro.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this._onDown);
    el.removeEventListener('pointermove', this._onMove);
    el.removeEventListener('pointerup', this._onUp);
    el.removeEventListener('pointercancel', this._onUp);
    el.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKey);
    for (const b of this.books) {
      const u = b.userData;
      u.mesh.geometry.dispose();
      for (const t of u.textures) t.dispose();
      if (u.cover) u.cover.dispose();
      for (const m of u.mesh.material) if (m !== this.paperMat && m !== this.paperMatSide) m.dispose();
    }
    for (const d of this._decor) d.geometry.dispose();
    if (this.lyingMat) this.lyingMat.dispose();
    this.paperMat.dispose(); this.paperMatSide.dispose(); this.paperTex.dispose(); this.shelfMat.dispose();
    this.backPanel.geometry.dispose(); this.backPanel.material.map.dispose(); this.backPanel.material.dispose();
    this.post.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();   // renderer.dispose() 不丢上下文,反复重建会攒到浏览器强杀
    el.remove();
  }
}
