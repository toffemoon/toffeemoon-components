import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import HowItWorks4 from '../../library/block/how-it-works-4/how-it-works-4.tsx'

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <HowItWorks4 />
      </RippleFull>
    </MemoryRouter>
  )
}
