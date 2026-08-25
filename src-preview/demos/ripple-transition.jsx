import { useCallback, useEffect, useRef, useState } from 'react'
import { rippleInto, RIPPLE_DEFAULTS } from '../../library/motion/ripple-transition/rippleTransition.js'
import '../../library/motion/ripple-transition/ripple-transition.css'

// 涟漪转场:从落点扩开一圈圈水纹,盖满的那一下换页,然后淡出。
//
// 这个演示台踩过的坑,留给下一个人:
//
// 1) 覆盖层的颜色一度和台子的底色是同一个 #221c16(前身落墨转场的 --stage-bg)。
//    一块深色在深色上涨开等于隐形,实测帧差峰值只有 1.40%。所以台子必须是**亮底** ——
//    而且这才是它在原项目里的真实用法:从纸(亮)跳进台(暗),覆盖层就是目的地的底色,
//    盖住主题翻转,散开时新页已经在下面了。不是为了好看硬调色。
//
// 2) 光让它动没用,得让人看出「换页」。上一版盖住的底下还是同一块空台子,
//    观众看不出遮住那一瞬发生了什么。这里底下真的换页:四张页轮着走,
//    底色 / 印色 / 标题全不一样。
//
// 3) 画廊缩略图**点不进去**(上面盖了 .thumb-veil),所以必须自己循环播;
//    而且空档不能长 —— 截到任何一帧都得有画面。一轮里覆盖层活约
//    620/speed + 120 + 320 ms,CYCLE 按它推,不是拍脑袋的常数。
//
// 换页时机:rippleInto 是在**盖满的那一帧**回调 navigate 的(源码里判 R >= maxR*0.995),
// 所以演示台直接把 setState 挂上去就行,不用像前身那样自己排 setTimeout。

const PAGES = [
  { tint: '#f6e2dd', seal: '#8f3c32', kind: '完整故事', title: '猫与咖啡馆', line: '你推开一扇总在下雨的门。店主记得每位客人的口味,却记不住自己的名字。' },
  { tint: '#f4ecd9', seal: '#ad7a24', kind: '角色卡', title: '糖沐', line: '沐言书坊的店员。话不多,记性好,给熟客多放一颗糖。' },
  { tint: '#e6efe9', seal: '#315d4f', kind: '世界书', title: '常雨镇', line: '一座三百天在下雨的小镇。雨停的那天,所有人都会想起点什么。' },
  { tint: '#ffffff', seal: '#8f3c32', kind: '演出卡', title: '第一次来的客人', line: '你不记得自己为什么走进来,但伞是干的。' },
]

// 落点轮着走,一眼看出水纹是从某一点扩开的,不是整屏淡入
const SPOTS = [
  [0.5, 0.55], [0.18, 0.26], [0.82, 0.3], [0.26, 0.78], [0.78, 0.72],
]

// 滑块给的就是组件的真实入参,拖它就是在拖 props
const SLIDERS = [
  ['speed', '速度', 0.4, 2.5, 0.1, '时长倍率。大 = 快'],
  ['curvature', '曲率', 0.5, 4, 0.1, '>1 起手快收尾慢,圈朝后堆'],
  ['rings', '圈数', 0, 9, 1, '0 就退化成一个纯色圆'],
  ['amplitude', '波幅', 0, 1, 0.05, '圈的明暗对比'],
]

export default function Demo() {
  const [p, setP] = useState({
    speed: RIPPLE_DEFAULTS.speed,
    curvature: RIPPLE_DEFAULTS.curvature,
    rings: RIPPLE_DEFAULTS.rings,
    amplitude: RIPPLE_DEFAULTS.amplitude,
  })
  const [auto, setAuto] = useState(true)
  const [idx, setIdx] = useState(0)
  const [n, setN] = useState(0)
  const spot = useRef(0)
  const params = useRef(p)
  const abort = useRef(null)
  useEffect(() => {
    params.current = p
  }, [p])

  const hostRef = useRef(null)

  const fire = useCallback(() => {
    const el = hostRef.current
    const r = el ? el.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 }
    const [fx, fy] = SPOTS[spot.current % SPOTS.length]
    spot.current += 1
    abort.current = rippleInto(
      () => {
        setIdx((i) => (i + 1) % PAGES.length)
        setN((x) => x + 1)
      },
      '/play',
      { ...params.current, origin: { x: r.left + r.width * fx, y: r.top + r.height * fy } },
    )
  }, [])

  // 一轮 = 覆盖层活的时长 + 一段留给看新页的时间
  const life = RIPPLE_DEFAULTS.baseMs / Math.max(0.1, p.speed) + RIPPLE_DEFAULTS.holdMs + RIPPLE_DEFAULTS.fadeMs
  const cycle = Math.round(life + 760)

  useEffect(() => {
    if (!auto) return undefined
    const first = setTimeout(fire, 420)
    const id = setInterval(fire, cycle)
    return () => {
      clearTimeout(first)
      clearInterval(id)
      abort.current?.()
      document.querySelector('.mu-ripple')?.remove()
    }
  }, [auto, cycle, fire])

  const page = PAGES[idx]

  return (
    <div
      ref={hostRef}
      className="stage stage--bleed"
      style={{
        position: 'relative',
        background: page.tint,
        transition: 'background 0.25s linear',
        fontFamily: '"Songti SC", "STSong", "Source Han Serif SC", serif',
        color: '#3a3230',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 560, textAlign: 'left' }}>
          <span
            style={{
              display: 'inline-block', padding: '3px 11px', borderRadius: 999,
              border: `1px solid ${page.seal}44`, color: page.seal,
              font: '12px ui-sans-serif, system-ui, sans-serif', letterSpacing: '0.08em',
            }}
          >
            {page.kind}
          </span>
          <div style={{ fontSize: 38, margin: '14px 0 10px', letterSpacing: '0.04em' }}>{page.title}</div>
          <div style={{ fontSize: 15, lineHeight: 1.9, color: '#6a5f5a' }}>{page.line}</div>
        </div>
      </div>

      {/* 参数面板。详情页可以拖,画廊缩略图里只是一块安静的角标。 */}
      <div
        style={{
          position: 'absolute', left: 14, bottom: 12, zIndex: 5,
          display: 'flex', flexDirection: 'column', gap: 5,
          padding: '10px 12px', borderRadius: 9,
          background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(58,50,48,0.14)',
          backdropFilter: 'blur(6px)',
          font: '11px ui-monospace, Consolas, monospace', color: '#6a5f5a',
        }}
      >
        {SLIDERS.map(([key, label, min, max, step, hint]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={hint}>
            <span style={{ width: 28 }}>{label}</span>
            <input
              type="range" min={min} max={max} step={step} value={p[key]}
              onChange={(e) => setP((x) => ({ ...x, [key]: +e.target.value }))}
              style={{ width: 116, accentColor: page.seal }}
            />
            <span style={{ width: 26, textAlign: 'right', color: '#3a3230' }}>
              {step < 1 ? p[key].toFixed(2).replace(/0$/, '') : p[key]}
            </span>
          </label>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
          <button onClick={fire} style={btn(page.seal)}>手动推一次</button>
          <button onClick={() => setAuto((a) => !a)} style={btn(page.seal)}>
            {auto ? '停下自动播' : '开始自动播'}
          </button>
        </div>
        <div style={{ opacity: 0.6, marginTop: 2 }}>
          已换 {n} 页{auto ? ` · 每 ${(cycle / 1000).toFixed(1)}s 一轮` : ''}
        </div>
      </div>
    </div>
  )
}

const btn = (accent) => ({
  font: '11px ui-monospace, Consolas, monospace',
  padding: '5px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  border: `1px solid ${accent}33`,
  background: 'rgba(255,255,255,0.7)',
  color: '#3a3230',
})
