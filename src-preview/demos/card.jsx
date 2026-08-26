import { useState } from 'react'
import { MuyanStage, MODELS } from '../muyan.jsx'
import { Card } from '../../library/ui/card/Card.jsx'

// 这一件是整个库里设计最完整的:只认 CardModel,不做 kind 大开关,四种卡同一套视觉。
// 点卡片翻面 —— 翻转用「两面各自 perspective()+rotateY」,不靠父级 preserve-3d。
//
// 2026-08-26:排布从 .row 换成库自己的 .card-shelf 网格。
// .row 是 flex,卡片吃 .card--shelf 写死的 190×286,于是四张 802 宽钉在 1156 的框正中,
// 实测填充率 35.8%,两边各空一大条。
// ui.css 里本来就有一条 `.card-shelf:not(.is-scroll) > .card--shelf { width:100%;
// height:auto; aspect-ratio:190/286 }` —— 只要外面是 .card-shelf,卡片就会撑满列宽
// 并保住 2:3 书形。所以这里只做一件事:套上那个类,把列数按内容钉成 4。
// 列数写死 4 而不用 auto-fill:四张卡正好是四种 kind,拆成两行看不出「同一套视觉」;
// auto-fill 会按 minmax(190px) 造出第五条空轨道,右边又空一块。
// 宽度 min(1040px, 100%) —— 框宽变,卡跟着变;不铺到边是留一点呼吸。

export default function Demo() {
  const [flipped, setFlipped] = useState(null)
  return (
    <MuyanStage>
      <div
        className="card-shelf"
        style={{ width: 'min(1040px, 100%)', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
      >
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
