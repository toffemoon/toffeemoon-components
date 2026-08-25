// 涟漪转场 —— 从落点扩开一圈圈水纹,盖满的那一下换页,然后淡出。
//
// 前身是同目录的落墨转场(inkTransition):一个纯色层 + clip-path: circle() 涨圆。
// 那份实现的注释里按钮就叫「涟漪入局」,但画出来是一滴墨 —— 名实不符。这份把名字兑现。
//
// 为什么从 clip-path 换成 canvas:
//   clip-path: circle() 只能给一条硬边,涟漪的命是「一圈圈」和「边缘会荡」,
//   这两样 clip-path 都表达不了。CSS 的 repeating-radial-gradient 能画等距的圈,
//   但涟漪的圈**不是等距的** —— 能量往外衰减,圈会朝后堆。曲率这个参数就是在调这件事,
//   而等距渐变没有这个自由度。
//   代价是一个全屏 canvas,但它只活转场那一下(默认 <1s)就自删,仍然是零克隆。
//
// 三个可调参数各自在调什么:
//   speed     —— 时长倍率。0.5 是慢一倍,2 是快一倍。
//   curvature —— 扩散的曲率。进度按 t^(1/curvature) 走:
//                  1   匀速,像一个纯几何的圆在长大
//                  >1  起手快、收尾慢 —— 真实水纹失能量的样子(默认 1.9)
//                  <1  起手慢、末尾抽一下
//                同一个指数也用来排圈的位置,所以圈会跟着往后堆,不是均匀铺开。
//   rings     —— 圈数。
//   amplitude —— 圈的明暗对比。0 就只剩一个纯色圆(退化回落墨那种)。

import { getLastPoint } from './transitionNav'

export const RIPPLE_DEFAULTS = {
  speed: 1,
  curvature: 1.9,
  rings: 5,
  amplitude: 0.55,
  color: '#221c16',
  ringColor: '255, 255, 255',
  /** 盖满之后停多久再淡出 */
  holdMs: 120,
  fadeMs: 320,
  /** 基准时长,speed = 1 时用它 */
  baseMs: 620,
}

/** 单圈的亮度包络:圈心最亮,往两边衰到 0。d 是到圈心的归一化距离。 */
function ringFalloff(d) {
  if (d >= 1 || d <= -1) return 0
  return Math.cos(d * Math.PI * 0.5) ** 2
}

/**
 * 起一次涟漪转场。
 *
 * @param navigate 换页函数。涟漪盖满的那一下调用它,所以换页被盖住,看不见闪。
 * @param to       传给 navigate 的目标
 * @param opts     见 RIPPLE_DEFAULTS,外加 origin: {x, y}(不传则读最后一次点击位置)
 * @returns 一个可以提前中止的函数
 */
export function rippleInto(navigate, to = '/play', opts = {}) {
  const o = { ...RIPPLE_DEFAULTS, ...opts }

  let reduced = false
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch (e) {
    /* 老浏览器没有 matchMedia,当作不减动 */
  }
  // 减动偏好,或者已经有一层在跑(双击)—— 直接换页,不叠第二层
  if (reduced || document.querySelector('.mu-ripple')) {
    navigate?.(to)
    return () => {}
  }

  const origin = opts.origin || getLastPoint() || {}
  const canvas = document.createElement('canvas')
  canvas.className = 'mu-ripple'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let w = 0
  let h = 0
  const size = () => {
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  size()
  window.addEventListener('resize', size)

  const cx = origin.x != null ? origin.x : w / 2
  const cy = origin.y != null ? origin.y : h * 0.8
  // 盖满所需半径:落点到四角的最大距离
  const maxR = Math.max(
    Math.hypot(cx, cy),
    Math.hypot(w - cx, cy),
    Math.hypot(cx, h - cy),
    Math.hypot(w - cx, h - cy),
  )
  const dur = o.baseMs / Math.max(0.1, o.speed)
  const invCurve = 1 / Math.max(0.1, o.curvature)

  let raf = 0
  let navigated = false
  let done = false
  const t0 = performance.now()

  const cleanup = () => {
    if (done) return
    done = true
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', size)
    canvas.classList.add('is-fading')
    setTimeout(() => canvas.remove(), o.fadeMs + 40)
  }

  const frame = (now) => {
    const t = Math.min(1, (now - t0) / dur)
    const eased = Math.pow(t, invCurve) // 曲率:>1 时起手快、收尾慢
    const R = maxR * eased

    ctx.clearRect(0, 0, w, h)

    // 实心盖层:半径 R 以内全填,换页藏在它底下
    ctx.fillStyle = o.color
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.fill()

    // 圈:位置用同一个曲率排,所以往后堆而不是等距铺
    if (o.amplitude > 0 && o.rings > 0) {
      // 单圈的半宽。除数越大圈越细 —— 2.2 那一版每圈铺开两百多像素,
      // 相邻圈糊在一起,看着像同心色块不像水纹的线。8 让圈细到能各自成线。
      const band = maxR / (o.rings * 8)
      for (let i = 0; i < o.rings; i++) {
        const q = (i + 1) / (o.rings + 1)
        const ringR = R * (1 - Math.pow(q, o.curvature))
        if (ringR <= 0) continue
        // 越靠后的圈越淡,和「能量在耗散」对上
        const life = 1 - q
        const steps = 5
        for (let s = -steps; s <= steps; s++) {
          const d = s / steps
          const a = ringFalloff(d) * o.amplitude * (0.35 + life * 0.65) * (1 - t * 0.3)
          if (a <= 0.004) continue
          ctx.strokeStyle = `rgba(${o.ringColor}, ${a})`
          ctx.lineWidth = Math.max(1, (band / steps) * 2.1)
          ctx.beginPath()
          ctx.arc(cx, cy, Math.max(0.5, ringR + d * band), 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }

    // 盖满的那一下才换页
    if (!navigated && R >= maxR * 0.995) {
      navigated = true
      navigate?.(to)
      setTimeout(cleanup, o.holdMs)
      return
    }
    if (t < 1) raf = requestAnimationFrame(frame)
    else if (!navigated) {
      navigated = true
      navigate?.(to)
      setTimeout(cleanup, o.holdMs)
    }
  }
  raf = requestAnimationFrame(frame)

  // 兜底:动画卡住也必须把层清掉,不能永远盖着页面
  const bail = setTimeout(cleanup, dur + o.holdMs + 900)
  return () => {
    clearTimeout(bail)
    cleanup()
  }
}
