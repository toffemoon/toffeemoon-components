import { useEffect, useRef, useState } from 'react'
import { MuyanStage } from '../muyan.jsx'
import { inkInto } from '../../library/motion/ink-transition/inkTransition.js'
import '../../library/motion/ink-transition/transition-tuning.css'

// 水墨转场:墨从落点涨圆盖满屏,中间那一下才真正换页,然后淡出。
// inkInto(navigate, to) —— 第一个参数是路由跳转函数,演示台传空实现,只看动画。
//
// 2026-08-23:原来只有一个按钮,不点什么都看不到(画廊缩略图里就是一张静态图)。
// 改成默认自动循环,落点在画面里轮着走,这样缩略图和详情页都能直接看见效果。

// 一轮总长:扩散 + 停 120ms + 淡出 340ms,兜底 1000ms。留够间隔再起下一轮。
const CYCLE = 2600

// 墨的落点:inkInto 读 transitionNav 记录的最后点击位置,这里直接写 CSS 变量伪造,
// 让每轮从不同角落起,一眼看出它是从落点涨开的而不是整屏淡入。
const SPOTS = [
  [0.5, 0.5], [0.16, 0.24], [0.84, 0.3], [0.28, 0.8], [0.76, 0.74],
]

export default function Demo() {
  const [auto, setAuto] = useState(true)
  const [n, setN] = useState(0)
  const round = useRef(0)

  const fire = () => {
    const host = document.documentElement
    const [fx, fy] = SPOTS[round.current % SPOTS.length]
    round.current += 1
    host.style.setProperty('--ix', `${window.innerWidth * fx}px`)
    host.style.setProperty('--iy', `${window.innerHeight * fy}px`)
    inkInto(() => setN((x) => x + 1), '/play')
  }

  useEffect(() => {
    if (!auto) return
    const first = setTimeout(fire, 500)
    const id = setInterval(fire, CYCLE)
    return () => {
      clearTimeout(first)
      clearInterval(id)
      document.querySelector('.mu-ink')?.remove()
    }
  }, [auto])

  return (
    <MuyanStage theme="stage">
      <div className="col" style={{ gap: 14 }}>
        <div className="lbl">墨从落点涨开,盖满的那一下才换页</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fire} style={btn}>手动推一次</button>
          <button onClick={() => setAuto((a) => !a)} style={btn}>
            {auto ? '停下自动播' : '开始自动播'}
          </button>
        </div>
        <div style={{ fontSize: 12, opacity: 0.42, fontFamily: 'ui-monospace, Consolas, monospace' }}>
          已触发 {n} 次{auto ? ` · 每 ${CYCLE / 1000}s 一轮` : ''}
        </div>
      </div>
    </MuyanStage>
  )
}

const btn = {
  font: '13px system-ui, sans-serif',
  padding: '9px 20px',
  borderRadius: 10,
  cursor: 'pointer',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  color: 'var(--fg)',
}
