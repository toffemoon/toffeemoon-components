import { useState } from 'react'
import { MuyanStage, MODELS } from '../muyan.jsx'
import { Card } from '../../library/ui/card/Card.jsx'

// 这一件是整个库里设计最完整的:只认 CardModel,不做 kind 大开关,四种卡同一套视觉。
// 点卡片翻面 —— 翻转用「两面各自 perspective()+rotateY」,不靠父级 preserve-3d。

export default function Demo() {
  const [flipped, setFlipped] = useState(null)
  return (
    <MuyanStage>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        {MODELS.map((m) => (
          <Card
            key={m.id}
            model={m}
            flipped={flipped === m.id}
            onToggleFlip={() => setFlipped(flipped === m.id ? null : m.id)}
            eager
          />
        ))}
      </div>
    </MuyanStage>
  )
}
