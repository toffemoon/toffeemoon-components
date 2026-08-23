import { SignalOrb } from '../../library/3d-scene/signal-orb/SignalOrb.jsx'

// 组件把 renderer 挂在 .signal-canvas-host 上,尺寸由 CSS 给(absolute + inset:0),
// 所以外面这层必须是 position:relative 且有高度,否则 clientHeight=0 → 全黑。
// 鼠标移进画面能带动球体转向。

export default function Demo() {
  return (
    <div
      className="stage stage--bleed"
      style={{
        position: 'relative',
        background: 'radial-gradient(120% 90% at 50% 45%, #12161f 0%, #08080b 70%)',
      }}
    >
      <SignalOrb />
      <div
        style={{
          position: 'absolute', left: 14, bottom: 12, zIndex: 5, pointerEvents: 'none',
          font: '11px ui-monospace, Consolas, monospace', color: 'rgba(221,231,242,0.42)',
        }}
      >
        月面贴图球 + 三道环 + 18 个节点 · 移动鼠标可带动转向
      </div>
    </div>
  )
}
