import { useState } from 'react'
// base.css 自己 @import 了 tokens.css 和 type.css,引这一个就够
import '../../library/token/muyan/base.css'
import '../../library/ui/primitives/ui.css'
import { Button } from '../../library/ui/primitives/Button.jsx'
import { Badge } from '../../library/ui/primitives/Badge.jsx'
import { Tag } from '../../library/ui/primitives/Tag.jsx'
import { Chip } from '../../library/ui/primitives/Chip.jsx'
import { Input, SearchField } from '../../library/ui/primitives/Input.jsx'
import { ChatBubble } from '../../library/ui/primitives/ChatBubble.jsx'

// 沐言的语义 token 挂在 [data-theme] 上,不是 :root。属性选择器落在任意元素都生效,
// 所以两套主题可以在同一页并排 —— 正好说明"换主题 = 换 data-theme"这件事。

function Set({ theme }) {
  const [on, setOn] = useState('完结')
  const [q, setQ] = useState('')

  return (
    <div
      data-theme={theme}
      style={{
        background: 'var(--bg)',
        color: 'var(--fg)',
        padding: '20px 18px 24px',
        borderRadius: 12,
        flex: 1,
        minWidth: 300,
        border: '1px solid var(--line)',
      }}
    >
      <div className="lbl" style={{ marginBottom: 14 }}>
        data-theme=&quot;{theme}&quot;
      </div>

      <div className="col" style={{ gap: 18, alignItems: 'stretch' }}>
        <div className="row" style={{ justifyContent: 'flex-start' }}>
          <Button variant="primary">开始阅读</Button>
          <Button variant="secondary">收藏</Button>
          <Button variant="ghost">稍后</Button>
          <Button variant="line" size="sm">
            更多
          </Button>
        </div>

        <div className="row" style={{ justifyContent: 'flex-start' }}>
          <Badge tone="pine">完整故事</Badge>
          <Badge tone="gilt">角色卡</Badge>
          <Badge tone="cinnabar">连载中</Badge>
          <Tag tone="scene">咖啡馆</Tag>
          <Tag tone="relation">熟客</Tag>
          <Tag>治愈</Tag>
        </div>

        <div className="row" style={{ justifyContent: 'flex-start' }}>
          {['全部', '完结', '连载', '短篇'].map((t) => (
            <Chip key={t} active={on === t} onClick={() => setOn(t)}>
              {t}
            </Chip>
          ))}
        </div>

        <Input placeholder="给这张卡起个名字" />
        <SearchField
          value={q}
          placeholder="搜故事"
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ('')}
        />

        <div className="col" style={{ gap: 6, alignItems: 'stretch' }}>
          <ChatBubble side="received">今天想喝点什么。</ChatBubble>
          <ChatBubble side="sent">老样子。</ChatBubble>
          <ChatBubble side="received">那我多放一颗糖。</ChatBubble>
        </div>
      </div>
    </div>
  )
}

export default function Demo() {
  return (
    <div className="stage stage--top" style={{ background: '#0d0c0b' }}>
      <div className="row" style={{ alignItems: 'stretch', gap: 16, width: '100%' }}>
        <Set theme="paper" />
        <Set theme="stage" />
      </div>
    </div>
  )
}
