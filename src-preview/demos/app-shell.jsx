import { MemoryRouter } from 'react-router-dom'
import { MuyanStage } from '../muyan.jsx'
import { PageBody, stopHashNav } from '../page.jsx'
import AppShell from '../../library/nav/app-shell/AppShell.jsx'
import '../../library/nav/app-shell/shell.css'

// 2026-08-26 重做。旧版有两个问题,一个是留白,一个是**说的和演的不是一回事**:
//
// ① 旧版把 AppShell 塞进一个 390×400 的手机框里,底下写「底部是五格导航,当前在探索」。
//    但 AppShell 里的 useIsMobile 读的是 `window.matchMedia('(max-width: 720px)')` ——
//    读的是**这个 iframe 的宽度**(详情页里 1156),不是那个 390 的盒子。
//    所以它走的一直是桌面分支:左边那条 icon rail(StaggeredMenu 的半常驻态),
//    而且 rail 是钉在 iframe 左边缘的,压根不在那个手机框里。
//    框里只剩一句自称「底部导航」的说明文字,四百像素全空 —— 实测填充率 24.3%。
// ② 所以这一版按它真实的样子演:壳铺满台子,左边是 rail,右边是页面。
//    要看手机那一支,把预览「新窗口打开」再把窗口拖到 720 以下,它会自己换成底部五格。
//    说明文字也改成实话。
//
// rail 上的「沐」和五个条目(探索 / 纯聊 / 创作 / 我的 / 论坛)写死在
// library/nav/app-shell/nav.js 和 AppShell.jsx 里 —— 那是组件自己的数据,不是演示文案,
// 按红线不动。
//
// ResumeBar 没有存档会自己收起来,所以这里只给 router。

export default function Demo() {
  return (
    <MemoryRouter initialEntries={['/explore']}>
      <MuyanStage pad={0}>
        {/* overflow:auto 的理由和 MockPage 那边一样:让 Detail.jsx 量得到真实高度,别把页面切一条 */}
        <div
          onClickCapture={stopHashNav}
          style={{ position: 'relative', width: '100%', height: '100%', overflow: 'auto' }}
        >
          <AppShell>
            <PageBody
              eyebrow="示例页面 · 应用壳"
              lead="左边那条是壳的桌面态:静止时只露 icon rail,鼠标经过展开大字菜单。窄到 720 以下会换成手机的底部五格 —— 预览框比 720 宽,所以现在看到的是桌面那一支。"
            />
          </AppShell>
        </div>
      </MuyanStage>
    </MemoryRouter>
  )
}
