import { useState } from 'react'
import { MuyanStage, MODELS } from '../muyan.jsx'
import CardCarousel from '../../library/ui/card-carousel-dom/CardCarousel.jsx'
import { Card } from '../../library/ui/card/Card.jsx'

// 不用 WebGL 的横排轮播:RAF 平滑惯性(lerp 逼近 target),卡片随滚速起微浪,静止则平。
// 自己写的复刻 —— 目标是 React Bits CircularGallery(bend=0)的观感,但用 DOM 实现,
// 好保留项目自己的 <Card>。拖一下试试。

const items = [...MODELS, ...MODELS].map((m, i) => ({ ...m, id: m.id + '-' + i }))

export default function Demo() {
  const [active, setActive] = useState(0)
  return (
    <MuyanStage>
      <CardCarousel
        items={items}
        activeIndex={active}
        onActiveChange={setActive}
        renderItem={(m) => <Card model={m} eager />}
      />
    </MuyanStage>
  )
}
