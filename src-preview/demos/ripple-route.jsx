import { useCallback, useEffect, useRef, useState } from 'react'
import '../../library/motion/ripple-route/ripple-route.css'

// 涟漪入场 / 退场 —— AI互动故事的路由转场。两个方向:
//   扩散(进入 / 前进):目标页 clip-path 圆从落点 0 → 150vmax 漾开,盖在旧页之上。
//   收拢(离开 / 返回):把当前页克隆一层盖在最上面,目标页渲染在底下,
//     克隆层的圆从 150vmax 收到 0(往落点收),圆划过的地方露出底下的目标页。
// 同一个圆、同一个时长、同一条缓动,只是方向和谁在上相反。
//
// —— 这个演示台此前为什么什么都看不到 ——
// 收编时漏了 App.css 里的涟漪那一段,只搬了 transition-tuning.css。那份是**给
// .page-reveal / .route-leave 改时长的覆写**,而 class 的 @keyframes 定义在漏掉的
// 那半边。覆写一个不存在的动画,自然一点画面都没有。2026-08-26 把
// library/motion/ripple-route/ripple-route.css 补齐之后才有东西可演。
//
// 演示台直接给元素挂 class,没有走 transitionNav —— 预览台里没有 router。
// transitionNav 在真项目里做的是「什么时候挂 class、克隆哪一层、圆心写在哪」的编排,
// 动画本身就是这两个 keyframes。所以这里演的是同一段动画,只是触发方式不同。
//
// 两个滑块给的是组件真实的旋钮,不是为了演示另造的参数:
//   时长 → --mu-reveal-dur(原项目 tokens.css 里是 0.9s)
//   曲率 → --ease-out 的贝塞尔(原项目是 cubic-bezier(0.22, 1, 0.36, 1))
//          一个 0–1 的量同时推两个横向控制点:0 平缓,1 起手极猛。
//          0.62 正好还原原项目那条曲线,所以默认就放在 0.62。

const PAGES = [
  { tint: '#f6e2dd', seal: '#8f3c32', kind: '完整故事', title: '猫与咖啡馆', line: '你推开一扇总在下雨的门。店主记得每位客人的口味,却记不住自己的名字。' },
  { tint: '#f4ecd9', seal: '#ad7a24', kind: '角色卡', title: '糖沐', line: '沐言书坊的店员。话不多,记性好,给熟客多放一颗糖。' },
  { tint: '#e6efe9', seal: '#315d4f', kind: '世界书', title: '常雨镇', line: '一座三百天在下雨的小镇。雨停的那天,所有人都会想起点什么。' },
  { tint: '#eae4f0', seal: '#4a3d6b', kind: '演出卡', title: '第一次来的客人', line: '你不记得自己为什么走进来,但伞是干的。' },
]

// 落点轮着走,一眼看出圆是从某一点漾开 / 往某一点收,不是整屏淡入淡出
const SPOTS = [
  [50, 52], [18, 26], [82, 30], [26, 78], [78, 72],
]

// 曲率 q → cubic-bezier(x1, 1, x2, 1)。q=0.62 还原原项目的 (0.22, 1, 0.36, 1)。
const bezier = (q) => {
  const x1 = (0.5 - 0.45 * q).toFixed(3)
  const x2 = (0.5 - 0.226 * q).toFixed(3)
  return `cubic-bezier(${+x1}, 1, ${+x2}, 1)`
}

export default function Demo() {
  const [dur, setDur] = useState(0.9)
  const [curve, setCurve] = useState(0.62)
  const [auto, setAuto] = useState(true)
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState('in') // 'in' 扩散 · 'out' 收拢
  const [run, setRun] = useState(0) // 变一次就重跑一次动画
  const [leaving, setLeaving] = useState(null) // 收拢时盖在上面的那层旧页
  const spot = useRef(0)
  const hostRef = useRef(null)
  const timer = useRef(0)

  const fire = useCallback(
    (which) => {
      const el = hostRef.current
      if (!el) return
      const [fx, fy] = SPOTS[spot.current % SPOTS.length]
      spot.current += 1
      el.style.setProperty('--ripple-x', fx + '%')
      el.style.setProperty('--ripple-y', fy + '%')
      el.style.setProperty('--lx', fx + '%')
      el.style.setProperty('--ly', fy + '%')

      setDir(which)
      setRun((n) => n + 1)
      if (which === 'out') {
        // 收拢:旧页克隆盖在上面,新页已经在底下了
        setLeaving(idx)
        setIdx((i) => (i + 1) % PAGES.length)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setLeaving(null), dur * 1000 + 60)
      } else {
        // 扩散:新页盖在上面漾开
        setIdx((i) => (i + 1) % PAGES.length)
      }
    },
    [idx, dur],
  )

  // 一轮:扩散 → 收拢 → 扩散 …… 两个方向都能被截到
  const cycle = Math.round(dur * 1000 + 900)
  useEffect(() => {
    if (!auto) return undefined
    let which = 'in'
    const tick = () => {
      fire(which)
      which = which === 'in' ? 'out' : 'in'
    }
    const first = setTimeout(tick, 420)
    const id = setInterval(tick, cycle)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [auto, cycle, fire])

  useEffect(() => () => clearTimeout(timer.current), [])

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

      <div
        style={{
          position: 'absolute', left: 14, bottom: 12, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 5,
          padding: '10px 12px', borderRadius: 9,
          background: 'rgba(20,17,15,0.86)', border: '1px solid rgba(255,255,255,0.1)',
          font: '11px ui-monospace, Consolas, monospace', color: '#9a9088',
        }}
      >
        <Row label="时长" min={0.3} max={2} step={0.05} value={dur} onChange={setDur} show={dur.toFixed(2) + 's'} />
        <Row label="曲率" min={0} max={1} step={0.02} value={curve} onChange={setCurve} show={curve.toFixed(2)} />
        <div style={{ opacity: 0.55, fontSize: 10 }}>--ease-out: {bezier(curve)}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
          <button onClick={() => fire('in')} style={btn}>扩散入场</button>
          <button onClick={() => fire('out')} style={btn}>收拢退场</button>
          <button onClick={() => setAuto((a) => !a)} style={btn}>{auto ? '停' : '播'}</button>
        </div>
        <div style={{ opacity: 0.55 }}>
          当前:{dir === 'in' ? '扩散(进入 / 前进)' : '收拢(离开 / 返回)'}
        </div>
      </div>
    </div>
  )
}

function Page({ p }) {
  return (
    <div
      style={{
        width: '100%', height: '100%', background: p.tint, color: '#3a3230',
        display: 'grid', placeItems: 'center', padding: 24,
        fontFamily: '"Songti SC", "STSong", "Source Han Serif SC", serif',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <span
          style={{
            display: 'inline-block', padding: '3px 11px', borderRadius: 999,
            border: `1px solid ${p.seal}44`, color: p.seal,
            font: '12px ui-sans-serif, system-ui, sans-serif', letterSpacing: '0.08em',
          }}
        >
          {p.kind}
        </span>
        <div style={{ fontSize: 38, margin: '14px 0 10px', letterSpacing: '0.04em' }}>{p.title}</div>
        <div style={{ fontSize: 15, lineHeight: 1.9, color: '#6a5f5a' }}>{p.line}</div>
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

const btn = {
  font: '11px ui-monospace, Consolas, monospace',
  padding: '5px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.06)',
  color: '#ece6dd',
}
