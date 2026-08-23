import { useState } from 'react'
import FrameBorder from '../../library/3d-scene/frame-border/frame-border.tsx'
import '../../library/3d-scene/frame-border/frame-border.css'

// 这个组件的用法是"给一块内容套一圈会动的着色器边框",内容走 children
// (渲在 .frame-border-content,z-index 高于 canvas)。原来的演示台只放了一行字,
// 看不出它是干什么用的 —— 2026-08-23 改成真的框住一张照片,并给几组参数预设。
//
// 边框是 fbm 噪声算出来的:uWidth 定厚度、uCurve 定衰减、uNoiseScale/uNoiseAmt 定纹理,
// 所以同一个 shader 能出"霓虹""烛照""薄雾"完全不同的味道。

const PRESETS = [
  {
    name: '霓虹',
    photo: '/wall/03.jpg',
    props: { color: '#FF9FFC', backgroundColor: '#000000', borderWidth: 0.22, falloff: 6, noiseScale: 3, noiseStrength: 1, intensity: 1, speed: 0.12 },
  },
  {
    name: '烛照',
    photo: '/wall/05.jpg',
    props: { color: '#FFB169', backgroundColor: '#0a0603', borderWidth: 0.3, falloff: 4, noiseScale: 2.2, noiseStrength: 0.85, intensity: 1.25, speed: 0.08 },
  },
  {
    name: '薄雾',
    photo: '/wall/01.jpg',
    props: { color: '#9FD8FF', backgroundColor: '#04070b', borderWidth: 0.4, falloff: 2.6, noiseScale: 1.6, noiseStrength: 0.6, intensity: 0.9, speed: 0.05 },
  },
  {
    name: '锐边',
    photo: '/wall/07.jpg',
    props: { color: '#E8FFB0', backgroundColor: '#000000', borderWidth: 0.1, falloff: 9, noiseScale: 5, noiseStrength: 1, intensity: 1.6, speed: 0.22 },
  },
]

export default function Demo() {
  const [i, setI] = useState(0)
  const p = PRESETS[i]

  return (
    <div className="stage" style={{ position: 'relative', background: '#08080a' }}>
      <div style={{ position: 'relative', width: 560, height: 330 }}>
        <FrameBorder key={i} {...p.props}>
          {/* children 落在 .frame-border-content 上,那层已铺满容器(见 frame-border.css) */}
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
            <div
              style={{
                width: '62%', aspectRatio: '24 / 14', overflow: 'hidden', borderRadius: 3,
                boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
              }}
            >
              <img
                src={p.photo} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </FrameBorder>
      </div>

      <div style={{ position: 'absolute', left: 14, bottom: 12, display: 'flex', gap: 4, zIndex: 10 }}>
        {PRESETS.map((x, k) => (
          <button
            key={x.name}
            onClick={() => setI(k)}
            style={{
              font: '10.5px ui-monospace, Consolas, monospace', padding: '3px 9px',
              color: i === k ? '#0d0c0b' : '#9a9088',
              background: i === k ? '#c9975c' : 'rgba(20,18,16,0.86)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, cursor: 'pointer',
            }}
          >
            {x.name}
          </button>
        ))}
      </div>
    </div>
  )
}
