import { RippleStage } from '../ripple.jsx'
import PhoneJourney from '../../library/ui/phone-journey/phone-journey.tsx'

// 素材:静态帧(longpress-*.png / investigation-*.png)已搬进 public/app/。
// 原站还有几段 webm,体积大且这个演示台不靠它讲清楚,没搬。

export default function Demo() {
  return (
    <RippleStage>
      <div className="lbl">长按日历 → 展开当日 → 追问 → 结论</div>
      <PhoneJourney alt="手机内的操作动线演示" />
    </RippleStage>
  )
}
