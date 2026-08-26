import React from 'react'
import { MuyanStage } from '../muyan.jsx'
import { PageBody, stopHashNav } from '../page.jsx'
import { StaggeredMenu } from '../../library/nav/staggered-menu/StaggeredMenu.jsx'
import '../../library/nav/staggered-menu/StaggeredMenu.css'

// 710 行,整个库里单文件最大的一件。右上角按钮展开。
//
// 2026-08-26:垫上假页面 + 开场自己展开一次。
// 旧版是一整框近黑的空底,右上角一颗小小的「示例 +」——「填充率 98%」是假的:
// 铺满的是那层透明壳,眼睛看到的是一整片空。而且菜单收着的时候等于什么都没演,
// 画廊缩略图又点不进去,那一格永远只有角落一个加号。
// 现在:底下是页面,挂上之后自己点一次开关把菜单推开(用的是组件自己的按钮,
// 走的是同一条 toggleMenu 路径,不是伪造状态);详情页里点「关闭」收回去、
// 再点一次能重看那套错峰动画。

const items = [
  { label: '首页', link: '/', ariaLabel: '首页' },
  { label: '作品', link: '/work', ariaLabel: '作品' },
  { label: '记录', link: '/log', ariaLabel: '记录' },
  { label: '关于', link: '/about', ariaLabel: '关于' },
]

const socials = [{ label: '小红书', link: '#' }, { label: '抖音', link: '#' }]

export default function Demo() {
  const hostRef = React.useRef(null)

  React.useEffect(() => {
    // 等它自己的入场排布落定再点,早了会和初始化的 gsap 时间线打架
    const id = setTimeout(() => {
      const btn = hostRef.current?.querySelector('.sm-toggle')
      if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click()
    }, 700)
    return () => clearTimeout(id)
  }, [])

  return (
    <MuyanStage theme="stage" pad={0}>
      <div
        ref={hostRef}
        onClickCapture={stopHashNav}
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      >
        <PageBody
          eyebrow="示例页面 · 错峰菜单"
          lead="右上角那颗就是开关。展开时几层色板错峰推过来,条目一行一行落位;再点一次收回去。"
        />
        {/* 菜单壳默认是 position:relative —— 直接跟在 PageBody 后面会排到页面下方去
            (实测 top 落在 567,而框只有 560 高,整块在视口外;文档因此变高、框跟着长,
            壳又是 height:100% 于是再长一轮,一路顶到上限 1250)。
            用一层 absolute inset:0 把它压回页面上方,这也是它在真站里的用法:浮层导航。 */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <StaggeredMenu
            items={items}
            socialItems={socials}
            brandText="示例"
            colors={['#3a3127', '#8f3c32']}
            accentColor="#c79a4e"
            menuButtonColor="#ece3d2"
            openMenuButtonColor="#221c16"
          />
        </div>
      </div>
    </MuyanStage>
  )
}
