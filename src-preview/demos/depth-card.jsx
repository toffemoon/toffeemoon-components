import React from 'react'
import { MuyanStage } from '../muyan.jsx'
import DepthCard from '../../library/ui/depth-card/depth-card.jsx'
import '../../library/ui/depth-card/depth-card.css'

// 2026-08-26(二改)。上一轮把「一片黑、量出来 0.00%」修好了,但卡片是写死 300px 宽的
// 一小块,钉在 1156×560 的框正中 —— 实测填充率 10.9%,九成是空纸。这一轮:
//
// ① 尺寸跟着框走。卡宽 min(540px, 100%),高度直接吃满台子 ——
//    框宽随窗口变,卡跟着变,不再是「小方块 + 一圈白」。高度那一档见下面 CARD_W。
// ② 有图才看得见倾斜。纯文字卡转 7° 几乎看不出来,图里的地平线一斜就很明显,
//    高光扫过水面也才有东西可扫。
// ③ 文案改准了:这个组件**不做**分层视差 —— 看 depth-card.jsx,它只做两件事,
//    整卡按指针倾斜(maxRotation 默认 7°,lerp 0.1 逼近)+ 一块 soft-light 高光
//    跟着指针。旧文案写「内容按层次错开位移」是错的,照着它读会以为组件坏了。
//
// 下面这段自动驱动是上一轮留下的,原因没变:
// 它整个效果由 onMouseMove 驱动 —— 不动鼠标它就是一张静止的卡,
// 而画廊缩略图盖了 .thumb-veil,根本不可能有指针进来。
// 所以演示台自己派发 mousemove:沿一条李萨如曲线慢慢走(两个不同频率的正弦,
// 路径不会周期性地重合,看着不像机器在扫),让倾斜和高光一直在发生。
// 真人指针一进来就立刻放手 —— 这条纪律和滚动进度那一件一致,不跟用户抢。
//
// 派发的是真 MouseEvent 且 bubbles:true,所以 React 的合成事件照常收得到,
// 组件那边完全不知道指针是假的,走的是同一条代码路径。

// 高度不靠算,靠让卡直接吃满台子的净高 —— 这一版是被「两种台子高度不一样」逼出来的:
//   详情页  iframe 560,MuyanStage 上下各 24 → 净高 512
//   画廊缩略图  iframe 是卡片的 2.5 倍(实测 728×453)→ 净高只有 405
// 按 16/9 从宽度算高度,写死一个数必然有一头对不上:540 宽算出来 494 高,详情页装得下,
// 缩略图上下各切掉约 19px(Codex 复核指出,自己也量过)。
// 所以改成:卡的高 = 台子的净高(.dc-fit 那两条),图 flex:1 吃掉剩下的,文字块不缩。
// 两种台子各自撑满,谁也不用迁就谁,也不会被 overflow:hidden 削掉一条。
// 宽度仍然 min(540, 100%),跟着框宽走。
//
// 试过改走 data-fit 把框钉高,撤了 —— 实测两次都把下一个演示台也顶高了(在详情页里
// 从这一件切到 card,card 的框跟着变成 640)。看着像这么回事:切换时 Detail.jsx 会先
// 拿还没换掉的旧文档量一次,把钉出来的高度写进 iframe;等新 demo 挂上,它的 height:100%
// 让文档「刚好等于框」,差值 6px 进不了那边 8px 的写入阈值,于是高度就赖在那儿。
// 是不是每次都触发没验到(和换 demo 的时序有关,scroll-progress 那件同样用 data-fit
// 却没复现)。既然不钉也能排下,就别在这一件上冒这个险。
const CARD_W = 540

const CYCLE = 9000 // 一圈的时长。慢一点才看得清倾斜,快了像抖动

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
      {/* DepthCard 只把 className 透给最外那层 .depth-card-wrapper,里面那层 .depth-card
          够不着 —— 所以高度用一段选择器往下传,不改组件源码。 */}
      <style>{`
        .dc-fit { width: 100%; height: 100%; }
        .dc-fit .depth-card { height: 100%; }
      `}</style>
      <div ref={hostRef} style={{ width: `min(${CARD_W}px, 100%)`, height: '100%' }}>
        <DepthCard className="dc-fit">
          {/* 卡面自己是不裁切的,圆角要靠这一层收边 —— 图直接铺到边会露出直角 */}
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--r-card)',
              overflow: 'hidden',
              background: 'var(--panel)',
            }}
          >
            {/* 图吃掉文字块以外的全部高度。min-height:0 是必须的,
                不然 flex 子项的最小尺寸是内容尺寸,图会把卡撑破。 */}
            <div style={{ flex: '1 1 auto', minHeight: 0, background: 'var(--sunk, var(--panel))' }}>
              <img
                src="/flip-book/photo-09.jpg"
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{ flex: 'none', padding: 'clamp(16px, 3.4%, 26px) clamp(18px, 3.6%, 28px)' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--fg-muted, var(--muted))' }}>
                DEPTH CARD
              </div>
              <div style={{ fontSize: 'clamp(17px, 1.9vw, 21px)', margin: '10px 0 12px', color: 'var(--fg)' }}>
                景深卡
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.85, color: 'var(--fg-muted, var(--muted))' }}>
                指针在卡面上的位置决定倾角,最大 7°,靠 lerp 慢慢逼近所以不会跟手抖;
                一块 soft-light 的暖光跟着指针在卡面上走。
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.7,
                  marginTop: 14,
                  color: 'var(--fg-faint, var(--fg-muted, var(--muted)))',
                }}
              >
                {driving ? '演示台正在替你移动指针 —— 你一动它就让开。' : '已经交给你了,在卡上移移看。'}
              </div>
            </div>
          </div>
        </DepthCard>
      </div>
    </MuyanStage>
  )
}
