import { useCallback, useEffect, useRef, useState } from 'react'
import '../../library/motion/ripple-route/ripple-route.css'

// 涟漪入场 / 退场 —— AI互动故事的路由转场。两个方向:
//   扩散(进入 / 前进):目标页 clip-path 圆从落点 0 → 150vmax 漾开,盖在旧页之上。
//   收拢(离开 / 返回):把当前页克隆一层盖在最上面,目标页渲染在底下,
//     克隆层的圆从 150vmax 收到 0(往落点收),圆划过的地方露出底下的目标页。
// 同一个圆、同一个时长、同一条缓动,只是方向和谁在上相反。
//
// —— 此前为什么什么都看不到 ——
// 收编时漏了 App.css 里的涟漪那一段,只搬了 transition-tuning.css。那份是**给
// .page-reveal / .route-leave 改时长的覆写**,而 class 的 @keyframes 定义在漏掉的
// 那半边。覆写一个不存在的动画,自然一点画面都没有。
// 2026-08-26 补齐 library/motion/ripple-route/ripple-route.css 之后才有东西可演。
//
// —— 2026-08-26 二改:自动播撤掉,改成点按钮触发 ——
// 上一版每 1.8s 自动来一轮,作者的原话是「太快了太快了」。转场本来就是「你做了个动作,
// 它回应你一下」,自动循环把因果关系抹掉了,看着像一个会自己抽搐的背景。
// 现在默认不动,按钮按一下走一次。自动播留成一个默认关掉的开关。
// 代价说清楚:画廊缩略图点不进去(上面盖了 .thumb-veil),所以卡片上会是一张静止的页。
// 转场是「一瞬」,静止时本来就没有画面 —— 这个代价我认为该认,不该靠自动循环去糊弄。
//
// 演示台直接给元素挂 class,没走 transitionNav —— 预览台里没有 router。
// transitionNav 在真项目里管的是「什么时候挂 class、克隆哪一层、圆心写在哪」的编排,
// 动画本身就是这两个 keyframes,所以这里演的是同一段动画,只是触发方式不同。
//
// 两个滑块给的是组件真实的旋钮,不是为了演示另造的参数:
//   时长 → --mu-reveal-dur(原项目 tokens.css 里是 0.9s)
//   曲率 → --ease-out 的贝塞尔(原项目是 cubic-bezier(0.22, 1, 0.36, 1))
//          一个 0–1 的量同时推两个横向控制点:0 平缓,1 起手极猛。
//          0.62 正好还原原项目那条曲线,所以默认就放在 0.62。

// 页面只负责两件事:底色要一眼分得出换了,文字顺手把这个转场讲清楚。
// 不编故事内容 —— 这是转场的演示台,不是内容的演示台。
//
// 明暗交替是有理由的:第一版四个页面全是浅色,亮度差只有 1.3(#eaf0e9 是 238.1,
// #f3ece2 是 236.8)。人眼靠色相勉强分得出换了页,但**圆的那条边几乎看不见** ——
// 而这个组件的全部看点就是那条边在走。交替之后每一次转场都是浅↔深,边缘最清楚。
const PAGES = [
  {
    n: '01',
    tint: '#f3ece2',
    ink: '#3a3230',
    sub: '#6a5f5a',
    seal: '#8a6a3f',
    line: '扩散入场:这一页的 clip-path 圆从落点 0 漾到 150vmax,盖在上一页之上。',
  },
  {
    n: '02',
    tint: '#26303a',
    ink: '#e8eef2',
    sub: '#93a6b3',
    seal: '#7fb0c7',
    line: '收拢退场:上一页被克隆到最上层,圆从 150vmax 收回落点,圆外露出这一页。',
  },
  {
    n: '03',
    tint: '#efe9f0',
    ink: '#37303c',
    sub: '#6b6072',
    seal: '#5f4a72',
    line: '两个方向共用同一个圆、同一个时长、同一条缓动 —— 只是方向相反、谁在上相反。',
  },
  {
    n: '04',
    tint: '#2c2a24',
    ink: '#ece6dd',
    sub: '#a39b8f',
    seal: '#c9975c',
    line: '用 clip-path 不用 transform:transform 会变成 fixed 后代的包含块,页内的弹层会被带着一起动。',
  },
]

// 落点轮着走,一眼看出圆是从某一点漾开 / 往某一点收,不是整屏淡入淡出
const SPOTS = [
  [50, 52], [18, 26], [82, 30], [26, 78], [78, 72],
]

// 曲率 q → cubic-bezier(x1, 1, x2, 1)。q=0.62 还原原项目的 (0.22, 1, 0.36, 1)。
const bezier = (q) => {
  const x1 = +(0.5 - 0.45 * q).toFixed(3)
  const x2 = +(0.5 - 0.226 * q).toFixed(3)
  return `cubic-bezier(${x1}, 1, ${x2}, 1)`
}

export default function Demo() {
  const [dur, setDur] = useState(0.9)
  const [curve, setCurve] = useState(0.62)
  const [auto, setAuto] = useState(false) // 默认不自动播 —— 按钮触发
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState('in')
  const [run, setRun] = useState(0) // 变一次重跑一次动画
  const [leaving, setLeaving] = useState(null) // 收拢时盖在上面的旧页
  const [busy, setBusy] = useState(false)
  const spot = useRef(0)
  const hostRef = useRef(null)
  const timers = useRef([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  // 落点:点按钮就用指针的实际位置(和真项目一致 —— transitionNav 记的就是 pointerdown
  // 的落点),没有指针位置时才退回预设点位轮播。
  const fire = useCallback(
    (which, ev) => {
      const el = hostRef.current
      if (!el || busy) return
      const r = el.getBoundingClientRect()
      let fx
      let fy
      if (ev && ev.clientX != null) {
        fx = ((ev.clientX - r.left) / r.width) * 100
        fy = ((ev.clientY - r.top) / r.height) * 100
      } else {
        ;[fx, fy] = SPOTS[spot.current % SPOTS.length]
        spot.current += 1
      }
      el.style.setProperty('--ripple-x', fx.toFixed(1) + '%')
      el.style.setProperty('--ripple-y', fy.toFixed(1) + '%')
      el.style.setProperty('--lx', fx.toFixed(1) + '%')
      el.style.setProperty('--ly', fy.toFixed(1) + '%')

      setBusy(true)
      setDir(which)
      setRun((n) => n + 1)
      clearTimers()
      if (which === 'out') {
        setLeaving(idx)
        setIdx((i) => (i + 1) % PAGES.length)
        timers.current.push(setTimeout(() => setLeaving(null), dur * 1000 + 60))
      } else {
        setIdx((i) => (i + 1) % PAGES.length)
      }
      timers.current.push(setTimeout(() => setBusy(false), dur * 1000 + 80))
    },
    [idx, dur, busy],
  )

  // 自动播是个可选项,不是默认。一轮留够看清的余量,不再是上一版那种连珠炮。
  const cycle = Math.round(dur * 1000 + 1800)
  useEffect(() => {
    if (!auto) return undefined
    let which = 'in'
    const tick = () => {
      fire(which)
      which = which === 'in' ? 'out' : 'in'
    }
    const first = setTimeout(tick, 500)
    const id = setInterval(tick, cycle)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [auto, cycle, fire])

  useEffect(() => clearTimers, [])

  const page = PAGES[idx]
  const old = leaving != null ? PAGES[leaving] : null
  const vars = { '--mu-reveal-dur': dur + 's', '--ease-out': bezier(curve) }

  return (
    <div
      ref={hostRef}
      className="stage stage--bleed"
      style={{ ...vars, position: 'relative', overflow: 'hidden', background: '#171412' }}
    >
      {/* 底下这层:扩散时是旧页,收拢时是新页 */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Page p={dir === 'in' ? PAGES[(idx + PAGES.length - 1) % PAGES.length] : page} />
      </div>

      {/* 上面这层:扩散时是新页(圆漾开),收拢时是旧页的克隆(圆收拢) */}
      {dir === 'in' ? (
        <div key={'in' + run} className="page-reveal" style={{ position: 'absolute', inset: 0 }}>
          <Page p={page} />
        </div>
      ) : (
        old && (
          <div key={'out' + run} className="route-leave" style={{ position: 'absolute', inset: 0 }}>
            <Page p={old} />
          </div>
        )
      )}

      {/* 触发区放中间偏下,大按钮 —— 这是这个演示台的主操作,不该缩在角落里 */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 34, zIndex: 20,
          display: 'flex', justifyContent: 'center', gap: 12,
        }}
      >
        <button onClick={(e) => fire('in', e)} disabled={busy} style={bigBtn(page.seal, busy)}>
          扩散入场
        </button>
        <button onClick={(e) => fire('out', e)} disabled={busy} style={bigBtn(page.seal, busy)}>
          收拢退场
        </button>
      </div>

      <div
        style={{
          position: 'absolute', left: 14, bottom: 12, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 5,
          padding: '10px 12px', borderRadius: 9,
          background: 'rgba(20,17,15,0.86)', border: '1px solid rgba(255,255,255,0.1)',
          font: '11px ui-monospace, Consolas, monospace', color: '#9a9088',
        }}
      >
        <Row label="时长" min={0.3} max={2.4} step={0.05} value={dur} onChange={setDur} show={dur.toFixed(2) + 's'} />
        <Row label="曲率" min={0} max={1} step={0.02} value={curve} onChange={setCurve} show={curve.toFixed(2)} />
        <div style={{ opacity: 0.55, fontSize: 10 }}>--ease-out: {bezier(curve)}</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, cursor: 'pointer' }}>
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          <span>自动播(每 {(cycle / 1000).toFixed(1)}s 一轮)</span>
        </label>
        <div style={{ opacity: 0.5, fontSize: 10 }}>按钮按在哪,圆就从哪起 / 往哪收</div>
      </div>
    </div>
  )
}

function Page({ p }) {
  return (
    <div
      style={{
        width: '100%', height: '100%', background: p.tint, color: p.ink,
        display: 'grid', placeItems: 'center', padding: '24px 24px 96px',
      }}
    >
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        {/* 中文数字「二」「三」用宋体放到 88px 会读成抽象线条,不像页码。换阿拉伯数字。 */}
        <div
          style={{
            fontSize: 76, lineHeight: 1, color: p.seal, opacity: 0.92,
            fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
            letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums',
          }}
        >
          {p.n}
        </div>
        <div
          style={{
            marginTop: 18, fontSize: 14, lineHeight: 1.95, color: p.sub,
            fontFamily: 'ui-sans-serif, system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
          }}
        >
          {p.line}
        </div>
      </div>
    </div>
  )
}

function Row({ label, min, max, step, value, onChange, show }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 28 }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: 118, accentColor: '#c9975c' }}
      />
      <span style={{ width: 40, textAlign: 'right', color: '#ece6dd' }}>{show}</span>
    </label>
  )
}

const bigBtn = (accent, busy) => ({
  font: '14px ui-sans-serif, system-ui, "PingFang SC", sans-serif',
  padding: '11px 26px',
  borderRadius: 999,
  cursor: busy ? 'default' : 'pointer',
  border: `1px solid ${accent}3a`,
  background: 'rgba(255,255,255,0.9)',
  color: '#3a3230',
  opacity: busy ? 0.45 : 1,
  transition: 'opacity 0.16s linear',
  boxShadow: '0 2px 10px rgba(40,36,30,0.12)',
})
