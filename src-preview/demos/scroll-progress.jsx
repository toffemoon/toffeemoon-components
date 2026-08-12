import { RippleStage } from '../ripple.jsx'
import ScrollProgress from '../../library/motion/scroll-progress/scroll-progress.tsx'

// 进度条吃的是窗口滚动,所以这里铺一段够长的内容让它有得跑。

export default function Demo() {
  return (
    <RippleStage>
      <ScrollProgress />
      <div className="lbl">顶部细线随滚动推进 —— 往下滚</div>
      {Array.from({ length: 14 }).map((_, i) => (
        <p key={i} style={{ opacity: 0.32, lineHeight: 1.9, margin: '0 0 22px' }}>
          {String(i + 1).padStart(2, '0')} —— 静息心率在连续四天里比基线高出 7% 以上,
          这不是一次读数的问题,是一段趋势。
        </p>
      ))}
    </RippleStage>
  )
}
