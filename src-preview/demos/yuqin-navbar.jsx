import { useEffect, useState } from 'react'
import '../../library/token/yuqin/styles.css'
import { NavBar } from '../../library/nav/yuqin-navbar/NavBar.jsx'
import { Footer } from '../../library/nav/yuqin-navbar/Footer.jsx'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'writing', label: 'Writing' },
  { id: 'contact', label: 'Contact' },
]

export default function Demo() {
  const [active, setActive] = useState('work')
  const [lang, setLang] = useState('EN')
  const [p, setP] = useState(0.34)

  // 原站的 [data-reveal] 靠 IntersectionObserver 点亮,演示台里直接点开
  useEffect(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('is-visible')
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
  }, [])

  return (
    <div
      className="stage stage--bleed"
      style={{ background: 'var(--y-bg, #f6f0e9)', color: 'var(--y-fg, #241c18)', overflowY: 'auto' }}
    >
      <NavBar
        brand="Yuqin Chen"
        subtitle="Communication management"
        sections={sections}
        activeSection={active}
        ariaLabel="Primary"
        languageLabel={lang}
        scrollProgress={p}
        onToggleLanguage={() => setLang((l) => (l === 'EN' ? '中文' : 'EN'))}
      />
      <div style={{ padding: '26px 22px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setActive(s.id)
              setP(Math.random())
            }}
            style={{
              font: '11px ui-monospace, Consolas, monospace',
              padding: '4px 10px',
              borderRadius: 5,
              cursor: 'pointer',
              border: '1px solid rgba(36,28,24,0.2)',
              background: active === s.id ? '#241c18' : 'transparent',
              color: active === s.id ? '#f6f0e9' : '#241c18',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <Footer
        name="Yufei (Yuqin) Chen"
        note="Singapore Management University · Communication management"
        links={[
          { label: 'Email', href: 'mailto:tommychen030607@gmail.com' },
          { label: 'GitHub', href: 'https://github.com/toffemoon' },
          { label: 'Resume', href: '/Yuqin-Chen-Resume.pdf' },
        ]}
      />
    </div>
  )
}
