import { useEffect, useRef, useState } from 'react'
import { Wall2D } from '../../library/3d-scene/flipboard-wall-2d/index.js'
import { config as BASE } from '../../library/3d-scene/flipboard-wall-2d/config.js'
import '../../library/3d-scene/flipboard-wall-2d/wall2d.css'

// 纯 DOM + CSS 的翻板墙,不碰 WebGL。timing.js 和默认 config 都是 2D 目录自带的,不牵 3D 版。
//
// Wall2D 是个类不是组件,所以这里手动挂载 / 卸载 —— 而且**必须调 show()**,
// 不调的话 visible 一直是 false,schedule() 直接 return,整面墙不会翻。

// public/wall/ 下的八张,已按 24:14 裁好(墙的网格比例),不用再等浏览器缩放。
const SOURCES = ['01', '02', '03', '04', '05', '06', '07', '08'].map((n) => `/wall/${n}.jpg`)

const MODES = ['random', 'diagonal', 'center-out', 'center-in', 'col-sweep', 'row-sweep', 'batch', 'ripple']
const FLIPS = [
  ['scaley', '压扁翻'],
  ['flip3d', 'CSS 3D 翻'],
  ['fade', '直接淡'],
]

const BTN = (on) => ({
  font: '10.5px ui-monospace, Consolas, monospace',
  padding: '3px 8px',
  color: on ? '#0d0c0b' : '#9a9088',
  background: on ? '#c9975c' : 'rgba(20,18,16,0.86)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4,
  cursor: 'pointer',
})

export default function Demo() {
  const box = useRef(null)
  const wall = useRef(null)
  const [mode, setMode] = useState(1) // diagonal —— 方向最好认
  const [flip, setFlip] = useState(0)

  useEffect(() => {
    if (!box.current) return
    // 先把图预热,否则第一次翻过去那面还是空的
    SOURCES.forEach((s) => {
      const im = new Image()
      im.src = s
    })

    const w = new Wall2D({
      root: box.current,
      sources: SOURCES,
      config: {
        ...BASE,
        render: { ...BASE.render, flip2d: FLIPS[flip][0] },
        flip: { ...BASE.flip, mode: MODES[mode] },
      },
    })
    w.show() // ← 没有这一句整面墙是静止的
    wall.current = w

    return () => {
      try {
        w.dispose()
      } catch {
        /* 卸载时报错无所谓,整棵都要被拆掉 */
      }
      if (box.current) box.current.innerHTML = ''
    }
  }, [mode, flip])

  return (
    <div className="stage stage--bleed" style={{ position: 'relative', background: '#0d0c0b' }}>
      {/* 不要给它写 width/height —— .wall2d 自己是 fixed + inset:0 + margin:auto,
          尺寸由 min(84vw, 82vh * aspect) 定死,写了行内尺寸会压过去把墙拉变形 */}
      <div ref={box} />
      <div
        style={{
          position: 'absolute', left: 12, bottom: 10, zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 5, maxWidth: '92%',
        }}
      >
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {FLIPS.map(([id, label], i) => (
            <button key={id} onClick={() => setFlip(i)} style={BTN(flip === i)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {MODES.map((m, i) => (
            <button key={m} onClick={() => setMode(i)} style={BTN(mode === i)}>
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
