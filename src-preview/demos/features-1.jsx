import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import { Features1 } from '../../library/block/features-1/features-1.tsx'

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <Features1 />
      </RippleFull>
    </MemoryRouter>
  )
}
