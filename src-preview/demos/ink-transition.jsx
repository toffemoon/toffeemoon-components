import { useEffect, useRef, useState } from 'react'
import { MuyanStage } from '../muyan.jsx'
import { inkInto } from '../../library/motion/ink-transition/inkTransition.js'
import '../../library/motion/ink-transition/transition-tuning.css'

// 水墨转场:墨从落点涨圆盖满屏,中间那一下才真正换页,然后淡出。
// inkInto(navigate, to) —— 第一个参数是路由跳转函数,演示台传空实现,只看动画。
//
// 2026-08-23:原来只有一个按钮,不点什么都看不到(画廊缩略图里就是一张静态图)。
// 改成默认自动循环,落点在画面里轮着走。
//
// 2026-08-26 复诊 —— 上一版仍然「没有任何画面效果」,三个病根叠在一起:
//
// 1) 墨的颜色 == 台子的颜色。transition-tuning.css 里 .mu-ink 的 background 写死
//    #221c16,那正是 token 的 --stage-bg;而上一版外壳用的就是 theme="stage"。
//    一块 #221c16 在 #221c16 上涨开,等于隐形 —— 实测帧差峰值只有 1.40%,
//    动的其实只是「文字被盖住」这点差额。
//    这个组件的本意是「从纸(亮)跳进台(暗)」:墨= 目的地的底色,盖住主题翻转,
//    散开时新页已经在下面。所以演示台改用 theme="paper" 亮底,墨才有对比,
//    而且这才是它在原项目里的真实用法,不是为了好看硬调色。
//
// 2) 占空比太低。按源码量时长:mu-ink-in 0.48s 涨满 → inkInto 在 animationend
//    后停 120ms → .is-fading 淡出 0.3s。墨在画面上总共约 900ms,
//    上一版 CYCLE 2600ms → 只有 35% 的时刻有墨,随机截一帧大概率截空档。
//    这版 CYCLE 收到 1700ms(≈53%),更要紧的是空档里也不再是空台子:
//    底下永远躺着一张成型的页,截到哪一帧都是「一张页」或「墨正在吞掉一张页」。
//
// 3) 最要命的:换页没被演出来。上一版 navigate 只是把计数器 +1,墨盖住的底下
//    还是同一块空台子,观众看不出墨遮住的那一瞬发生了什么 —— 组件的用途讲不清。
//    这版底下真的换页:四张沐言的页轮着走,底色 / 印色 / 标题全不一样。
//
// 关于换页时机的一点如实说明:inkInto 是在 t=0(墨还是 circle(0),什么都没盖住)
// 就调 navigate 的 —— 真实路由里新页要挂载、要跑 effect,天然有延迟,正好被涨开的
// 墨追上盖住。演示台里 setState 是同步的,不推迟的话会在墨还没盖住时当着面换掉。
// 所以这里把换页排到 GROW+30ms —— 墨刚盖满的那一帧 —— 让「换发生在墨底下」看得见。
// 组件本身一行没动。

// —— 时长常数,全部来自 library/motion/ink-transition,不是拍脑袋 ——
// transition-tuning.css: .mu-ink { animation: mu-ink-in 0.48s }  clip-path circle 0 → 150vmax
// inkTransition.js:      animationend → setTimeout(finish, 120) → .is-fading(opacity .3s)
const GROW = 480
const HOLD = 120
const FADE = 300
const INK_LIFE = GROW + HOLD + FADE // ≈ 900ms:墨真正在画面上的时长
const SWAP_AT = GROW + 30 // 墨刚盖满的那一帧换页
const CYCLE = 1700 // 一轮:900ms 有墨 + 800ms 看新页,两头都有画面

// 墨的落点:inkInto 会读 transitionNav 记的最后一次指针位置,手点按钮时正好从指头下
// 涨开(这是对的,别覆盖)。自动播没有指针,就在 inkInto 返回后把 --ix/--iy 写到墨
// 节点上 —— 同一帧内、还没 paint,keyframes 里的 var() 照样跟着走。
// 用百分比不用 window.innerWidth 换算:clip-path 的 circle() 本来就吃百分比,
// 而且窗口尺寸拿不准的时候(比如刚挂载、iframe 还没定宽)不会算出 0px 缩到左上角。
const SPOTS = ['50% 52%', '16% 26%', '84% 30%', '26% 78%', '78% 72%']

// 底下真的换页。四张页只用 token 里的浅色,保证墨(暖近黑)在任何一张上都够黑。
const PAGES = [
  { id: 'cafe', tint: '#f6e2dd', seal: '#8f3c32', kind: '完整故事', title: '猫与咖啡馆', line: '你推开一扇总在下雨的门。店主记得每位客人的口味,却记不住自己的名字。' },
  { id: 'tangmu', tint: '#f4ecd9', seal: '#ad7a24', kind: '角色卡', title: '糖沐', line: '沐言书坊的店员。话不多,记性好,给熟客多放一颗糖。' },
  { id: 'rain', tint: '#e6efe9', seal: '#315d4f', kind: '世界书', title: '常雨镇', line: '一座三百天在下雨的小镇。雨停的那天,所有人都会想起点什么。' },
  { id: 'guest', tint: '#ffffff', seal: '#8f3c32', kind: '演出卡', title: '第一次来的客人', line: '你不记得自己为什么走进来,但伞是干的。' },
]

export default function Demo() {
  const [auto, setAuto] = useState(true)
  const [idx, setIdx] = useState(0)
  const round = useRef(0)
  const swapT = useRef(0)

  const page = PAGES[idx % PAGES.length]

  // spot 为空 = 手动触发,让组件自己用点击点当圆心。
  const fire = (spot) => {
    if (document.querySelector('.mu-ink')) return // 上一笔还没干,别叠
    inkInto(() => {
      clearTimeout(swapT.current)
      swapT.current = setTimeout(() => setIdx((i) => i + 1), SWAP_AT)
    }, '/play')
    const ink = document.querySelector('.mu-ink')
    if (ink && spot) {
      const [x, y] = spot.split(' ')
      ink.style.setProperty('--ix', x)
      ink.style.setProperty('--iy', y)
    }
  }

  useEffect(() => {
    if (!auto) return
    const tick = () => fire(SPOTS[round.current++ % SPOTS.length])
    const first = setTimeout(tick, 380)
    const id = setInterval(tick, CYCLE)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [auto])

  // 卸载兜底:墨层是直接 append 到 body 的,React 管不着。
  useEffect(() => () => {
    clearTimeout(swapT.current)
    document.querySelector('.mu-ink')?.remove()
  }, [])

  return (
    <MuyanStage theme="paper" pad={0}>
      <div style={{ ...sheet, background: page.tint }}>
        <div className="lbl" style={cap}>落墨转场 · 盖满的那一下换页</div>

        <div style={card}>
          <div style={{ ...cover, background: `color-mix(in srgb, ${page.seal} 13%, #fff)` }}>
            <span style={{ ...seal, background: page.seal }} />
          </div>
          <div style={{ ...kind, color: page.seal, borderColor: `color-mix(in srgb, ${page.seal} 30%, transparent)` }}>
            {page.kind}
          </div>
          <div style={title}>{page.title}</div>
          <div style={line}>{page.line}</div>
        </div>

        <div style={bar}>
          <button onClick={() => fire(null)} style={btn}>手动落一笔</button>
          <button onClick={() => setAuto((a) => !a)} style={btn}>
            {auto ? '停下自动播' : '开始自动播'}
          </button>
          <span style={meter}>
            已换 {idx} 页{auto ? ` · 每 ${(CYCLE / 1000).toFixed(1)}s 一轮,墨占 ${INK_LIFE}ms` : ''}
          </span>
        </div>
      </div>
    </MuyanStage>
  )
}

// 尺寸一律走 vmin/百分比:画廊缩略图的 iframe 是卡片的 2.5 倍再 scale(0.4),
// 固定 px 到了缩略图里会缩成一团糊。
const sheet = {
  alignSelf: 'stretch',
  width: '100%',
  minHeight: 320,
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  padding: 'clamp(18px, 5vmin, 56px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const cap = {
  position: 'absolute',
  top: 'clamp(12px, 3.2vmin, 30px)',
  left: 0,
  right: 0,
  margin: 0,
  fontSize: 'clamp(9px, 1.7vmin, 15px)',
}

const card = { width: 'clamp(220px, 64%, 760px)' }

const cover = {
  height: 'clamp(62px, 26vmin, 230px)',
  borderRadius: 'clamp(10px, 2vmin, 18px)',
  position: 'relative',
  marginBottom: 'clamp(12px, 2.8vmin, 26px)',
}

const seal = {
  position: 'absolute',
  right: 'clamp(10px, 2.4vmin, 22px)',
  bottom: 'clamp(10px, 2.4vmin, 22px)',
  width: 'clamp(14px, 3.4vmin, 34px)',
  height: 'clamp(14px, 3.4vmin, 34px)',
  borderRadius: '50%',
  opacity: 0.85,
}

const kind = {
  display: 'inline-block',
  fontSize: 'clamp(9px, 1.8vmin, 15px)',
  padding: '0.28em 0.85em',
  borderRadius: 999,
  border: '1px solid',
  marginBottom: 'clamp(7px, 1.6vmin, 14px)',
}

const title = {
  fontSize: 'clamp(21px, 5.8vmin, 50px)',
  lineHeight: 1.18,
  letterSpacing: '0.01em',
  color: 'var(--fg)',
}

const line = {
  marginTop: 'clamp(6px, 1.4vmin, 13px)',
  fontSize: 'clamp(11px, 2.2vmin, 19px)',
  lineHeight: 1.65,
  color: 'var(--muted)',
}

const bar = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 'clamp(12px, 3vmin, 30px)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'clamp(6px, 1.4vmin, 12px)',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.66,
}

const btn = {
  font: 'inherit',
  fontSize: 'clamp(10px, 1.9vmin, 15px)',
  padding: '0.5em 1.2em',
  borderRadius: 999,
  cursor: 'pointer',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  color: 'var(--fg)',
}

const meter = {
  fontSize: 'clamp(9px, 1.7vmin, 14px)',
  opacity: 0.7,
  fontFamily: 'ui-monospace, Consolas, monospace',
  color: 'var(--fg)',
}
