import { Home, Search, Plus, Star, Settings } from 'lucide-react'
import '../../library/token/muyan/base.css'
import { MockPage, PageBody } from '../page.jsx'
import Dock from '../../library/nav/dock/Dock.jsx'
import '../../library/nav/dock/Dock.css'

// 2026-08-26:垫上假页面。
// 旧版是一条 1090×81 的栏钉在空框底上 —— 实测填充率 13.8%,上面五百多像素全白。
// Dock 是「浮在页面底部」的东西,底下没有页面就等于没有参照:
// 看不出它离底边多远、盖住了多少内容、放大时会不会顶到什么。
// 现在页面铺满台子,Dock 绝对定位钉在底部居中,和真用起来一样。
//
// 图标条目换成中性的:旧版是「首页 / 探索 / 创作 / 论坛 / 我的」,那是 AI 互动故事的五格导航。

const items = [
  { icon: <Home size={20} />, label: '首页' },
  { icon: <Search size={20} />, label: '搜索' },
  { icon: <Plus size={20} />, label: '新建' },
  { icon: <Star size={20} />, label: '收藏' },
  { icon: <Settings size={20} />, label: '设置' },
]

export default function Demo() {
  return (
    <div
      className="stage stage--bleed"
      data-theme="paper"
      style={{ background: 'var(--bg)', color: 'var(--fg)' }}
    >
      <MockPage>
        {/* 底部给 Dock 留出高度 + 放大时的余量,不然正文最后一行会被压在栏底下 */}
        <PageBody
          eyebrow="示例页面 · 停靠栏"
          lead="演示的是浮在页面底部那条栏。单独摆在空台子里,看不出它离底边多远、盖住了多少内容、图标放大时会不会顶到东西。"
          pad="clamp(24px, 4%, 44px) clamp(24px, 4%, 48px) 172px"
        />
        {/* 说明放在栏**上面**:放下面会被框底切掉,而且图标放大是往上长的,下面那点空间留不住 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 26,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            pointerEvents: 'none',
          }}
        >
          <div className="lbl" style={{ marginBottom: 0 }}>
            鼠标横向划过 —— 图标随距离放大
          </div>
          {/* 只让栏本身收指针,外面那层透传 —— 否则整条不可见的横带会挡住页面 */}
          <div style={{ pointerEvents: 'auto' }}>
            <Dock items={items} />
          </div>
        </div>
      </MockPage>
    </div>
  )
}
