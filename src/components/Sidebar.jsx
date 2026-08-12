import { NavLink, useNavigate } from 'react-router-dom'
import { CATEGORIES, COMPONENTS, OWNERS, byCategory } from '../data/components.js'

export default function Sidebar({ query, setQuery }) {
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">Toffeemoon Components</div>
        <div className="brand-sub">{COMPONENTS.length} 组 · 私人库</div>
      </div>

      <input
        className="search"
        value={query}
        placeholder="搜组件名 / 源码内容"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => navigate('/')}
      />

      {CATEGORIES.map((cat) => {
        const items = byCategory(cat.id)
        if (!items.length) return null
        return (
          <div className="cat-group" key={cat.id}>
            <div className="cat-head">
              <span className="n">{cat.name}</span>
              <span className="c">{items.length}</span>
            </div>
            {items.map((c) => (
              <NavLink
                key={c.slug}
                to={`/c/${c.cat}/${c.slug}`}
                className={({ isActive }) => 'item' + (isActive ? ' on' : '')}
              >
                <span className={'dot d-' + OWNERS[c.owner].tone} />
                <span>{c.name}</span>
              </NavLink>
            ))}
          </div>
        )
      })}
    </aside>
  )
}
