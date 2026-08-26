import { MuyanStage } from '../muyan.jsx'
import Stepper, { Step } from '../../library/ui/stepper/Stepper.jsx'

export default function Demo() {
  return (
    <MuyanStage>
      <div style={{ width: 460 }}>
        <Stepper initialStep={1}>
          <Step>
            <div style={{ padding: '12px 0' }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>怎么称呼你</div>
              <div style={{ opacity: 0.6, fontSize: 13 }}>这个名字会显示在你的主页上。</div>
            </div>
          </Step>
          <Step>
            <div style={{ padding: '12px 0' }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>常用什么语言</div>
              <div style={{ opacity: 0.6, fontSize: 13 }}>之后在设置里随时能改。</div>
            </div>
          </Step>
          <Step>
            <div style={{ padding: '12px 0' }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>好了</div>
              <div style={{ opacity: 0.6, fontSize: 13 }}>开始用吧。</div>
            </div>
          </Step>
        </Stepper>
      </div>
    </MuyanStage>
  )
}
