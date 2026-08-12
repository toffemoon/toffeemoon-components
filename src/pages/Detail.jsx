import { Link, useParams } from 'react-router-dom'
import { OWNERS, REPOS, bySlug, CATEGORIES } from '../data/components.js'
import { filesOf } from '../data/sources.js'
import { previewUrl } from '../data/demos.js'
import CodeView from '../components/CodeView.jsx'

export default function Detail() {
  const { cat, slug } = useParams()
  const c = bySlug(slug)

  if (!c) return <div className="empty">没有这一组:{slug}</div>

  const files = filesOf(cat, slug)
  const o = OWNERS[c.owner]
  const repoUrl = c.repo ? REPOS[c.repo] : null
  const catName = CATEGORIES.find((x) => x.id === c.cat)?.name || c.cat
  const url = previewUrl(c)
  const isDemo = !!url && !c.preview

  return (
    <>
      <div className="crumb">
        <Link to="/">全部</Link> / {catName} / {c.slug}
      </div>

      <div className="detail-head">
        <h1>
          {c.name}
          <span className={'tag-owner o-' + o.tone}>{o.label}</span>
        </h1>
        <p className="detail-desc">{c.desc}</p>
      </div>

      <div className="meta">
        <div className="meta-cell">
          <div className="k">来自</div>
          <div className="v">{c.from}</div>
        </div>
        <div className="meta-cell">
          <div className="k">远端备份</div>
          <div className="v">
            {repoUrl ? (
              <a href={repoUrl} target="_blank" rel="noreferrer">
                {repoUrl.replace('https://github.com/', '')}
              </a>
            ) : (
              '尚未备份'
            )}
          </div>
        </div>
        <div className="meta-cell">
          <div className="k">依赖</div>
          <div className="v">{c.deps?.length ? c.deps.join(' · ') : '无'}</div>
        </div>
        <div className="meta-cell">
          <div className="k">源码</div>
          <div className="v">
            {files.length} 文件 · {files.reduce((n, f) => n + f.lines, 0)} 行
          </div>
        </div>
      </div>

      {c.notes?.length > 0 && (
        <ul className="notes">
          {c.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}

      {url && (
        <>
          <div className="block-head">
            <h2>预览</h2>
            <a className="btn" href={url} target="_blank" rel="noreferrer">
              新窗口打开
            </a>
          </div>
          <div className="frame-wrap">
            <iframe src={url} title={c.name} loading="lazy" />
          </div>
          <div className="frame-note">
            {isDemo
              ? `演示台 src-preview/demos/${c.slug}.jsx —— 直接 import library/ 里的源码,和下面这份是同一份。`
              : '打包好的自包含产物,和原项目脱钩 —— 原项目改了这里不会自动跟着变。'}
          </div>
        </>
      )}

      <div className="block-head">
        <h2>源码</h2>
        <span className="frame-note" style={{ margin: 0 }}>
          library/{cat}/{slug}/
        </span>
      </div>
      <CodeView files={files} />
    </>
  )
}
