import { Link } from 'react-router-dom'
import { CATEGORIES, COMPONENTS, OWNERS, byCategory } from '../data/components.js'
import { stats, grep } from '../data/sources.js'

const S = stats()

function OwnerTag({ owner }) {
  const o = OWNERS[owner]
  return <span className={'tag-owner o-' + o.tone}>{o.label}</span>
}

function Card({ c }) {
  return (
    <Link className="card" to={`/c/${c.cat}/${c.slug}`}>
      <div className="card-top">
        <span className="card-name">{c.name}</span>
        <OwnerTag owner={c.owner} />
      </div>
      <div className="card-desc">{c.desc}</div>
      <div className="card-foot">
        <span>{c.from}</span>
        {c.preview && <span className="badge-live">可预览</span>}
      </div>
    </Link>
  )
}

function SearchResults({ query }) {
  const q = query.trim()
  const nameHits = COMPONENTS.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.slug.includes(q.toLowerCase()),
  )
  const codeHits = grep(q)

  return (
    <>
      <div className="page-head">
        <h1>搜索「{q}」</h1>
        <p>
          组件名 {nameHits.length} 条 · 源码 {codeHits.length} 条
          {codeHits.length >= 60 && '(只显示前 60 条)'}
        </p>
      </div>

      {nameHits.length > 0 && (
        <div className="sec">
          <div className="sec-head">
            <h2>组件</h2>
          </div>
          <div className="grid">
            {nameHits.map((c) => (
              <Card key={c.slug} c={c} />
            ))}
          </div>
        </div>
      )}

      {codeHits.length > 0 && (
        <div className="sec">
          <div className="sec-head">
            <h2>源码</h2>
            <span className="hint">跨全库逐行匹配</span>
          </div>
          {codeHits.map((h, i) => (
            <Link className="hit" key={i} to={`/c/${h.cat}/${h.slug}`}>
              <div className="hit-loc">
                {h.slug}/{h.path}:{h.line}
              </div>
              <div className="hit-txt">{h.text.slice(0, 220)}</div>
            </Link>
          ))}
        </div>
      )}

      {!nameHits.length && !codeHits.length && <div className="empty">没有匹配。</div>}
    </>
  )
}

export default function Index({ query }) {
  if (query.trim().length >= 2) return <SearchResults query={query} />

  const self = COMPONENTS.filter((c) => c.owner === 'self').length
  const live = COMPONENTS.filter((c) => c.preview).length

  return (
    <>
      <div className="page-head">
        <h1>Toffeemoon Components</h1>
        <p>
          散在翻板墙、沐言书坊、Ripple、AI 互动故事、Yuqin portfolio 这些项目里的组件、动效和三维场景,
          收在一处。左边按类看,或者直接搜源码内容 —— 找「我以前那个抖动是怎么写的」比翻仓库快。
        </p>
        <div className="stat-row">
          <div className="stat">
            <div className="v">{COMPONENTS.length}</div>
            <div className="k">组</div>
          </div>
          <div className="stat">
            <div className="v">{S.files}</div>
            <div className="k">文件</div>
          </div>
          <div className="stat">
            <div className="v">{S.lines.toLocaleString()}</div>
            <div className="k">行源码</div>
          </div>
          <div className="stat">
            <div className="v">{self}</div>
            <div className="k">自研</div>
          </div>
          <div className="stat">
            <div className="v">{live}</div>
            <div className="k">可实时预览</div>
          </div>
        </div>
      </div>

      {CATEGORIES.map((cat) => {
        const items = byCategory(cat.id)
        if (!items.length) return null
        return (
          <div className="sec" key={cat.id}>
            <div className="sec-head">
              <h2>{cat.name}</h2>
              <span className="hint">{cat.hint}</span>
            </div>
            <div className="grid">
              {items.map((c) => (
                <Card key={c.slug} c={c} />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}
