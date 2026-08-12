import DepthCard from '../../library/ui/depth-card/depth-card.jsx'
import '../../library/ui/depth-card/depth-card.css'

export default function Demo() {
  return (
    <div className="stage" style={{ background: '#141210' }}>
      <DepthCard>
        <div style={{ padding: '26px 24px', maxWidth: 260 }}>
          <div style={{ fontSize: 15, marginBottom: 8 }}>景深卡</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.65, color: '#9a9088' }}>
            指针移动时内容分层位移。移到卡片上试试。
          </div>
        </div>
      </DepthCard>
    </div>
  )
}
