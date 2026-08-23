import { RippleStage } from '../ripple.jsx'
import DemoPhone3D from '../../library/3d-scene/phone-3d/phone-3d.tsx'

// 模型 public/models/iphone.glb 已搬进来。屏幕上的视频没搬(webm/mp4 体积大),
// 所以只有 underlay 静态贴图 —— 3D 手机本身、材质、环境反射都能看。
//
// 2026-08-23:线上站是"随滚动转正"的编排,塞进演示台格子里没有滚动行程可用,
// 看起来就是一张不动的图。改成 orbit 模式:OrbitControls 接管相机,
// 可以拖着转、滚轮推近拉远,不碰时自己慢慢转。
// 组件默认仍是 progress 那条路,orbit 是可选开关。

export default function Demo() {
  return (
    <RippleStage>
      <div className="lbl">拖动旋转 · 滚轮推近拉远 · 松手后自动慢转</div>
      <DemoPhone3D
        orbit
        underlay="/app/longpress-cal.png"
        videoWebm=""
        videoMp4=""
        alt="3D 手机:可自由旋转查看"
        altFlat="长按日历的静态画面"
      />
    </RippleStage>
  )
}
