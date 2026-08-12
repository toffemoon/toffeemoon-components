import { RippleStage } from '../ripple.jsx'
import RippleLogoMark from '../../library/ui/ripple-logo-mark/ripple-logo-mark.tsx'
import RippleMark from '../../library/ui/ripple-logo-mark/ripple-mark.tsx'

export default function Demo() {
  return (
    <RippleStage scroll={false}>
      <div className="row" style={{ gap: 48, height: '100%' }}>
        <div className="unit">
          <div className="lbl">描边生长 + 填充</div>
          <RippleLogoMark className="h-40 w-40" animated />
        </div>
        <div className="unit">
          <div className="lbl">静态成品(导航 / 页脚)</div>
          <RippleLogoMark className="h-24 w-24" animated={false} />
        </div>
        <div className="unit">
          <div className="lbl">纯 mark</div>
          <RippleMark className="h-12 w-12" />
        </div>
      </div>
    </RippleStage>
  )
}
