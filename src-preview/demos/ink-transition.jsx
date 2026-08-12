import { useState } from 'react'
import { MuyanStage } from '../muyan.jsx'
import { inkInto } from '../../library/motion/ink-transition/inkTransition.js'
import '../../library/motion/ink-transition/transition-tuning.css'

// 水墨转场:点按钮触发,墨扩散铺满再散开,中间那一下才真正换页。
// inkInto(navigate, to) —— 第一个参数是路由跳转函数,演示台里传一个空实现,
// 只看动画本身。

export default function Demo() {
  const [n, setN] = useState(0)
  return (
    <MuyanStage theme="stage">
      <div className="col" style={{ gap: 16 }}>
        <div className="lbl">点一下看墨怎么铺开</div>
        <button
          onClick={() => {
            inkInto(() => setN((x) => x + 1), '/play')
          }}
          style={{
            font: '13px system-ui, sans-serif',
            padding: '10px 26px',
            borderRadius: 10,
            cursor: 'pointer',
            border: '1px solid var(--line)',
            background: 'var(--panel)',
            color: 'var(--fg)',
          }}
        >
          推门进去
        </button>
        <div style={{ fontSize: 12, opacity: 0.42, fontFamily: 'ui-monospace, Consolas, monospace' }}>
          已触发 {n} 次
        </div>
      </div>
    </MuyanStage>
  )
}
