import { useState } from 'react'

function CopyButton({ text, label = '复制' }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className={'btn' + (done ? ' done' : '')}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          // clipboard 在非 https / 非 localhost 会被拒,退回选中让用户自己 Ctrl+C
          const ta = document.createElement('textarea')
          ta.value = text
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          ta.remove()
        }
        setDone(true)
        setTimeout(() => setDone(false), 1400)
      }}
    >
      {done ? '已复制' : label}
    </button>
  )
}

export default function CodeView({ files }) {
  const [i, setI] = useState(0)

  if (!files.length) {
    return <div className="empty">library/ 里没找到这一组的源码 —— 文件还没复制进来。</div>
  }

  const f = files[Math.min(i, files.length - 1)]
  const all = files.map((x) => `/* ── ${x.path} ── */\n${x.code}`).join('\n\n')

  return (
    <>
      <div className="tabs">
        {files.map((x, n) => (
          <button key={x.path} className={'tab' + (n === i ? ' on' : '')} onClick={() => setI(n)}>
            {x.path}
            <span className="n">{x.lines}</span>
          </button>
        ))}
      </div>

      <div className="code-box">
        <div className="code-bar">
          <span>
            {f.lang} · {f.lines} 行 · {(f.bytes / 1024).toFixed(1)} KB
          </span>
          <span style={{ display: 'flex', gap: 6 }}>
            {files.length > 1 && <CopyButton text={all} label="复制全组" />}
            <CopyButton text={f.code} label="复制本文件" />
          </span>
        </div>
        <pre className="code">{f.code}</pre>
      </div>
    </>
  )
}
