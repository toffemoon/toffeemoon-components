// 沐言(AI 互动故事)那批组件的共用外壳与假数据。
//
// 语义 token 挂在 [data-theme] 上,不是 :root —— 所以外壳必须带 data-theme,
// 否则组件全是无色的。默认 paper(站上的主态),需要暗态传 theme="stage"。
import '../library/token/muyan/base.css'
import '../library/ui/primitives/ui.css'

export function MuyanStage({ children, theme = 'paper', scroll = false, top = false, pad = 24 }) {
  return (
    <div
      data-theme={theme}
      className={'stage' + (top ? ' stage--top' : '')}
      style={{
        background: 'var(--bg)',
        color: 'var(--fg)',
        padding: pad,
        overflowY: scroll ? 'auto' : 'hidden',
        display: top ? 'block' : undefined,
      }}
    >
      {children}
    </div>
  )
}

// CardModel 的形状见 library/ui/card/cardModel.js 顶部注释:
// { id, kind, title, cover, blurb, badge:{label,tone}, tags:[], meta:{}, note }
export const MODELS = [
  {
    id: 'cat-cafe',
    kind: 'story',
    title: '猫与咖啡馆',
    cover: '/home/tangmu01.png',
    blurb: '你推开一扇总在下雨的门。店主记得每位客人的口味,却记不住自己的名字。',
    badge: { label: '完整故事 · 可直接玩', tone: 'pine' },
    tags: ['治愈', '日常', '轻悬疑'],
    meta: { characters: 3, author: '太妃月', uploader: '太妃月', typeLabel: '官方', useCount: 1284 },
    note: '',
  },
  {
    id: 'tangmu',
    kind: 'character',
    title: '糖沐',
    cover: '/home/seal-muyan.png',
    blurb: '沐言书坊的店员。话不多,记性好,给熟客多放一颗糖。',
    badge: { label: '角色卡', tone: 'gilt' },
    tags: ['店员', '温和'],
    meta: { uploader: '太妃月', useCount: 903 },
    note: '',
  },
  {
    id: 'rainy-town',
    kind: 'world',
    title: '常雨镇',
    cover: '',
    blurb: '一座三百天在下雨的小镇。雨停的那天,所有人都会想起点什么。',
    badge: { label: '世界书', tone: 'gilt' },
    tags: ['setting', '群像'],
    meta: { uploader: '太妃月' },
    note: '',
  },
  {
    id: 'you',
    kind: 'player',
    title: '第一次来的客人',
    cover: '',
    blurb: '你不记得自己为什么走进来,但伞是干的。',
    badge: { label: '演出卡', tone: 'gilt' },
    tags: ['第一人称'],
    meta: {},
    note: '',
  },
]
