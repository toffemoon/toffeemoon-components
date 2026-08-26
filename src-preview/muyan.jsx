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
//
// 2026-08-26:内容换成中性示例,不再用任何具体项目的设定 / 人名 / 作者名。
// kind 必须留在 story | character | world | player —— Card.jsx 拿它取书脊色
// (--spine-{kind})和 .kind-{kind} 类,换成别的值卡片会掉成默认色。
// 两张有封面 + 两张没有,是刻意的:没封面那条走的是「书脊占位 + 描边框」另一条分支,
// 都留着才看得出这组件封面缺失时不会露白底。
export const MODELS = [
  {
    id: 'sample-road',
    kind: 'story',
    title: '长路',
    cover: '/flip-book/photo-03.jpg',
    blurb: '一条穿过赤色丘陵的公路。天亮前只遇见两辆车,后来连车也没有了。',
    badge: { label: '完整故事', tone: 'pine' },
    tags: ['示例', '长文', '风景'],
    meta: { characters: 3, author: '示例作者', uploader: '示例作者', typeLabel: '示例', useCount: 1284 },
    note: '',
  },
  {
    id: 'sample-keeper',
    kind: 'character',
    title: '渡口的守夜人',
    cover: '/flip-book/photo-11.jpg',
    blurb: '守着一座早就没人过的渡口。话少,火生得好,天亮之前不睡。',
    badge: { label: '角色卡', tone: 'gilt' },
    tags: ['示例', '沉默'],
    meta: { uploader: '示例作者', useCount: 903 },
    note: '',
  },
  {
    id: 'sample-north',
    kind: 'world',
    title: '北纬四十度',
    cover: '',
    blurb: '一条横穿大陆的纬线。同一天里,线上有人在收麦,有人在扫雪。',
    badge: { label: '世界书', tone: 'gilt' },
    tags: ['示例', '设定'],
    meta: { uploader: '示例作者' },
    note: '',
  },
  {
    id: 'sample-traveler',
    kind: 'player',
    title: '同行的人',
    cover: '',
    blurb: '你在半路上车,没说要去哪儿,司机也没问。',
    badge: { label: '演出卡', tone: 'gilt' },
    tags: ['示例', '第一人称'],
    // 四张都给 uploader:卡的底栏「书名 + 作者」两行、只有书名时一行,
    // 而 .card--shelf 是固定 2:3 —— 少一行,封面就比旁边高一截,四张排在一起看着像没对齐。
    meta: { uploader: '示例作者' },
    note: '',
  },
]
