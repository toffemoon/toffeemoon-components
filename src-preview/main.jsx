import React from 'react'
import { createRoot } from 'react-dom/client'
import './demo.css'
import { DEMOS } from './demos/index.jsx'

// 路由极简:preview.html#/<slug>。只在 iframe 里跑,不需要 router。
function resolve() {
  return decodeURIComponent(location.hash.replace(/^#\/?/, '')).trim()
}

function Missing({ slug }) {
  return (
    <div className="stage">
      <div className="miss">
        <div style={{ marginBottom: 8 }}>还没搭演示台</div>
        <code>{slug || '(没给 slug)'}</code>
        <div style={{ marginTop: 10, fontSize: 12 }}>
          在 <code>src-preview/demos/</code> 加一个同名 .jsx 就会自动出现在这里。
        </div>
      </div>
    </div>
  )
}

class Boundary extends React.Component {
  constructor(p) {
    super(p)
    this.state = { err: null }
  }
  static getDerivedStateFromError(err) {
    return { err }
  }
  render() {
    if (this.state.err) {
      return (
        <div className="stage">
          <div className="miss">
            <div style={{ marginBottom: 8, color: '#c98080' }}>这个演示台崩了</div>
            <code style={{ fontSize: 11 }}>{String(this.state.err.message || this.state.err)}</code>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const [slug] = React.useState(resolve)

  // 换 demo 一律重载文档,不在原地换(2026-08-26)。
  //
  // 原来是听 hashchange 把组件换掉、文档不动。问题是 **CSS 只进不出**:
  // 每个 demo 自己 import 的样式表在 Vite 里是一枚 <style>,demo 卸载了它也不会走。
  // 详情页只有一个 iframe,点着逛下去就越积越多,而这些样式表里有大量
  // 元素级 / 全局选择器(muyan 的 type.css 定 h1/p 字号、ripple 的 Tailwind preflight……),
  // 它们会落到后面每一个演示台身上。
  // 实测 yuqin 这一件:单独打开时内容 560 高、2 张样式表;
  // 逛过 20 个之后 17 张样式表、内容 1999;逛过 47 个之后 27 张、内容 3455 —— 涨了六倍。
  // 顺带把「上一个演示台的框高赖着不走」也一起解决了:文档重载,load 事件会重新触发一次量高。
  //
  // 代价是换组件多一次文档加载(本地几十毫秒)。画廊那边每张缩略图本来就是独立 iframe,
  // 不受影响。
  React.useEffect(() => {
    const on = () => window.location.reload()
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  // 报一声「挂的是这个 demo」,给外面的详情页看(src/pages/Detail.jsx 的 fit())。
  // 上面改成重载之后,这一条主要是给「文档已经在缓存里、load 不会再来一次」那条路兜底:
  // 详情页那边只有确认这个值和它要的 slug 对上了才会去量高。
  React.useEffect(() => {
    document.documentElement.dataset.demo = slug
  }, [slug])

  const Demo = DEMOS[slug]
  if (!Demo) return <Missing slug={slug} />
  return (
    <Boundary key={slug}>
      <React.Suspense fallback={<div className="stage" />}>
        <Demo />
      </React.Suspense>
    </Boundary>
  )
}

createRoot(document.getElementById('stage')).render(<App />)
