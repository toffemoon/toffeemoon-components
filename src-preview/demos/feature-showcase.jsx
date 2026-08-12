import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import FeatureShowcase from '../../library/block/feature-showcase/feature-showcase.tsx'
import FeatureMore from '../../library/block/feature-showcase/feature-more.tsx'
import PageCta from '../../library/block/feature-showcase/page-cta.tsx'

// 这一组是三件:showcase + more + cta。都是 Ripple 自己写的,不是 block 库来的。

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <FeatureShowcase />
        <FeatureMore />
        <PageCta line="身体先知道,你后知道。" />
      </RippleFull>
    </MemoryRouter>
  )
}
