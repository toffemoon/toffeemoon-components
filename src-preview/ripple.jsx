// ripple-site 那批组件的共用外壳。
//
// 它们全部吃 Tailwind 4 + ripple 自己的 @theme token,而且大多假设自己活在
// 深色长页面里(滚动触发的入场动画、sticky 导航)。所以统一套一层:
// 上 token、铺深色底、给一个能滚的容器。
import '../library/token/ripple/index.css'

export function RippleStage({ children, pad = true, scroll = true, height }) {
  return (
    <div
      className="font-sans"
      style={{
        background: 'var(--color-bg, #0a0c0f)',
        color: 'var(--color-ink, #f2f5f6)',
        height: height || '100%',
        overflowY: scroll ? 'auto' : 'hidden',
        padding: pad ? '28px 24px' : 0,
      }}
    >
      {children}
    </div>
  )
}

// 有些 block 是整段落地页,按真实宽度排版才对得上;窄容器里看不出所以然。
export function RippleFull({ children }) {
  return (
    <div
      className="font-sans"
      style={{
        background: 'var(--color-bg, #0a0c0f)',
        color: 'var(--color-ink, #f2f5f6)',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  )
}
