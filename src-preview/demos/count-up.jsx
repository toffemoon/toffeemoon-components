import CountUp from '../../library/text/count-up/count-up.jsx'

export default function Demo() {
  return (
    <div className="stage" style={{ background: '#141210' }}>
      <div className="row" style={{ gap: 44 }}>
        <div className="unit">
          <div className="lbl">组</div>
          <div style={{ fontSize: 46, fontVariantNumeric: 'tabular-nums' }}>
            <CountUp to={63} duration={2} />
          </div>
        </div>
        <div className="unit">
          <div className="lbl">行源码 · 带千分位</div>
          <div style={{ fontSize: 46, fontVariantNumeric: 'tabular-nums' }}>
            <CountUp to={26663} duration={2.6} separator="," />
          </div>
        </div>
        <div className="unit">
          <div className="lbl">倒数</div>
          <div style={{ fontSize: 46, fontVariantNumeric: 'tabular-nums' }}>
            <CountUp from={100} to={0} direction="down" duration={2.2} />
          </div>
        </div>
      </div>
    </div>
  )
}
