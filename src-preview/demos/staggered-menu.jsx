import { MuyanStage } from '../muyan.jsx'
import { StaggeredMenu } from '../../library/nav/staggered-menu/StaggeredMenu.jsx'
import '../../library/nav/staggered-menu/StaggeredMenu.css'

// 710 行,整个库里单文件最大的一件。右上角按钮展开。

const items = [
  { label: '探索', link: '/explore', ariaLabel: '探索' },
  { label: '故事', link: '/story', ariaLabel: '故事' },
  { label: '创作', link: '/create', ariaLabel: '创作' },
  { label: '我的', link: '/mine', ariaLabel: '我的' },
]

const socials = [{ label: '小红书', link: '#' }, { label: '抖音', link: '#' }]

export default function Demo() {
  return (
    <MuyanStage theme="stage" pad={0}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <StaggeredMenu
          items={items}
          socialItems={socials}
          brandText="沐言"
          colors={['#3a3127', '#8f3c32']}
          accentColor="#c79a4e"
          menuButtonColor="#ece3d2"
          openMenuButtonColor="#221c16"
        />
      </div>
    </MuyanStage>
  )
}
