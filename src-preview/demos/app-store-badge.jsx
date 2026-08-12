import { RippleStage } from '../ripple.jsx'
import AppStoreBadge from '../../library/ui/app-store-badge/app-store-badge.tsx'

export default function Demo() {
  return (
    <RippleStage scroll={false}>
      <div className="col" style={{ gap: 22, height: '100%', justifyContent: 'center' }}>
        <div className="unit">
          <div className="lbl">Apple 官方 artwork</div>
          <AppStoreBadge />
        </div>
        <div style={{ maxWidth: '46ch', fontSize: 12, lineHeight: 1.8, opacity: 0.5, textAlign: 'center' }}>
          经验:自绘 teal 版被四个评审 agent 一致点名是全站最大的「山寨感」来源。
          别自绘,用 marketingtools 的原版 svg。
        </div>
      </div>
    </RippleStage>
  )
}
