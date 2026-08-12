import { RainLayer } from '../../library/motion/rain-layer/RainLayer.jsx'

export default function Demo() {
  return (
    <div
      className="stage stage--bleed"
      style={{ position: 'relative', background: 'linear-gradient(#0a0f14, #05080b)' }}
    >
      <RainLayer />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: 13,
          letterSpacing: '0.22em',
          color: 'rgba(236,230,221,0.3)',
          pointerEvents: 'none',
        }}
      >
        细、暗、慢
      </div>
    </div>
  )
}
