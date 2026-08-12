import { useEffect, useRef, useState } from 'react'
import { Wall2D } from '../../library/3d-scene/flipboard-wall-2d/index.js'
import { config as BASE } from '../../library/3d-scene/flipboard-wall/config.js'
import '../../library/3d-scene/flipboard-wall-2d/wall2d.css'

// 纯 DOM + CSS 的翻板墙,不碰 WebGL。和 3D 版共用同一个 timing.js,一行没改。
// Wall2D 是个类不是组件,所以这里手动挂载 / 卸载。
//
// 两张源图用 canvas 现画 —— 不想为了演示再往库里塞两张图。

function makePlate(text, bg, fg) {
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 400
  const g = c.getContext('2d')
  g.fillStyle = bg
  g.fillRect(0, 0, 640, 400)
  g.fillStyle = fg
  g.font = '600 130px system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 320, 200)
  return c.toDataURL()
}

const MODES = ['random', 'diagonal', 'center-out', 'center-in', 'col-sweep', 'row-sweep', 'batch', 'ripple']

export default function Demo() {
  const box = useRef(null)
  const wall = useRef(null)
  const [mode, setMode] = useState(0)

  useEffect(() => {
    if (!box.current) return
    // Wall2D 吃的是整份 config(grid / panel / flip / render 都要),
    // 不是只给一个 mode —— 所以拿原项目的默认值改 flip.mode。
    wall.current = new Wall2D({
      root: box.current,
      srcA: makePlate('A', '#1c1a17', '#c9975c'),
      srcB: makePlate('B', '#c9975c', '#1c1a17'),
      config: {
        ...BASE,
        render: { ...BASE.render, mode: '2D' },
        flip: { ...BASE.flip, mode: MODES[mode] },
      },
    })
    return () => {
      try {
        wall.current?.dispose?.()
      } catch {
        /* 没有 dispose 就算了,整棵会被卸掉 */
      }
      if (box.current) box.current.innerHTML = ''
    }
  }, [mode])

  return (
    <div className="stage stage--bleed" style={{ position: 'relative', background: '#0d0c0b' }}>
      <div ref={box} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute', left: 12, bottom: 10, zIndex: 20,
          display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: '92%',
        }}
      >
        {MODES.map((m, i) => (
          <button
            key={m}
            onClick={() => setMode(i)}
            style={{
              font: '10.5px ui-monospace, Consolas, monospace', padding: '3px 8px',
              color: mode === i ? '#0d0c0b' : '#9a9088',
              background: mode === i ? '#c9975c' : 'rgba(20,18,16,0.86)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
