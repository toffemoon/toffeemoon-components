import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import Waitlist6 from '../../library/block/waitlist-6/waitlist-6.tsx'

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <Waitlist6 />
      </RippleFull>
    </MemoryRouter>
  )
}
