import { useState } from 'react'
import { MuyanStage } from '../muyan.jsx'
import CharDetailModal from '../../library/ui/char-detail-modal/CharDetailModal.jsx'
// 这一行是这个演示台以前「看着不稳定」的全部原因:
// 弹层的样式(.detail-charmodal / -card / -x / -body)一条都不在组件目录下,
// 全在 StoryDetail.css 里 —— 组件文件顶部的注释写了这件事,但全库没有一处 import 它。
// 于是实测出来是 position:static、无背景、无圆角、无投影、max-height:none:
// 遮罩、卡片、弹入动画一个都没生效,只剩一摞裸文字浮在纸上,框一变高它就换个位置,
// 看起来就像「时好时坏」。引的是真文件不是抄一份,组件那边改样式这里跟着变。
// 整份 585 行的选择器全是 .detail-* / .cc-role*,这个演示台里只有弹层,不会误伤别的。
import '../../library/ui/routes/StoryDetail.css'

// 2026-08-26 重做。除了补样式,还改了两件:
//
// ① 给它一个「底下的页面」。弹层是 position:fixed 的全屏遮罩 —— 底下什么都没有的话,
//    半透明遮罩压在空白纸上,既看不出这是「盖在页面上的层」,整框也只有一小块字。
//    现在底下铺一张假的角色页,遮罩才有东西可遮。
// ② 默认开着,关掉之后给一个重新打开的入口。画廊缩略图盖了 .thumb-veil 点不进去,
//    默认关着的话那一格永远是空页;默认开着,缩略图里就是弹层本身。
//    详情页里点 × 或点遮罩关掉,能看它的弹入动画(scrim 淡入 0.18s + 卡片上浮 0.28s)。
//
// 尺寸不写死:底下的页面是 min(760px, 100%),弹层本身 CSS 里就是 min(560px, 92vw) / 80vh,
// 框宽随窗口变时两层都跟着走。

const MODEL = {
  id: 'sample-keeper',
  kind: 'character',
  title: '渡口的守夜人',
  tags: ['示例', '沉默', '夜班'],
  blurb:
    '守着一座早就没人过的渡口。\n' +
    '白天睡,天黑前把灯点上,火生得好。问他等谁,他说不等谁,只是灯灭了不合适。\n\n' +
    '话少。你说十句他回一句,但那一句多半是对的。',
}

export default function Demo() {
  const [open, setOpen] = useState(true)

  return (
    <MuyanStage>
      {/* 遮罩底下的页面 —— 只是背景板,不是这一件的组件。宽度跟着框走。 */}
      <div style={{ width: 'min(760px, 100%)', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <img
            src="/flip-book/photo-11.jpg"
            alt=""
            draggable={false}
            style={{
              width: 'clamp(72px, 12%, 104px)',
              aspectRatio: '2 / 3',
              objectFit: 'cover',
              borderRadius: 'var(--r-card)',
              border: '1px solid var(--line)',
              flex: 'none',
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>角色</div>
            <h2 style={{ margin: '6px 0 10px', font: '500 clamp(20px, 2.6vw, 28px)/1.3 var(--font-serif)' }}>
              {MODEL.title}
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 'var(--lh-read)', fontSize: 14 }}>
              守着一座早就没人过的渡口。话少,火生得好,天亮之前不睡。
            </p>
            <button type="button" onClick={() => setOpen(true)} style={btn}>
              查看详情
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--line)', margin: '22px 0' }} />
        {[
          '这一块只是垫在弹层底下的假页面,让遮罩有东西可遮。',
          '弹层本身是固定全屏覆盖 —— 放在轮播里也不会被卡片的 transform 顶歪。',
          '点 × 或点遮罩关掉,再点上面的「查看详情」能重看一遍弹入。',
        ].map((t, i) => (
          <p key={i} style={{ margin: '0 0 10px', color: 'var(--fg-faint, var(--muted))', fontSize: 13, lineHeight: 1.9 }}>
            {t}
          </p>
        ))}
      </div>

      {open && <CharDetailModal model={MODEL} onClose={() => setOpen(false)} />}
    </MuyanStage>
  )
}

const btn = {
  marginTop: 16,
  font: '13px/1 var(--font-sans, system-ui), sans-serif',
  minHeight: 38,
  padding: '10px 20px',
  borderRadius: 'var(--r-pill, 999px)',
  cursor: 'pointer',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  color: 'var(--fg)',
}
