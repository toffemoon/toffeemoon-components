import '../../library/token/muyan/base.css'
import TokenSheet from '../TokenSheet.jsx'

export default function Demo() {
  return (
    <TokenSheet
      title="沐言 token"
      themes={['paper', 'stage']}
      note="两层结构:raw 色板 / scale(不可变)→ 语义层(按 [data-theme] 映射)。组件只吃语义层(--bg / --fg / --accent …),换主题 = 换 data-theme。切上面的按钮看两套语义层怎么落到同一批变量上。"
    />
  )
}
