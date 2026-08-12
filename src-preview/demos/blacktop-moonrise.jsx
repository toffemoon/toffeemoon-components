import { useState } from 'react'
import '../../library/token/toffeemoon/styles.css'
import { BlacktopMoonrise } from '../../library/motion/blacktop-moonrise/BlacktopMoonrise.jsx'

export default function Demo() {
  const [n, setN] = useState(0)
  return (
    <div className="stage stage--bleed" style={{ position: 'relative', background: '#05060a' }}>
      <BlacktopMoonrise key={n} onComplete={() => {}} onReveal={() => {}} />
      <button
        onClick={() => setN((x) => x + 1)}
        style={{
          position: 'absolute', right: 14, bottom: 12, zIndex: 20,
          font: '11px ui-monospace, Consolas, monospace', padding: '4px 10px',
          color: '#cfc7bd', background: 'rgba(20,18,16,0.8)',
          border: '1px solid rgba(255,255,255,0.14)', borderRadius: 5, cursor: 'pointer',
        }}
      >
        重放
      </button>
    </div>
  )
}
