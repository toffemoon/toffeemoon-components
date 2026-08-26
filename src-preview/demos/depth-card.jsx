import React from 'react'
import { MuyanStage } from '../muyan.jsx'
import DepthCard from '../../library/ui/depth-card/depth-card.jsx'
import '../../library/ui/depth-card/depth-card.css'

// 2026-08-26 重做。旧版打开是一片近乎全黑,量出来帧间变化 0.00% —— 两个病叠在一起:
//
// ① 卡片没有形体。depth-card.css 全吃沐言的语义 token(--r-card / --shadow-card /
//    --shadow-pop / --dur-mid / --ease-out),而这些 token 挂在 [data-theme] 上、
//    不在 :root —— muyan.jsx 顶部就写着这句。旧版没套 MuyanStage,直接裸在一个
//    背景写死 #141210 的 div 里,于是圆角、投影、过渡全部落空,卡片等于隐形,
//    只剩两行暗色文字浮在暗底上。套上 MuyanStage 之后 token 才有值。
//
// ② 没有指针就没有效果。它整个效果由 onMouseMove 驱动 —— 不动鼠标它就是一张静止的卡,
//    而画廊缩略图盖了 .thumb-veil,根本不可能有指针进来。
//    所以演示台自己派发 mousemove:沿一条李萨如曲线慢慢走(两个不同频率的正弦,
//    路径不会周期性地重合,看着不像机器在扫),让分层位移一直在发生。
//    真人指针一进来就立刻放手 —— 这条纪律和滚动进度那一件一致,不跟用户抢。
//
// 派发的是真 MouseEvent 且 bubbles:true,所以 React 的合成事件照常收得到,
// 组件那边完全不知道指针是假的,走的是同一条代码路径。

const CYCLE = 9000 // 一圈的时长。慢一点才看得清分层,快了像抖动

export default function Demo() {
  const hostRef = React.useRef(null)
  const [driving, setDriving] = React.useState(true)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const card = host.querySelector('.depth-card') || host.firstElementChild
    if (!card) return undefined

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      // 减动偏好:不来回扫,只摆一个固定的偏移,让静止画面里也看得出这是张有厚度的卡
      const r = card.getBoundingClientRect()
      card.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: r.left + r.width * 0.68,
          clientY: r.top + r.height * 0.34,
        }),
      )
      setDriving(false)
      return undefined
    }

    let raf = 0
    let live = true
    const t0 = performance.now()

    card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

    const tick = (now) => {
      if (!live) return
      const t = ((now - t0) % CYCLE) / CYCLE
      const r = card.getBoundingClientRect()
      // 李萨如:x 走 1 圈、y 走 1.5 圈,路径不重合,不像机械扫描
      const x = r.left + r.width * (0.5 + 0.34 * Math.sin(t * Math.PI * 2))
      const y = r.top + r.height * (0.5 + 0.3 * Math.sin(t * Math.PI * 3 + 0.9))
      card.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // 真人指针一进来就放手
    const release = (e) => {
      if (!live || e.isTrusted === false) return
      live = false
      cancelAnimationFrame(raf)
      setDriving(false)
    }
    const evts = ['pointermove', 'pointerdown', 'wheel', 'touchstart']
    evts.forEach((n) => window.addEventListener(n, release, { passive: true }))

    return () => {
      live = false
      cancelAnimationFrame(raf)
      evts.forEach((n) => window.removeEventListener(n, release, { passive: true }))
    }
  }, [])

  return (
    <MuyanStage>
      <div ref={hostRef}>
        <DepthCard>
          <div style={{ padding: '30px 28px', width: 300 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--fg-muted)' }}>
              DEPTH CARD
            </div>
            <div style={{ fontSize: 19, margin: '10px 0 12px', color: 'var(--fg)' }}>景深卡</div>
            <div style={{ fontSize: 13, lineHeight: 1.85, color: 'var(--fg-muted)' }}>
              指针在卡面上的位置决定倾角,内容按层次错开位移,高光跟着指针走。
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.7, marginTop: 14, color: 'var(--fg-faint, var(--fg-muted))' }}>
              {driving ? '演示台正在替你移动指针 —— 你一动它就让开。' : '已经交给你了,在卡上移移看。'}
            </div>
          </div>
        </DepthCard>
      </div>
    </MuyanStage>
  )
}
