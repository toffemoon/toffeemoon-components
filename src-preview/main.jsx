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
  const [slug, setSlug] = React.useState(resolve)
  React.useEffect(() => {
    const on = () => setSlug(resolve())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

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
