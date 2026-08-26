// 导航类演示台共用的「假页面」。
//
// 导航是页面顶上 / 底下 / 边上的一条。单独把那一条拎出来摆在空台子正中,
// 既看不出它在页面里占多宽,也看不出它和内容是什么关系 —— 一整框全是白。
// 实测过:pill-nav 那样摆,填充率 1.8%;dock 13.8%。
// 所以这里给一张能铺满台子的页面,导航摆回它该在的位置上。
//
// 两条纪律:
// ① 不吃任何一套 token。这批演示台跨两个体系(沐言的 [data-theme]、Ripple 的 Tailwind),
//    所以颜色全部从 currentColor 推(color-mix + 透明度),铺在哪种底上都不会掉色。
// ② 不抢导航的戏。正文灰度压得比导航低,照片只占小块 —— 主角是上面那条导航。
//
// 内容是中性占位,不带任何具体项目的设定。

const dim = (pct) => `color-mix(in srgb, currentColor ${pct}%, transparent)`

/** 挂在演示台外层的 onClickCapture:拦掉 `<a href="#...">` 的默认跳转。
 *
 *  导航类组件的条目大多是 `href={"#" + item.href}` 的真锚点(PillNav / StaggeredMenu /
 *  FlowingMenu 都是)。预览页自己也用 hash 认 slug(preview.html#/<slug>),
 *  所以在演示台里点一下「作品」,地址就变成 preview.html#/work ——
 *  整个预览被打到「还没搭演示台」。
 *  只挡默认跳转,不挡事件:组件自己的 onClick 照常收得到,交互该有的反馈都在。 */
export function stopHashNav(e) {
  const a = e.target?.closest?.('a[href^="#"]')
  if (a) e.preventDefault()
}

const SHOTS = [
  { src: '/flip-book/photo-03.jpg', title: '丘陵段', note: '第 1 天 · 一整天没遇到岔路' },
  { src: '/flip-book/photo-11.jpg', title: '垭口', note: '第 3 天 · 天黑前赶到' },
  { src: '/flip-book/photo-09.jpg', title: '海岸线', note: '第 6 天 · 退潮之后' },
]

/** 假页面的正文。放在导航底下 / 上面,让导航有页面可依附。 */
export function PageBody({
  eyebrow = '示例页面',
  title = '一条穿过丘陵的公路',
  lead = '下面这些是垫在导航底下的假页面。演示的是上面那条导航 —— 单独摆在空台子里,看不出它在页面里占多宽、和内容离多远。',
  shots = SHOTS,
  pad = 'clamp(24px, 4%, 48px)',
}) {
  return (
    <div style={{ padding: pad, maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ font: '11px/1 ui-monospace, Consolas, monospace', letterSpacing: '0.16em', color: dim(45) }}>
        {eyebrow}
      </div>
      {/* 不要写成 font 简写:`font: 500 clamp(...)/1.25 inherit` 里 inherit 不是合法字族,
          整条声明会被丢掉 —— Ripple 那边的 Tailwind preflight 把 h1 重置成 font-size:inherit,
          于是标题缩成正文大小。拆成单条属性才两边都成立。 */}
      <h1
        style={{
          margin: '14px 0 10px',
          fontSize: 'clamp(24px, 3.2vw, 38px)',
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: '0.01em',
        }}
      >
        {title}
      </h1>
      <p style={{ margin: 0, maxWidth: '46ch', fontSize: 14, lineHeight: 1.85, color: dim(58) }}>{lead}</p>

      <div
        style={{
          marginTop: 'clamp(20px, 3.5%, 34px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 'clamp(12px, 1.6%, 20px)',
        }}
      >
        {shots.map((s) => (
          <div key={s.src} style={{ border: `1px solid ${dim(14)}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ aspectRatio: '4 / 3', background: dim(6) }}>
              <img
                src={s.src}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{ padding: '11px 13px 13px' }}>
              <div style={{ fontSize: 13.5 }}>{s.title}</div>
              <div style={{ fontSize: 11.5, marginTop: 4, color: dim(45) }}>{s.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 铺满台子的页面容器。
 *  position:relative —— 让 dock 这种「浮在页面底部」的件有地方钉。
 *  overflow:auto 不是为了让人滚,是为了让 Detail.jsx 量得到真实内容高度:
 *  它会遍历 `body *` 里 overflowY 是 auto/scroll 的元素,拿 scrollHeight 撑框
 *  (见 src/pages/Detail.jsx 的 fit())。写 hidden 的话框永远停在初值 560,
 *  页面比 560 高的那部分会被无声切掉一条 —— 照片卡正好卡在那儿断掉。
 *  演示台的滚动条本来就被 demo.css 藏了,所以这里不会多出一条竖杠。 */
export function MockPage({ children, style, ...rest }) {
  return (
    <div {...rest} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'auto', ...style }}>
      {children}
    </div>
  )
}
