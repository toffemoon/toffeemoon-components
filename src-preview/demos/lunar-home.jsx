import '../../library/token/toffeemoon/styles.css'
import '../../library/3d-scene/lunar-home/lunar-home.css'
import { LunarHome } from '../../library/3d-scene/lunar-home/LunarHome.jsx'
import { I18nProvider } from '../../library/3d-scene/i18n.jsx'
import { LunarTransitionProvider } from '../../library/3d-scene/lunar-home/LunarTransitionContext.jsx'

// Toffeemoon 首页整场:月球 + 绕月的项目小行星 + 滚动推进的相机与叙事。
// 这是整个库里上下文最重的一件(LunarHome 556 行 + CameraRig 345 行)。
// 它吃 i18n context 和 workData,两份都随组件收进来了,所以文案是真的不是 key。

export default function Demo() {
  return (
    <I18nProvider>
      <LunarTransitionProvider>
        {/* 这一场是滚动驱动的:相机与叙事跟着滚动推进。
            所以容器必须能滚,不然只看得到第 0 帧(一层大气渐变,月亮还没进画)。 */}
        <div
          className="stage stage--bleed"
          style={{ position: 'relative', background: '#05060a', overflowY: 'auto' }}
        >
          <LunarHome sceneEnabled />
        </div>
      </LunarTransitionProvider>
    </I18nProvider>
  )
}
