import React from 'react'
import '../../library/token/muyan/base.css'
import { stopHashNav } from '../page.jsx'
import FlowingMenu from '../../library/nav/flowing-menu/FlowingMenu.jsx'
import '../../library/nav/flowing-menu/FlowingMenu.css'

// 2026-08-26 修「效果很怪」。两个病,都在演示台这边:
//
// ① 菜单只有 66px 宽。FlowingMenu.css 里 `.menu-wrap` 是 width:100% / height:100%,
//    尺寸完全靠父级给;而旧版外面那层是 `<div style={{ height: '100%' }}>` ——
//    没给宽,在 .stage 的 flex 里就缩成内容宽(实测 66px)。
//    于是四行各只有 66 宽:分隔线成了小短杠,那条朱砂流动带也只能在 66px 的窄缝里扫,
//    根本看不出这是个什么效果。填充率 5.8%。
//    现在宽高都给满,行铺满整框,带从上/下边缘划进来横扫一整行 —— 这才是它本来的样子。
//
// ② 从来没人触发过它。整个效果由 hover 驱动(onMouseEnter → gsap 划入),
//    而画廊缩略图盖着 .thumb-veil,指针进不去,那一格永远是四行静止的字。
//    所以演示台自己按顺序逐行派发 mouseover / mouseout:
//    进场点取在行的上/下边缘附近交替,让带一会儿从上来、一会儿从下来 ——
//    组件的 closestEdge 是按到上/下中点的距离判的,喂对坐标才看得出这个细节。
//    真人指针一进来就立刻放手,不跟用户抢(和景深卡那件同一条纪律)。
//
// React 的 onMouseEnter / onMouseLeave 是从原生 mouseover / mouseout 合成的
// (按 relatedTarget 判进出),所以派发 relatedTarget 为 null 的这两个事件,
// 组件收到的就是真的 enter / leave,走的是同一条代码路径。
//
// ③ 划入的那条带原来是一整片朱砂(FlowingMenu.css 里 `.marquee { background: var(--accent) }`),
//    带里重复滚的是行标题的文字。改成滚照片。
//    做法在演示台侧:组件每段固定渲染 8 个 `<span>{item.text}</span>`(见 FlowingMenu.jsx 的 strip),
//    这里用一段更高优先级的 CSS 把这 8 个 span 变成图块 —— 定宽、满高、背景图、字号收 0。
//    两段 .marquee__part 的 span 各自从 nth-child(1) 起算,拿到的是同一组图,
//    所以那条 translateX(-50%) 的无缝循环照旧成立。组件源码一行没动。
//    每行错开起点取图,四行不会同时出现同一张。
//
// 条目换成中性的:旧版是「探索 / 故事 / 创作 / 我的」,那是 AI 互动故事的导航分档。

const items = [
  { text: '首页', href: '/' },
  { text: '作品', href: '/work' },
  { text: '记录', href: '/log' },
  { text: '关于', href: '/about' },
]

// 组件每段固定 8 个 span —— 这个数字来自 FlowingMenu.jsx 的 `Array.from({ length: 8 })`,
// 它改了这里要跟着改(多出来的 span 没有背景图会漏出底色)。
const TILES = 8
const PHOTOS = Array.from({ length: 12 }, (_, i) => `/flip-book/photo-${String(i + 1).padStart(2, '0')}.jpg`)

const tileCss = (rows) =>
  rows
    .map((_, r) =>
      Array.from(
        { length: TILES },
        (_, i) =>
          `.fm-demo .menu__item:nth-child(${r + 1}) .marquee span:nth-child(${i + 1})` +
          `{background-image:url('${PHOTOS[(r * 3 + i) % PHOTOS.length]}')}`,
      ).join('\n'),
    )
    .join('\n')

const HOLD = 1500 // 带扫过一行停留多久。gsap 划入 0.6s,留够看清照片滚过
const GAP = 260 // 两行之间的间隔,别连成一片

export default function Demo() {
  const hostRef = React.useRef(null)

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    // 只留一个在飞的 timer,别攒着:每轮两次 wait,攒一小时是四千多个 handle。
    // abort 是收手时用来「直接兑现」当前这次 wait 的 —— 只 clearTimeout 的话
    // 那个 Promise 永远不 resolve,run() 就永远挂在 await 上,闭包跟着不回收。
    let live = true
    let timer = 0
    let abort = null
    const wait = (ms) =>
      new Promise((resolve) => {
        timer = setTimeout(resolve, ms)
        abort = resolve
      })
    const stop = () => {
      live = false
      clearTimeout(timer)
      abort?.()
      abort = null
    }

    // 在行的上边缘附近 / 下边缘附近取点,让 closestEdge 分别判成 top / bottom
    const point = (el, fromTop) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: fromTop ? r.top + 4 : r.bottom - 4 }
    }
    const fire = (el, type, p) =>
      el.dispatchEvent(
        new MouseEvent(type, { bubbles: true, cancelable: true, relatedTarget: null, clientX: p.x, clientY: p.y }),
      )

    const run = async () => {
      let n = 0
      while (live) {
        const links = host.querySelectorAll('.menu__item-link')
        if (!links.length) return
        const el = links[n % links.length]
        const fromTop = Math.floor(n / links.length) % 2 === 0
        const p = point(el, fromTop)
        fire(el, 'mouseover', p)
        await wait(HOLD)
        if (!live) return
        fire(el, 'mouseout', point(el, fromTop))
        await wait(GAP)
        n++
      }
    }
    run()

    // 真人指针一进来就放手。
    // 收手时要把自动点亮的行熄掉,但**跳过指针正下方那一行** ——
    // 触发放手的这一下多半就是指针刚进到某一行,连它一起熄掉的话,
    // 用户明明停在那一行上却什么都不亮,得挪开再挪回来才有反应。
    const release = (e) => {
      if (!live || e.isTrusted === false) return
      stop()
      const { clientX: x, clientY: y } = e
      host.querySelectorAll('.menu__item-link').forEach((el) => {
        const r = el.getBoundingClientRect()
        const under = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
        if (!under) fire(el, 'mouseout', point(el, true))
      })
    }
    const evts = ['pointermove', 'pointerdown', 'wheel', 'touchstart']
    evts.forEach((n) => window.addEventListener(n, release, { passive: true }))

    return () => {
      stop()
      evts.forEach((n) => window.removeEventListener(n, release, { passive: true }))
    }
  }, [])

  return (
    <div
      className="stage stage--bleed"
      data-theme="stage"
      style={{ background: 'var(--bg)', color: 'var(--fg)' }}
    >
      <style>{`
        /* 带底改成暗底而不是朱砂:图块铺满时看不见它,只在极端窄框下兜个底,别再闪出红色 */
        .fm-demo .marquee { background: #1a1713; }
        /* .marquee__inner 原本是 align-items:center —— 于是 .marquee__part 不拉伸、高度按内容算,
           而内容(把字号收成 0 之后)是 0,图块的 height:100% 没有参照,整条带塌成一片纯色。
           改成 stretch 并把 part 撑满,图块才有高度。 */
        .fm-demo .marquee__inner { align-items: stretch; }
        .fm-demo .marquee__part { height: 100%; }
        .fm-demo .marquee span {
          flex: none;
          width: clamp(150px, 17vw, 250px);
          height: 100%;
          padding: 0;
          margin: 0;
          font-size: 0;          /* 重复的行标题收掉,带里只留图 */
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        }
        ${tileCss(items)}
      `}</style>
      {/* 宽高都得给满 —— .menu-wrap 是 100%/100%,父级不给尺寸它就缩成字宽 */}
      <div ref={hostRef} className="fm-demo" style={{ width: '100%', height: '100%' }} onClickCapture={stopHashNav}>
        <FlowingMenu items={items} />
      </div>
    </div>
  )
}
