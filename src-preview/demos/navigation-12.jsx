import { MemoryRouter } from 'react-router-dom'
import { RippleFull } from '../ripple.jsx'
import { PageBody } from '../page.jsx'
import Navigation12 from '../../library/nav/navigation-12/navigation-12.tsx'

// 2026-08-26:换掉那块 900px 的空白,顺手改掉一句不实的说明。
//
// ① 旧版导航底下垫的是 `<div style={{ height: 900 }}>` 加一行字 ——
//    详情页会按内容把框撑高,于是框变成 994,里面九百多像素是空的。
//    现在换成能填满一屏的假页面:导航在顶上,底下是真有东西的正文。
// ② 旧版那行字写「往下滚 —— 导航吸顶后会换态」。看源码,navigation-12 只有
//    `className="sticky top-0 ..."` 一条 CSS sticky,没有任何 scroll 监听、
//    也没有随滚动切换的 state —— 它不换态,只是吸顶时底下那道渐变把内容接住。
//    照着旧说明去滚,只会觉得「怎么没反应」,所以改成实话。
//
// 这一件吃 Ripple 的 Tailwind token,所以外壳用 RippleFull 不是 MuyanStage。
// PageBody 的颜色全从 currentColor 推,深色底上照样成立。

export default function Demo() {
  return (
    <MemoryRouter>
      <RippleFull>
        <Navigation12 />
        <PageBody
          eyebrow="示例页面 · 顶部导航"
          lead="导航是 CSS sticky:跟着页面走,滚到顶就贴住,底下那道从 bg 到透明的渐变负责把滚上来的内容接住,不会硬切。它本身不随滚动换态。"
        />
      </RippleFull>
    </MemoryRouter>
  )
}
