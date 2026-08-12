import '../../library/token/ripple/index.css'
import TokenSheet from '../TokenSheet.jsx'

export default function Demo() {
  return (
    <TokenSheet
      title="Ripple token"
      bg="#0a0c0f"
      note="Tailwind 4 的 @theme 变量表。全站唯一品牌色 teal,没有状态色系 —— 真源是 ripple-ios 的 RippleColor.swift,官网视觉跟 app 对齐。基底刻意不用纯黑,层级靠亮度抬。"
    />
  )
}
