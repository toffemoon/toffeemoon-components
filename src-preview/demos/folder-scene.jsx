import { useState } from 'react'
import '../../library/token/toffeemoon/styles.css'
import { FolderScene } from '../../library/3d-scene/folder-scene/FolderScene.jsx'

export default function Demo() {
  const [i, setI] = useState(0)
  return (
    <div className="stage stage--bleed" style={{ position: 'relative', background: '#0b0b0e' }}>
      <FolderScene activeIndex={i} />
      <div style={{ position: 'absolute', left: 14, bottom: 12, display: 'flex', gap: 6, zIndex: 20 }}>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => setI(n)}
            style={{
              font: '11px ui-monospace, Consolas, monospace', padding: '3px 9px',
              color: i === n ? '#0b0b0e' : '#cfc7bd',
              background: i === n ? '#c9975c' : 'rgba(20,18,16,0.8)',
              border: '1px solid rgba(255,255,255,0.14)', borderRadius: 5, cursor: 'pointer',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
