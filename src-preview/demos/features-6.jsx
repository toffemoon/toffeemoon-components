import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import PrivacyTrust from '../../library/block/features-6/features-6.tsx'

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <PrivacyTrust />
      </RippleFull>
    </MemoryRouter>
  )
}
