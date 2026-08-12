import { MuyanStage, MODELS } from '../muyan.jsx'
import StoryHero from '../../library/ui/story-hero/StoryHero.jsx'

// StoryHero 吃的是 /api/presets 那一行原始 preset(不是归一化后的 CardModel),
// 所以这里按 preset 的形状造:{ name, official, data: { ... } }。

const preset = {
  name: '猫与咖啡馆',
  official: true,
  data: {
    name: '猫与咖啡馆',
    synopsis: '你推开一扇总在下雨的门。店主记得每位客人的口味,却记不住自己的名字。',
    author: '太妃月',
    cover: '/home/tangmu01.png',
    tags: ['治愈', '日常', '轻悬疑'],
    characters: [
      { data: { name: '糖沐', description: '沐言书坊的店员。话不多,记性好。', image: '/home/seal-muyan.png', tags: ['店员'] } },
      { data: { name: '常客', description: '每周三下午来,只点热的。', image: '', tags: ['熟客'] } },
    ],
    world: { name: '常雨镇', description: '一座三百天在下雨的小镇。' },
    player: { name: '第一次来的客人', description: '你不记得自己为什么走进来,但伞是干的。' },
  },
}

export default function Demo() {
  return (
    <MuyanStage scroll top pad={18}>
      <StoryHero preset={preset} onOpenChar={() => {}} />
    </MuyanStage>
  )
}
