import { useEffect, useRef, useState } from 'react'
import { previewUrl } from '../data/demos.js'
import { filesOf } from '../data/sources.js'

// 画廊里一张卡的画面。
//
// 有预览的组件用真 iframe 跑起来 —— 但 63 个 iframe 同时活着会把浏览器压垮,
// 所以只在进入视口时挂载,离开就卸掉。同屏活着的通常不超过 8 个。
//
// 没预览的不留白:切一段源码当画面。这样"一眼看到都有什么"这件事对全部组件成立,
// 而不是只对那几个能跑的成立。

function CodeThumb({ cat, slug }) {
  const files = filesOf(cat, slug)
  const main = files[0]
  if (!main) return <div className="thumb-empty">没有源码</div>

  const lines = main.code
    .split('\n')
    .filter((l) => l.trim() && !/^\s*(\/\/|\/\*|\*)/.test(l))
    .slice(0, 14)

  return (
    <div className="thumb-code" aria-hidden="true">
      <pre>{lines.join('\n')}</pre>
      <div className="thumb-code-fade" />
      <div className="thumb-code-tag">{main.path}</div>
    </div>
  )
}

export default function Thumb({ c }) {
  const url = previewUrl(c)
  const box = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    if (!url || !box.current) return
    // 没有 IntersectionObserver 的环境直接挂上,宁可重也别白屏
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: '260px 0px',
    })
    io.observe(box.current)
    return () => io.disconnect()
  }, [url])

  if (!url) {
    return (
      <div className="thumb">
        <CodeThumb cat={c.cat} slug={c.slug} />
      </div>
    )
  }

  return (
    <div className="thumb thumb--live" ref={box}>
      {near ? (
        <iframe src={url} title={c.name} scrolling="no" tabIndex={-1} />
      ) : (
        <div className="thumb-hold" />
      )}
      <div className="thumb-veil" />
    </div>
  )
}
