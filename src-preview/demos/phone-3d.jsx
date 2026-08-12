import { RippleStage } from '../ripple.jsx'
import DemoPhone3D from '../../library/3d-scene/phone-3d/phone-3d.tsx'

// 模型 public/models/iphone.glb 已搬进来。屏幕上的视频没搬(webm/mp4 体积大),
// 所以只有 underlay 静态贴图 —— 3D 手机本身、滚动旋转、材质都能看。

export default function Demo() {
  return (
    <RippleStage>
      <div className="lbl">随滚动旋转推进 · 屏幕内容贴在 mesh 上</div>
      <div style={{ height: 900 }}>
        <DemoPhone3D
          underlay="/app/longpress-cal.png"
          videoWebm=""
          videoMp4=""
          alt="3D 手机演示:长按日历"
          altFlat="长按日历的静态画面"
        />
      </div>
      <div style={{ height: 300 }} />
    </RippleStage>
  )
}
