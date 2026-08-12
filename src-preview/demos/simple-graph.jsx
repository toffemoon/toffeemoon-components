import { RippleStage } from '../ripple.jsx'
import SimpleGraph from '../../library/ui/simple-graph/simple-graph.tsx'

// 造一段像静息心率的数据:平稳 → 抬升 → 回落,中间埋一个异常点。
const data = [
  { value: 54, label: '周一' },
  { value: 53, label: '周二' },
  { value: 55, label: '周三' },
  { value: 61, label: '周四', dotColor: '#f36b60' },
  { value: 63, label: '周五', dotColor: '#f36b60' },
  { value: 58, label: '周六' },
  { value: 54, label: '周日' },
]

export default function Demo() {
  return (
    <RippleStage>
      <div className="lbl">静息心率 · 异常点走珊瑚色</div>
      <SimpleGraph data={data} height={280} showGrid animationDuration={1.6} />
    </RippleStage>
  )
}
