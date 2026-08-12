import { useEffect, useRef, useState } from 'react'

// token 不是组件,没法「渲染」—— 但可以把它读出来铺成色板和字阶。
//
// 做法:挂载后在真实 DOM 上读 getComputedStyle,把 --* 变量全捞出来,按值的形状分组:
// 能被浏览器解析成颜色的 → 色卡;带 px/rem 的 → 尺度条;其余 → 文本。
// 这样换任何一套 token 都不用改这个文件。

const isColor = (v) => {
  const s = v.trim()
  return /^(#|rgb|hsl|oklch|color\()/i.test(s)
}
const isLen = (v) => /^-?[\d.]+(px|rem|em)$/.test(v.trim())

function readVars(el) {
  const out = []
  const seen = new Set()
  for (const sheet of Array.from(document.styleSheets)) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      continue // 跨域样式表读不了,跳过
    }
    for (const rule of Array.from(rules || [])) {
      const style = rule.style
      if (!style) continue
      for (const prop of Array.from(style)) {
        if (!prop.startsWith('--') || seen.has(prop)) continue
        seen.add(prop)
        const resolved = getComputedStyle(el).getPropertyValue(prop).trim()
        if (resolved) out.push({ name: prop, value: resolved, raw: style.getPropertyValue(prop).trim() })
      }
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export default function TokenSheet({ title, note, themes = [], bg = '#0d0c0b', fg = '#ece6dd' }) {
  const probe = useRef(null)
  const [theme, setTheme] = useState(themes[0] || null)
  const [vars, setVars] = useState([])

  useEffect(() => {
    if (probe.current) setVars(readVars(probe.current))
  }, [theme])

  const colors = vars.filter((v) => isColor(v.value))
  const lens = vars.filter((v) => isLen(v.value))
  const rest = vars.filter((v) => !isColor(v.value) && !isLen(v.value))

  return (
    <div
      ref={probe}
      data-theme={theme || undefined}
      style={{
        height: '100%',
        overflowY: 'auto',
        background: bg,
        color: fg,
        padding: '22px 24px 40px',
        fontFamily: '-apple-system, "Segoe UI", "PingFang SC", system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ fontSize: 17 }}>{title}</div>
        <div style={{ fontSize: 11.5, opacity: 0.45, fontFamily: 'ui-monospace, Consolas, monospace' }}>
          {vars.length} 个变量
        </div>
        {themes.length > 1 && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  font: '11px ui-monospace, Consolas, monospace',
                  padding: '3px 10px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: theme === t ? 'rgba(201,151,92,0.2)' : 'transparent',
                  color: 'inherit',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
      {note && <div style={{ fontSize: 12.5, opacity: 0.5, marginBottom: 20, maxWidth: '70ch' }}>{note}</div>}

      {colors.length > 0 && (
        <Section label={`色彩 · ${colors.length}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(168px,1fr))', gap: 8 }}>
            {colors.map((v) => (
              <div key={v.name} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, overflow: 'hidden' }}>
                <div style={{ height: 42, background: v.value }} />
                <div style={{ padding: '5px 7px', fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 10 }}>
                  <div style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
                  <div style={{ opacity: 0.4 }}>{v.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {lens.length > 0 && (
        <Section label={`尺度 · ${lens.length}`}>
          <div style={{ display: 'grid', gap: 5 }}>
            {lens.map((v) => (
              <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 10.5 }}>
                <span style={{ width: 168, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                <span style={{ width: 56, opacity: 0.42 }}>{v.value}</span>
                <span style={{ height: 7, width: v.value, maxWidth: '46%', background: 'rgba(201,151,92,0.55)', borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {rest.length > 0 && (
        <Section label={`其余 · ${rest.length}`}>
          <div style={{ display: 'grid', gap: 3, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 10.5 }}>
            {rest.map((v) => (
              <div key={v.name} style={{ display: 'flex', gap: 10 }}>
                <span style={{ width: 190, opacity: 0.8, flex: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                <span style={{ opacity: 0.42, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          opacity: 0.42,
          marginBottom: 9,
          paddingBottom: 6,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          fontFamily: 'ui-monospace, Consolas, monospace',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}
