import SilkWaves from '../../library/motion/silk-waves/silk-waves.tsx'

export default function Demo() {
  return (
    <div className="stage stage--bleed" style={{ position: 'relative', background: '#07131a' }}>
      <SilkWaves />
    </div>
  )
}
