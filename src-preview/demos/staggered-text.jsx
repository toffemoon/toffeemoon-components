import StaggeredText from '../../library/text/staggered-text/staggered-text.tsx'
import '../../library/text/staggered-text/staggered-text.css'

export default function Demo() {
  return (
    <div className="stage" style={{ background: '#141210' }}>
      <div className="col" style={{ gap: 30, textAlign: 'center' }}>
        <div className="unit">
          <div className="lbl">逐字 · 默认</div>
          <div style={{ fontSize: 34, fontWeight: 500 }}>
            <StaggeredText text="安静、慢、不喊" />
          </div>
        </div>
        <div className="unit">
          <div className="lbl">带模糊 · 慢</div>
          <div style={{ fontSize: 22, color: '#9a9088' }}>
            <StaggeredText text="Calm, legible, thoughtful" blur delay={40} duration={0.9} />
          </div>
        </div>
      </div>
    </div>
  )
}
