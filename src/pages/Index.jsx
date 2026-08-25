import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, COMPONENTS, OWNERS, byCategory } from '../data/components.js'
import { stats, grep } from '../data/sources.js'
import { previewUrl, liveCount } from '../data/demos.js'
import Thumb from '../components/Thumb.jsx'
import ChromaWall from '../components/ChromaWall.jsx'

const S = stats()

// 归属 + 上游来源。站点公开之后这两条要一起出现 ——
// 改造件标出起点,不是心虚,是说清楚哪部分是自己做的。
function Provenance({ c }) {
  const o = OWNERS[c.owner]
  return (
    <span className="prov">
      <span className={'tag-owner o-' + o.tone}>{o.label}</span>
      {c.source && <span className="tag-src">源自 {c.source}</span>}
    </span>
  )
}

function GalleryCard({ c }) {
  return (
    <Link
      className={'gcard t-' + OWNERS[c.owner].tone}
      to={`/c/${c.cat}/${c.slug}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', e.clientX - r.left + 'px')
        e.currentTarget.style.setProperty('--my', e.clientY - r.top + 'px')
      }}
    >
      <Thumb c={c} />
      <div className="gcard-body">
        <div className="gcard-top">
          <span className="gcard-name">{c.name}</span>
          <Provenance c={c} />
        </div>
        <div className="gcard-desc">{c.desc}</div>
        <div className="gcard-foot">
          <span>{c.from}</span>
          {previewUrl(c) && <span className="badge-live">活的</span>}
        </div>
      </div>
    </Link>
  )
}

function ListCard({ c }) {
  return (
    <Link className="card" to={`/c/${c.cat}/${c.slug}`}>
      <div className="card-top">
        <span className="card-name">{c.name}</span>
        <Provenance c={c} />
      </div>
      <div className="card-desc">{c.desc}</div>
      <div className="card-foot">
        <span>{c.from}</span>
        {previewUrl(c) && <span className="badge-live">活的</span>}
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
              <ListCard key={c.slug} c={c} />
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
  const [view, setView] = useState('gallery')

  if (query.trim().length >= 2) return <SearchResults query={query} />

  // 自研和改造都算自己的 —— 灵感来自别处、代码是自己改出来的,那就是自己的。
  // 移植那五件不算,它们只是换了个地方放。
  const mine = COMPONENTS.filter((c) => c.owner === 'self' || c.owner === 'adapted').length
  const live = liveCount(COMPONENTS)

  return (
    <>
      <div className="page-head">
        <h1>Toffeemoon Components</h1>
        <p>
          散在翻板墙、沐言书坊、Ripple、AI 互动故事、Yuqin portfolio、YoRHa-A2
          这些项目里的组件、动效和三维场景,收在一处。有演示台的直接在格子里跑,
          没有的切一段源码,一屏扫下来就知道自己有什么。
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
            <div className="v">{mine}</div>
            <div className="k">我的</div>
          </div>
          <div className="stat">
            <div className="v">
              {live}
              <span className="stat-total">/{COMPONENTS.length}</span>
            </div>
            <div className="k">能跑起来看</div>
          </div>
          <div className="stat" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            <div className="seg">
              <button className={view === 'gallery' ? 'on' : ''} onClick={() => setView('gallery')}>
                画廊
              </button>
              <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
                清单
              </button>
            </div>
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
              <span className="hint" style={{ marginLeft: 'auto' }}>
                {liveCount(items)}/{items.length} 能跑
              </span>
            </div>
            {view === 'gallery' ? (
              <ChromaWall>
                <div className="gallery">
                  {items.map((c) => (
                    <GalleryCard key={c.slug} c={c} />
                  ))}
                </div>
              </ChromaWall>
            ) : (
              <div className="grid">
                {items.map((c) => (
                  <ListCard key={c.slug} c={c} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
