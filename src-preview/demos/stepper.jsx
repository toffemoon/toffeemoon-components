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
              <div style={{ opacity: 0.6, fontSize: 13 }}>店里的人会这么叫你。</div>
            </div>
          </Step>
          <Step>
            <div style={{ padding: '12px 0' }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>喝什么</div>
              <div style={{ opacity: 0.6, fontSize: 13 }}>糖沐会记住,下次不用再说。</div>
            </div>
          </Step>
          <Step>
            <div style={{ padding: '12px 0' }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>好了</div>
              <div style={{ opacity: 0.6, fontSize: 13 }}>推门进去吧。</div>
            </div>
          </Step>
        </Stepper>
      </div>
    </MuyanStage>
  )
}
