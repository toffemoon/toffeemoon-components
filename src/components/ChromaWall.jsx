import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// 画廊的聚光层 —— 做法学 React Bits 的 ChromaGrid
// (https://reactbits.dev/components/chroma-grid):
//
//   两层 backdrop-filter 盖住整面墙,用径向 mask 在光标处开一个洞。
//   overlay 的 mask 中心透明、边缘不透明 → 光标附近保持原色,远处变灰变暗。
//   fade 是反过来的 mask,默认 opacity:1(鼠标没进来时整面灰),
//   一动就淡出交给 overlay。GSAP quickSetter 只写 CSS 变量,不触发 React 重渲染。
//
// 改了三处:
//   1. 灰度压到 0.82 / 亮度 0.88(原版是 1 / 0.78)。这面墙的用处是"一眼看到都有什么",
//      压太狠等于把远处的卡片藏起来,和目的相反。
//   2. 聚光颜色绑到归属分档(自研绿 / 改造琥珀 / 移植蓝 / 待查灰),
//      光扫过去亮起来的颜色直接说明这是哪一类,不只是好看。
//   3. 每个分类各一面墙,不是整页一面 —— 否则滚到下面时光斑还留在上面那屏。

export default function ChromaWall({ children, radius = 340, damping = 0.4, fadeOut = 0.55 }) {
  const root = useRef(null)
  const fade = useRef(null)
  const setX = useRef(null)
  const setY = useRef(null)
  const pos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = root.current
    if (!el) return
    setX.current = gsap.quickSetter(el, '--x', 'px')
    setY.current = gsap.quickSetter(el, '--y', 'px')
    const { width, height } = el.getBoundingClientRect()
    pos.current = { x: width / 2, y: height / 2 }
    setX.current(pos.current.x)
    setY.current(pos.current.y)
  }, [])

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        setX.current?.(pos.current.x)
        setY.current?.(pos.current.y)
      },
    })
  }

  return (
    <div
      ref={root}
      className="chroma-wall"
      style={{ '--r': radius + 'px' }}
      onPointerMove={(e) => {
        const r = root.current.getBoundingClientRect()
        moveTo(e.clientX - r.left, e.clientY - r.top)
        gsap.to(fade.current, { opacity: 0, duration: 0.25, overwrite: true })
      }}
      onPointerLeave={() => {
        gsap.to(fade.current, { opacity: 1, duration: fadeOut, overwrite: true })
      }}
    >
      {children}
      <div className="chroma-overlay" aria-hidden="true" />
      <div ref={fade} className="chroma-fade" aria-hidden="true" />
    </div>
  )
}
