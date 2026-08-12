import ClickSpark from '../../library/motion/click-spark/ClickSpark.jsx'

export default function Demo() {
  return (
    <div className="stage stage--bleed" style={{ position: 'relative', background: '#141210' }}>
      <ClickSpark />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: 13,
          letterSpacing: '0.16em',
          color: 'rgba(236,230,221,0.34)',
        }}
      >
        点一下任意位置
      </div>
    </div>
  )
}
