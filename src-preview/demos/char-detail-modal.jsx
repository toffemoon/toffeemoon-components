import { MuyanStage, MODELS } from '../muyan.jsx'
import CharDetailModal from '../../library/ui/char-detail-modal/CharDetailModal.jsx'

// 固定全屏覆盖 —— 放在轮播外用,不会被卡片的 transform 顶歪。

export default function Demo() {
  return (
    <MuyanStage>
      <CharDetailModal model={MODELS[1]} onClose={() => {}} />
    </MuyanStage>
  )
}
