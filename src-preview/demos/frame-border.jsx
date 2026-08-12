import FrameBorder from '../../library/3d-scene/frame-border/frame-border.tsx'
import '../../library/3d-scene/frame-border/frame-border.css'

export default function Demo() {
  return (
    <div className="stage" style={{ background: '#0b0b0e' }}>
      <div style={{ position: 'relative', width: 460, height: 260 }}>
        <FrameBorder />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: 14,
            letterSpacing: '0.14em',
            opacity: 0.6,
          }}
        >
          着色器画的边框
        </div>
      </div>
    </div>
  )
}
