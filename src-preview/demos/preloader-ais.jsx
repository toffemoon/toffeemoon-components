import { useState } from 'react'
import { MuyanStage } from '../muyan.jsx'
import Preloader from '../../library/motion/preloader-ais/preloader.tsx'
import '../../library/motion/preloader-ais/preloader.css'

// 来源存疑的一件:Toffeemoon / commonhers-web / AI互动故事 里各有一份几乎相同的 526 行拷贝,
// 出处没标注。先当能用的东西演示,归属等核实。

export default function Demo() {
  const [n, setN] = useState(0)
  return (
    <MuyanStage theme="stage" pad={0}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Preloader key={n} />
        <button
          onClick={() => setN((x) => x + 1)}
          style={{
            position: 'absolute', right: 14, bottom: 12, zIndex: 60,
            font: '11px ui-monospace, Consolas, monospace', padding: '4px 10px',
            color: '#cfc7bd', background: 'rgba(20,18,16,0.8)',
            border: '1px solid rgba(255,255,255,0.14)', borderRadius: 5, cursor: 'pointer',
          }}
        >
          重放
        </button>
      </div>
    </MuyanStage>
  )
}
