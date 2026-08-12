import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import FAQ1 from '../../library/block/faq-1/faq-1.tsx'

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <FAQ1 />
      </RippleFull>
    </MemoryRouter>
  )
}
