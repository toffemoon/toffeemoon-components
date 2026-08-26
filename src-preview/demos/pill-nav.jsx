import '../../library/token/muyan/base.css'
import { MockPage, PageBody, stopHashNav } from '../page.jsx'
import PillNav from '../../library/nav/pill-nav/PillNav.jsx'
import '../../library/nav/pill-nav/PillNav.css'

// 2026-08-26:垫上假页面。
// 旧版是一颗 269×44 的药丸钉在 1156×560 的空框顶上 —— 实测填充率 1.8%,
// 九成九是白纸。导航是页面顶上的一条,离开页面就看不出它多宽、和内容离多远。
// 现在页面铺满台子,药丸回到它该在的位置(顶部居中),下面是正文。
//
// 条目换成中性的:旧版是「探索 / 故事 / 创作 / 我的」,那是 AI 互动故事的导航分档。

const items = [
  { label: '首页', href: '/' },
  { label: '作品', href: '/work' },
  { label: '记录', href: '/log' },
  { label: '关于', href: '/about' },
]

export default function Demo() {
  return (
    <div
      className="stage stage--bleed"
      data-theme="paper"
      style={{ background: 'var(--bg)', color: 'var(--fg)' }}
    >
      <MockPage onClickCapture={stopHashNav}>
        <div style={{ paddingTop: 'clamp(20px, 4%, 34px)', display: 'flex', justifyContent: 'center' }}>
          <PillNav items={items} activeHref="/work" />
        </div>
        <PageBody eyebrow="示例页面 · 药丸导航" />
      </MockPage>
    </div>
  )
}
