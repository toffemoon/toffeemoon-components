import { Compass, Brush, MessagesSquare, UserRound, Home } from 'lucide-react'
import '../../library/token/muyan/base.css'
import Dock from '../../library/nav/dock/Dock.jsx'
import '../../library/nav/dock/Dock.css'

const items = [
  { icon: <Home size={20} />, label: '首页' },
  { icon: <Compass size={20} />, label: '探索' },
  { icon: <Brush size={20} />, label: '创作' },
  { icon: <MessagesSquare size={20} />, label: '论坛' },
  { icon: <UserRound size={20} />, label: '我的' },
]

export default function Demo() {
  return (
    <div
      className="stage"
      data-theme="paper"
      style={{ background: 'var(--bg)', color: 'var(--fg)', alignItems: 'flex-end', paddingBottom: 40 }}
    >
      <div className="unit" style={{ width: '100%' }}>
        <div className="lbl">鼠标横向划过 —— 图标随距离放大</div>
        <Dock items={items} />
      </div>
    </div>
  )
}
