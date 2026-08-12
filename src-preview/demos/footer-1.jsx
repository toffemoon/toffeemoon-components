import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import Footer1 from '../../library/nav/footer-1/footer-1.tsx'

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <Footer1 />
      </RippleFull>
    </MemoryRouter>
  )
}
