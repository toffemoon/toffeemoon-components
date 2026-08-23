import { useState } from 'react'
import { RainLayer } from '../../library/motion/rain-layer/RainLayer.jsx'

// 组件本身刻意是"细、暗、慢"的 —— 默认值在满屏背景上恰好,但在这块小画布里
// 几乎看不见。所以演示台把默认值抬高一档(雨量 1.8 / 浓度 2.4),三个滑块可现调。
// density 改变会重建雨滴,speed / opacity 是下一帧就生效。

const SLIDERS = [
  ['density', '频率', 0.2, 4, 0.1],
  ['speed', '速度', 0.2, 4, 0.1],
  ['opacity', '浓度', 0.3, 5, 0.1],
]

export default function Demo() {
  const [p, setP] = useState({ density: 1.8, speed: 1, opacity: 2.4 })
  const set = (k) => (e) => setP((x) => ({ ...x, [k]: +e.target.value }))

  return (
    <div
      className="stage stage--bleed"
      style={{ position: 'relative', background: 'linear-gradient(#0a0f14, #05080b)' }}
    >
      <RainLayer density={p.density} speed={p.speed} opacity={p.opacity} />

      <div
        style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontSize: 13, letterSpacing: '0.22em', color: 'rgba(236,230,221,0.26)',
          pointerEvents: 'none',
        }}
      >
        细、暗、慢
      </div>

      <div
        style={{
          position: 'absolute', left: 14, bottom: 12, zIndex: 5,
          display: 'flex', flexDirection: 'column', gap: 6,
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(8,12,16,0.72)', border: '1px solid rgba(255,255,255,0.08)',
          font: '10.5px ui-monospace, Consolas, monospace', color: '#9aa7ad',
        }}
      >
        {SLIDERS.map(([key, label, min, max, step]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 30 }}>{label}</span>
            <input
              type="range" min={min} max={max} step={step} value={p[key]}
              onChange={set(key)} style={{ width: 120, accentColor: '#22d3ee' }}
            />
            <span style={{ width: 26, textAlign: 'right', color: '#cfe0e6' }}>
              {p[key].toFixed(1)}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
