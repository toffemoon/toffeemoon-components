import { useEffect } from 'react'
import '../../library/token/yuqin/styles.css'
import { ProjectCard } from '../../library/ui/yuqin-cards/ProjectCard.jsx'
import { SectionHeader } from '../../library/ui/yuqin-cards/SectionHeader.jsx'
import { MarqueeBand } from '../../library/ui/yuqin-cards/MarqueeBand.jsx'

// 原站的 [data-reveal] 靠 IntersectionObserver 加 is-visible 才显形,
// 演示台里没有那套滚动逻辑,所以挂载后直接点亮。
function useRevealNow() {
  useEffect(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('is-visible', 'is-revealed', 'revealed')
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
  }, [])
}

const projects = [
  {
    title: 'Ripple',
    category: 'Product · Health',
    year: '2026',
    summary: '把 Apple Watch 的连续体征变成一句人话的日常提醒,而不是又一张折线图。',
    note: 'NAISC 2026 Workato 赛道第三名',
    tags: ['Product', 'iOS', 'Agent'],
  },
  {
    title: 'CommenHers',
    category: 'Brand · Slow fashion',
    year: '2025',
    summary: '纺织升级再造品牌的落地页与视觉语言。',
    note: '学校作业,已交付',
    tags: ['Branding', 'Web'],
  },
]

export default function Demo() {
  useRevealNow()
  return (
    <div className="stage stage--top" style={{ background: 'var(--y-bg, #f6f0e9)', display: 'block' }}>
      <MarqueeBand items={['strategy', 'storytelling', 'presentation']} />
      <div style={{ padding: '22px 4px 8px' }}>
        <SectionHeader
          eyebrow="Selected work"
          title="Projects"
          description="结构化的占位卡,给出范围与意图,而不是堆满细节。"
        />
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {projects.map((p, i) => (
          <ProjectCard key={p.title} project={p} index={i} tagAriaSuffix="tags" />
        ))}
      </div>
    </div>
  )
}
