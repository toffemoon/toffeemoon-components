import { MuyanStage } from '../muyan.jsx'
import { IdentityCard } from '../../library/ui/identity-card/IdentityCard.jsx'

export default function Demo() {
  return (
    <MuyanStage>
      <div className="unit">
        <div className="lbl">点一下翻面</div>
        <IdentityCard
          name="雨钦"
          taste="半糖 · 多冰"
          message="下次雨停了再来,我给你留窗边那张桌。"
          issuedAt="2026-08-12"
        />
      </div>
    </MuyanStage>
  )
}
