import { Player } from '@remotion/player'
import { AgentSubagent } from '../../library/video/remotion-kit/AgentSubagent.tsx'

// Remotion 组件是渲染成视频的,不是网页组件。@remotion/player 能在浏览器里
// 把同一棵组合树按时间轴播出来 —— 所见即渲染出的成片。
//
// 30fps × 60s;音轨没搬进来(public/audio.mp3 在原项目),所以是无声的。

export default function Demo() {
  return (
    <div className="stage" style={{ background: '#0b0b0e' }}>
      <div style={{ width: '100%', maxWidth: 620 }}>
        <div className="lbl">Stage / Card / Arrow / Dot / SectionFade / Subtitle 组合成的片子</div>
        <Player
          component={AgentSubagent}
          durationInFrames={30 * 60}
          fps={30}
          compositionWidth={1080}
          compositionHeight={1920}
          style={{ width: '100%', aspectRatio: '9 / 16', borderRadius: 10, overflow: 'hidden' }}
          controls
          loop
        />
      </div>
    </div>
  )
}
