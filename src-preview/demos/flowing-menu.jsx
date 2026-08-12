import '../../library/token/muyan/base.css'
import FlowingMenu from '../../library/nav/flowing-menu/FlowingMenu.jsx'
import '../../library/nav/flowing-menu/FlowingMenu.css'

const items = [
  { text: '探索', href: '/explore' },
  { text: '故事', href: '/story' },
  { text: '创作', href: '/create' },
  { text: '我的', href: '/mine' },
]

export default function Demo() {
  return (
    <div
      className="stage stage--bleed"
      data-theme="stage"
      style={{ background: 'var(--bg)', color: 'var(--fg)' }}
    >
      <div style={{ height: '100%' }}>
        <FlowingMenu items={items} />
      </div>
    </div>
  )
}
