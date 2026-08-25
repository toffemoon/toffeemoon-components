import { useEffect, useRef, useState } from 'react'
import { RainLayer } from '../../library/motion/rain-layer/RainLayer.jsx'

// 2026-08-26 诊断:病根不是「不动」。连拍 10 帧量过 —— 帧间变化峰值 2.55%、
// canvas 尺寸 1070×620 正常、无报错,它一直在下雨。问题是那雨太细太淡,
// 在演示台这个尺寸上等于没有。
//
// 翻组件源码确认:雨丝的粗细和亮度都写死在 createDrop 里,不是 props ——
//   lineWidth = 0.35 + depth * 0.85   → 最粗 1.2 CSS px
//   alpha     = 0.05 + depth * 0.16   → 最亮 0.21,再乘 opacity
// 外面能传的只有 density(雨滴数量,改了会重建)/ speed / opacity(alpha 倍数)。
// 而画廊缩略图的排版是「视口放到 2.5 倍,再 transform: scale(0.4)」,净效果是
// demo 里一条 1px 的线落到卡片上只剩 0.4px:抗锯齿把它摊成一条更淡的线。
// 旧版把 density/opacity 各抬了一档救不回来 —— 那两个参数动不了线宽,
// 加再多、再亮,每一根还是亚像素。
//
// 不能改组件源码(收编自原项目,改了跟原项目对不上),所以在 demo 侧补两招:
//
// 1) 「缩小排版 + CSS 放大」的壳。wrapper 只占舞台的 1/K,再 scale(K) 撑回满幅。
//    canvas 按 wrapper 的布局尺寸绘制,整块被放大 K 倍 —— 线宽和雨丝长度一起
//    变粗变长,正好抵掉缩略图那个 0.4。副作用是下落速度也被放大 K 倍,所以
//    speed 默认压到 0.6,乘回来约等于组件原本的「慢」。
// 2) density / opacity 默认拉高、滑块上限放开(组件对这两个值没有上限校验)。
//    按「覆盖面积 × alpha」估算,现在落到画面上的墨量约是旧版的 8 倍,
//    每根线还宽 1.8 倍 —— 但雨丝峰值 alpha 仍只有 0.63、覆盖约 7% 画面,
//    还是一场安静的雨,不是黑客帝国。
//
// 另外补了个 ResizeObserver:组件只在 window resize 时重新测容器,首帧挂载
//   如果容器还没排布好,它会退回 window.innerWidth —— 那对满屏背景没问题,
//   对这个只占 1/K 的 wrapper 就会量错。观察 wrapper 尺寸、变了就补发一次
//   resize,让组件自己重测。(HMR 热更时确实撞到过 canvas 0×0。)
//
// 背景一并改了:原来是纯深蓝黑渐变,缩略图上就是个黑方块。现在顶上留一点冷天光、
// 底下压暗 —— 雨丝的亮端在下方,亮端压在暗场上对比最大,顶上那点光只负责让画面
// 不是一块死黑。分寸拿在「窗外的天色」,没加装饰。
//
// 正中间那行 rgba(...,0.26) 的「细、暗、慢」删了:13px 缩到缩略图上只剩 5px,
// 字读不出来,还在画面正中留一团脏点。挪进左下角参数面板当一行小注。

// 放大倍数。1.8 是折中:再大,雨丝会长到占掉画面三分之一,「细」的性格就没了;
// 再小,缩略图上又回到亚像素。
const K = 1.8

const BG =
  'radial-gradient(120% 78% at 50% 2%, rgba(84,112,130,0.30), rgba(8,12,17,0) 60%),' +
  'radial-gradient(96% 62% at 50% 108%, rgba(0,0,0,0.55), rgba(0,0,0,0) 72%),' +
  'linear-gradient(180deg, #0c1218 0%, #060a0e 100%)'

// 滑块给的是组件的真实入参,没有被 K 换算过 —— 详情页拖它就是在拖 props。
const SLIDERS = [
  ['density', '频率', 0.5, 8, 0.1],
  ['speed', '速度', 0.2, 3, 0.05],
  ['opacity', '浓度', 0.3, 6, 0.1],
]

export default function Demo() {
  const [p, setP] = useState({ density: 4.2, speed: 0.6, opacity: 3 })
  const set = (k) => (e) => setP((x) => ({ ...x, [k]: +e.target.value }))
  const hostRef = useRef(null)

  useEffect(() => {
    const el = hostRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    let last = ''
    const ro = new ResizeObserver(() => {
      const key = `${el.clientWidth}x${el.clientHeight}`
      if (key === last) return
      last = key
      window.dispatchEvent(new Event('resize'))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      className="stage stage--bleed"
      style={{ position: 'relative', overflow: 'hidden', background: BG }}
    >
      {/* 见顶部第 1 招:按 1/K 排版,再 scale(K) 放大回来 */}
      <div
        ref={hostRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${100 / K}%`,
          height: `${100 / K}%`,
          transform: `scale(${K})`,
          transformOrigin: '0 0',
          pointerEvents: 'none',
        }}
      >
        <RainLayer density={p.density} speed={p.speed} opacity={p.opacity} />
      </div>

      <div
        style={{
          position: 'absolute', left: 16, bottom: 14, zIndex: 5,
          display: 'flex', flexDirection: 'column', gap: 7,
          padding: '11px 13px 12px', borderRadius: 9,
          background: 'rgba(8,12,16,0.74)', border: '1px solid rgba(255,255,255,0.09)',
          font: '11px ui-monospace, Consolas, monospace', color: '#9aa7ad',
        }}
      >
        <div className="lbl" style={{ margin: '0 0 1px', textAlign: 'left', opacity: 0.5 }}>
          细 · 暗 · 慢
        </div>

        {SLIDERS.map(([key, label, min, max, step]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 32 }}>{label}</span>
            <input
              type="range" min={min} max={max} step={step} value={p[key]}
              onChange={set(key)} style={{ width: 124, accentColor: '#7fb3c4' }}
            />
            <span style={{ width: 28, textAlign: 'right', color: '#cfe0e6' }}>
              {p[key].toFixed(1)}
            </span>
          </label>
        ))}

        <div style={{ fontSize: 9.5, opacity: 0.42, marginTop: 1, letterSpacing: '0.02em' }}>
          画面整体放大 {K}×,数值是组件真实入参
        </div>
      </div>
    </div>
  )
}
