import '../../library/token/muyan/base.css'
import PillNav from '../../library/nav/pill-nav/PillNav.jsx'
import '../../library/nav/pill-nav/PillNav.css'

const items = [
  { label: '探索', href: '/explore' },
  { label: '故事', href: '/story' },
  { label: '创作', href: '/create' },
  { label: '我的', href: '/mine' },
]

export default function Demo() {
  return (
    <div
      className="stage stage--top"
      data-theme="paper"
      style={{ background: 'var(--bg)', color: 'var(--fg)', paddingTop: 34 }}
    >
      <PillNav items={items} activeHref="/story" />
    </div>
  )
}
