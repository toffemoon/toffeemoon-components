import { useState } from 'react'
import { MuyanStage } from '../muyan.jsx'
import ImageCropField from '../../library/ui/image-crop-field/ImageCropField.jsx'

export default function Demo() {
  const [v, setV] = useState('')
  return (
    <MuyanStage>
      <div style={{ width: 360 }}>
        <div className="lbl">选一张图 —— 会进裁剪态</div>
        <ImageCropField value={v} onChange={setV} label="卡面" />
      </div>
    </MuyanStage>
  )
}
