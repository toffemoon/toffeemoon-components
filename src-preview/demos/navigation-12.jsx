import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import Navigation12 from '../../library/nav/navigation-12/navigation-12.tsx'

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <Navigation12 />
        <div style={{ height: 900, padding: '90px 28px 0', opacity: 0.3, lineHeight: 1.9 }}>
          往下滚 —— 导航吸顶后会换态。
        </div>
      </RippleFull>
    </MemoryRouter>
  )
}
