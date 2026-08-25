// 折页几何 —— 纯函数模块,不 import 任何东西,不碰 DOM。
//
// 模型:一张纸绕一条「折痕线」做镜像反射,而不是绕书脊旋转。
// 抓取角 C 被拖到指针 P,折痕线就是 C→P 的垂直平分线。
// 折痕斜不斜完全由 P 相对 C 的方位决定 —— 横着拖得到竖直折痕(普通翻页),
// 斜着拖得到斜角掀起。一套公式覆盖两种手感,不是两段代码。
//
// 坐标系:翻页那一页的局部坐标,原点在该页左上角,y 轴向下(和 DOM 一致)。

/**
 * 关于「过点 M、法向量 n」的直线做镜像反射的 2D 矩阵。
 *
 *   R = I - 2·n·nᵀ        t = 2·(M·n)·n
 *
 * 行列式恒为 -1 —— 反射天然含一次镜像,所以被它变换的内容必须预先反镜像一次
 * 才能正过来(见 FlipBook 里 back 层的 scaleX(-1))。
 *
 * 返回 CSS matrix(a,b,c,d,e,f) 的六个分量:
 *   x' = a·x + c·y + e
 *   y' = b·x + d·y + f
 */
export function reflectionMatrix(mx, my, nx, ny) {
  const mDotN = mx * nx + my * ny
  return {
    a: 1 - 2 * nx * nx,
    b: -2 * nx * ny,
    c: -2 * nx * ny,
    d: 1 - 2 * ny * ny,
    e: 2 * mDotN * nx,
    f: 2 * mDotN * ny,
  }
}

/**
 * Sutherland-Hodgman:用半平面裁多边形。
 * keepPositive 为 true 保留 (X-M)·n ≥ 0 的一侧,否则保留 ≤ 0 的一侧。
 */
export function clipHalfPlane(poly, mx, my, nx, ny, keepPositive) {
  const out = []
  const side = (p) => (p[0] - mx) * nx + (p[1] - my) * ny
  const inside = (s) => (keepPositive ? s >= 0 : s <= 0)

  for (let i = 0; i < poly.length; i++) {
    const A = poly[i]
    const B = poly[(i + 1) % poly.length]
    const sa = side(A)
    const sb = side(B)
    const ia = inside(sa)
    const ib = inside(sb)

    if (ia) out.push(A)
    if (ia !== ib) {
      // sa 和 sb 异号,分母不会为 0
      const t = sa / (sa - sb)
      out.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])])
    }
  }
  return out
}

/** 多边形 → CSS clip-path。少于 3 点的退化多边形收成一个零面积的点。 */
export function polygonToClipPath(poly) {
  if (!poly || poly.length < 3) return 'polygon(0px 0px, 0px 0px, 0px 0px)'
  const pts = poly.map(([x, y]) => `${round(x)}px ${round(y)}px`).join(', ')
  return `polygon(${pts})`
}

/**
 * 折痕阴影。
 *
 * 关键在于渐变必须**精确起始于折痕线**,不能拿元素边界近似 —— 折痕在页面里
 * 是移动的,靠边界起算会让暗边跟折痕分家。所以按 CSS gradient line 的规范算出
 * 折痕落在渐变线上的百分比位置:
 *
 *   θ = atan2(dx, -dy)              CSS 角度(0deg 朝上,顺时针)
 *   L = |w·sinθ| + |h·cosθ|         渐变线长度
 *   t = 0.5 + ((M-O)·dir) / L       折痕位置,O 是页中心
 *
 * dir 是渐变「变淡的方向」:掀起的那层沿 -n 变淡,也就是从折痕往抓取角。
 *
 * 只有掀起层需要这条暗边。留下侧不需要 —— 折痕那一带永远被折过来的纸盖着,
 * 画在那里的阴影一次都不会被看见;纸的自由边压在下面那页上的接触阴影,
 * 由 .fb-back-wrap 上的 drop-shadow 负责,它跟着 clip 后的形状走,斜折痕也对。
 */
export function creaseGradient({ w, h, mx, my, dirX, dirY, depth, fade }) {
  const rad = Math.atan2(dirX, -dirY)
  const deg = ((rad * 180) / Math.PI + 360) % 360
  const L = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))
  if (L < 1e-6) return 'none'

  const ox = w / 2
  const oy = h / 2
  const t = 0.5 + ((mx - ox) * dirX + (my - oy) * dirY) / L
  const t2 = t + fade / L

  return `linear-gradient(${round(deg)}deg, rgba(0,0,0,${depth}) ${round(t * 100)}%, rgba(0,0,0,0) ${round(t2 * 100)}%)`
}

/**
 * 把指针约束到「这张纸真的折得出来」的范围里。
 *
 * 光限制拖拽距离不够 —— 那样往上、往右拖会让折痕横穿书脊,切下去的是撕纸不是翻页。
 * 真正的约束来自「页是钉在书脊上的」:书脊那条边一个点都不能被掀起,
 * 也就是书脊必须整条落在折痕的留下侧。
 *
 * 把这个条件写开:对书脊上任一点 S,要求 (S-M)·n ≥ 0。记 u = P-C、s = S-C,
 *
 *   (s - u/2)·u ≥ 0  →  |u|² ≤ 2(s·u)  →  |u - s|² ≤ |s|²  →  |P-S| ≤ |C-S|
 *
 * 即**抓着的角到书脊任一端的距离不能比原来更远**。刚性纸折过去只会离书脊更近或不变。
 * 落地就是角只能沿以书脊端点为圆心的圆弧摆动 —— 正好是书页绕中线转的样子。
 *
 * 可达区域 = 两个圆盘的交。求交集内离指针最近的点,只有三类候选:
 * 往某一个圆上的径向投影(落在另一个圆盘里才算数),以及两圆的交点。
 * 而两圆的交点不用解方程 —— C 到两个圆心的距离就是两个半径,所以 C 本身
 * 就是一个交点,另一个是它关于书脊的镜像(也就是翻满 180° 的位置)。
 *
 * 用交替投影也能落进可达区域,但那样不是最近点,拖到区域外时角会莫名滑一段。
 */
export function constrainToSpine(width, height, spineX, corner, pointer) {
  // 先把角按回书本的上下边界之内。
  // 只有两个圆盘的话,「往正上方拽」会被顶到圆弧上一个左上方的位置,
  // 那个位置和原角连出来的折痕是一条横跨整页的陡对角线 —— 小小一拽就把大半页甩过去。
  // 翻书时角是横着扫过书本的,不会跑到书的上头或下头,band 一夹这种情形就没了。
  // 夹在最前面是安全的:两个圆心都在 y ∈ {0, H},往圆心方向做径向投影不会把 y 顶出这个区间。
  const p0 = { x: pointer.x, y: clamp(pointer.y, 0, height) }

  const s1 = { x: spineX, y: 0, r: Math.hypot(corner.x - spineX, corner.y) }
  const s2 = { x: spineX, y: height, r: Math.hypot(corner.x - spineX, corner.y - height) }

  const inside = (p, s) => Math.hypot(p.x - s.x, p.y - s.y) <= s.r + 1e-9
  const project = (p, s) => {
    const dx = p.x - s.x
    const dy = p.y - s.y
    const d = Math.hypot(dx, dy)
    if (d <= s.r) return p
    const k = s.r / d
    return { x: s.x + dx * k, y: s.y + dy * k }
  }

  const candidates = []
  const q1 = project(p0, s1)
  if (inside(q1, s2)) candidates.push(q1)
  const q2 = project(p0, s2)
  if (inside(q2, s1)) candidates.push(q2)
  candidates.push(corner, { x: 2 * spineX - corner.x, y: corner.y })

  let best = candidates[0]
  let bestD = Infinity
  for (const c of candidates) {
    const d = Math.hypot(c.x - p0.x, c.y - p0.y)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}

/** 完全摊平、没有任何折起时的返回值。 */
export function flatFold() {
  return {
    progress: 0,
    distance: 0,
    matrix: 'matrix(1, 0, 0, 1, 0, 0)',
    clipLifted: 'polygon(0px 0px, 0px 0px, 0px 0px)',
    clipRemain: null, // null = 不裁,整页可见
    shadowLifted: 'none',
    crease: null,
  }
}

/**
 * 主函数。
 *
 * @param width     页宽(单页,不是跨页)
 * @param height    页高
 * @param corner    抓取角 {x, y},页面局部坐标
 * @param pointer   指针 {x, y},页面局部坐标
 * @param spineX    书脊所在的 x —— 右页翻向左时是 0,左页翻向右时是 width
 * @param creaseFade   折痕阴影的宽度(px)
 * @param creaseDepth  折痕阴影的最深不透明度
 */
export function fold({
  width,
  height,
  corner,
  pointer,
  spineX = 0,
  creaseFade = 110,
  creaseDepth = 0.42,
}) {
  const W = width
  const H = height
  const cx = corner.x
  const cy = corner.y

  // 先把指针拉回「折得出来」的范围 —— 这一步同时管住了纸不能拉伸(距离最多 2W,
  // 在角绕书脊转满 180° 时取到)和书脊不能被切开这两件事。
  const p = constrainToSpine(W, H, spineX, corner, pointer)
  const px = p.x
  const py = p.y
  const dx = px - cx
  const dy = py - cy
  const dist = Math.hypot(dx, dy)

  if (dist < 1e-6) return flatFold()

  const mx = (cx + px) / 2
  const my = (cy + py) / 2
  const nx = dx / dist
  const ny = dy / dist

  // progress 衡量的是「翻页完成度」,不是拖拽距离 —— 只取朝书脊那个方向的分量。
  // 否则从右上角往右上方拖(离开书脊)也会推进进度,松手就误判成翻完了。
  const toSpine = cx > spineX ? -1 : 1
  const progress = clamp((toSpine * (px - cx)) / (2 * W), 0, 1)

  const m = reflectionMatrix(mx, my, nx, ny)

  // C 落在 (X-M)·n < 0 一侧 —— M 是 CP 中点,所以 (C-M)·n = -dist/2。
  // 掀起的是含 C 的那一侧,留下的是另一侧。
  const rect = [
    [0, 0],
    [W, 0],
    [W, H],
    [0, H],
  ]
  const lifted = clipHalfPlane(rect, mx, my, nx, ny, false)
  const remain = clipHalfPlane(rect, mx, my, nx, ny, true)

  return {
    progress,
    distance: dist,
    matrix: `matrix(${round(m.a, 5)}, ${round(m.b, 5)}, ${round(m.c, 5)}, ${round(m.d, 5)}, ${round(m.e)}, ${round(m.f)})`,
    clipLifted: polygonToClipPath(lifted),
    clipRemain: polygonToClipPath(remain),
    shadowLifted: creaseGradient({
      w: W, h: H, mx, my,
      dirX: -nx, dirY: -ny,
      depth: creaseDepth, fade: creaseFade,
    }),
    crease: { mx, my, nx, ny },
  }
}

/** 抓取角落在最近的那个外角 —— 外角指远离书脊的那条竖边的上/下端。 */
export function nearestCorner(width, height, spineX, point) {
  const x = spineX === 0 ? width : 0
  const y = point.y < height / 2 ? 0 : height
  return { x, y }
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

function round(v, digits = 2) {
  const k = 10 ** digits
  return Math.round(v * k) / k
}
