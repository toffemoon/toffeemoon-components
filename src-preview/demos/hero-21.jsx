import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import { Hero21 } from '../../library/block/hero-21/hero-21.tsx'

// block 里有 <Link>,单独拎出来没有 router 会直接抛错 —— 套一层 MemoryRouter。

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <Hero21 />
      </RippleFull>
    </MemoryRouter>
  )
}
