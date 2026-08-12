import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import StyleguideApp from '../../library/block/styleguide-app/styleguide-app.tsx'

// Ripple 站内自带的样式指南页 —— 这个库某种程度上就是它的放大版。

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <StyleguideApp />
      </RippleFull>
    </MemoryRouter>
  )
}
