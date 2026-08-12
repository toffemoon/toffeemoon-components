import { useState } from 'react'
import '../../library/token/toffeemoon/styles.css'
import { Preloader } from '../../library/motion/surface-tension/Preloader.jsx'

// Preloader 是三个 loader 变体的总入口(surface 默认 / ?loader=blacktop / ?loader=puddle),
// 这里演示默认的 Surface Tension:水滴透镜当加载圈,完成时塌陷坠落砸中月亮倒影,
// 涟漪把首页揭示出来。
//
// 揭示动画是一次性的,所以给一个「重放」按钮 —— 换 key 重新挂载整棵。

export default function Demo() {
  const [n, setN] = useState(0)
  return (
    <div className="stage stage--bleed" style={{ position: 'relative', background: '#07070a' }}>
      <Preloader key={n} onComplete={() => {}} onReveal={() => {}} />
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
