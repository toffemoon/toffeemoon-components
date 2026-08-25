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

      {/* 三个区块,和上面的描述共用一个宽度 —— 原来那一排横铺到 1600px,
          旁边的正文却锁在 34em,两个宽度并排看着就是散的。 */}
      <div className="blocks">
        <section className="blk">
          <h2 className="blk-k">灵感来源</h2>
          <div className="blk-v">
            <span className={'tag-owner o-' + o.tone}>{o.label}</span>
            {c.source ? (
              <span>源自 {c.source},代码是自己改出来的</span>
            ) : c.owner === 'self' ? (
              <span>没有上游,从零写的</span>
            ) : (
              <span>出处没标注,还没核实</span>
            )}
          </div>
        </section>

        <section className="blk">
          <h2 className="blk-k">源码和依赖</h2>
          <dl className="blk-rows">
            <dt>源码</dt>
            <dd>
              {files.length} 文件 · {files.reduce((n, f) => n + f.lines, 0)} 行
            </dd>
            <dt>依赖</dt>
            <dd>{c.deps?.length ? c.deps.join(' · ') : '无'}</dd>
            <dt>远端备份</dt>
            <dd>
              {repoUrl ? (
                <a href={repoUrl} target="_blank" rel="noreferrer">
                  {repoUrl.replace('https://github.com/', '')}
                </a>
              ) : (
                '尚未备份'
              )}
            </dd>
          </dl>
        </section>

        {c.notes?.length > 0 && (
          <section className="blk">
            <h2 className="blk-k">解释</h2>
            <ul className="notes">
              {c.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

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
