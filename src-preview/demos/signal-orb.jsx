import { SignalOrb } from '../../library/3d-scene/signal-orb/SignalOrb.jsx'

export default function Demo() {
  return (
    <div className="stage stage--bleed" style={{ position: 'relative', background: '#0b0b0e' }}>
      <SignalOrb />
    </div>
  )
}
