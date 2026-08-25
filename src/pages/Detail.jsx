import { useCallback, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OWNERS, REPOS, bySlug, CATEGORIES } from '../data/components.js'
import { filesOf } from '../data/sources.js'
import { previewUrl } from '../data/demos.js'
import CodeView from '../components/CodeView.jsx'

// 预览框按 iframe 里的真实内容高度撑开。
//
// 写死 560px 的代价实测过:57 个演示台里 20 个会溢出,其中 9 个只差 27–310px,
// 那点差距换来的是右边一条滚动条 + 内容被切。iframe 和主站同源,所以可以直接
// 读 contentDocument 量。
//
// 量的时候不能只看 documentElement —— RippleStage 那批是内层 div 自己
// overflow:auto,文档本身永远不溢出,滚动条挂在里面。
const FIT_MIN = 360
// 1250 是量出来的:封顶 1100 时 yuqin-cards 只差 118、remotion-kit 只差 40,
// 多给这一点就能整个展开。再往上就只剩整页级的演示台了,那些封多高都滚不完,
// 且会把下面的源码顶到天边去。
const FIT_MAX = 1250

function useFitFrame(url) {
  const ref = useRef(null)

  const fit = useCallback(() => {
    const f = ref.current
    if (!f) return
    let doc
    try {
      doc = f.contentDocument
    } catch {
      return // 万一变成跨源就算了,保持初值
    }
    if (!doc?.body) return
    const win = doc.defaultView
    let h = doc.documentElement.scrollHeight
    for (const el of doc.querySelectorAll('body *')) {
      const cs = win.getComputedStyle(el)
      if (!/auto|scroll/.test(cs.overflowY)) continue
      h = Math.max(h, el.scrollHeight + el.getBoundingClientRect().top)
    }
    // 留几像素余量:边框和亚像素取整会剩个位数的差,不补的话滚动条为那 4px 又冒出来
    const next = Math.round(Math.min(Math.max(h + 6, FIT_MIN), FIT_MAX))
    // 只在差得明显时才写,免得和 iframe 自身的高度变化互相追着跑
    if (Math.abs(next - f.clientHeight) > 8) f.style.height = next + 'px'
  }, [])

  useEffect(() => {
    const f = ref.current
    if (!f || !url) return
    f.style.height = ''
    let ro
    const attach = () => {
      fit()
      try {
        const doc = f.contentDocument
        if (doc?.body && doc.defaultView?.ResizeObserver) {
          ro?.disconnect()
          ro = new doc.defaultView.ResizeObserver(fit)
          ro.observe(doc.body)
        }
      } catch {
        /* 跨源就算了 */
      }
    }
    f.addEventListener('load', attach)
    attach() // 已经在缓存里的话 load 不会再来一次
    // 三维场景 / 异步素材加载完还会再变一次,补几拍
    const timers = [300, 900, 2000, 4000].map((t) => setTimeout(fit, t))
    return () => {
      f.removeEventListener('load', attach)
      ro?.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [url, fit])

  return ref
}

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
  const frameRef = useFitFrame(url)

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
            <iframe ref={frameRef} src={url} title={c.name} loading="lazy" scrolling="no" />
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
