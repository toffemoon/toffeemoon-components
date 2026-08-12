import ShinyText from '../../library/text/shiny-text/shiny-text.jsx'

export default function Demo() {
  return (
    <div className="stage" style={{ background: '#141210' }}>
      <div className="col" style={{ gap: 26, fontSize: 30, fontWeight: 500 }}>
        <div className="unit">
          <div className="lbl">默认</div>
          <ShinyText text="鎏金语言" />
        </div>
        <div className="unit">
          <div className="lbl">accent 色 · 慢速</div>
          <ShinyText text="只在转瞬即逝的场合用" color="#8a6b3f" shineColor="#e8c98a" speed={3} />
        </div>
        <div className="unit">
          <div className="lbl">yoyo · 反向</div>
          <ShinyText text="不常驻" yoyo direction="right" speed={1.6} />
        </div>
      </div>
    </div>
  )
}
