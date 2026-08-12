import { RippleStage } from '../ripple.jsx'
import { BlurHighlight } from '../../library/_alias/components/blur-highlight.tsx'

// 注意:这里 import 的是 _alias 下 ripple 自己那份(310 行),
// 不是 library/text/blur-highlight/ 下沐言那份(286 行)—— 两份不一样。

export default function Demo() {
  return (
    <RippleStage scroll={false}>
      <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
        <div style={{ fontSize: 30, lineHeight: 1.5, maxWidth: '20ch', textAlign: 'center' }}>
          <BlurHighlight highlightedBits={['先知道', '后知道']}>
            身体先知道,你后知道
          </BlurHighlight>
        </div>
      </div>
    </RippleStage>
  )
}
