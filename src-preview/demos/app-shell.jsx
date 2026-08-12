import { MemoryRouter } from 'react-router-dom'
import { MuyanStage } from '../muyan.jsx'
import AppShell from '../../library/nav/app-shell/AppShell.jsx'
import '../../library/nav/app-shell/shell.css'

// AppShell 吃 react-router 的 location,还吃 game state 的续读信息(ResumeBar)。
// 这里只给 router,ResumeBar 没有存档就自己收起来 —— 底部导航是这一件的主体。

export default function Demo() {
  return (
    <MemoryRouter initialEntries={['/explore']}>
      <MuyanStage pad={0}>
        <div style={{ position: 'relative', width: 390, height: 100 + 300, border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
          <AppShell>
            <div style={{ padding: 20, opacity: 0.55, fontSize: 13, lineHeight: 1.9 }}>
              手机宽度的应用壳。底部是五格导航,当前在「探索」。
            </div>
          </AppShell>
        </div>
      </MuyanStage>
    </MemoryRouter>
  )
}
