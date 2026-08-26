import { MuyanStage } from '../muyan.jsx'
import AnimatedList from '../../library/ui/animated-list/animated-list.tsx'
import '../../library/ui/animated-list/animated-list.css'

// 2026-08-26 修两处「看着像坏了」:
//
// ① 上下两条黑杠。组件的淡出遮罩是
//    `linear-gradient(..., ${fadeColor || "var(--background, #0a0a0a)"} ...)` ——
//    fadeColor 不传就回落到近黑色。旧版没传,而台子是沐言的 paper 亮底,
//    于是两条黑到透明的硬渐变直接压在白卡片上,看着像渲染事故。
//    这里把 fadeColor 传成 var(--bg):在 MuyanStage 里它就是纸色,遮罩和底色同色,
//    才是「边缘淡出」该有的样子。组件源码一行没动 —— 它本来就留了这个口子。
//
// ② 条目重复。自动添加是从 initialItems 里循环取一条 prepend 进去,再 slice(0, maxItems)。
//    旧版 5 条源数据配 maxItems=5:第一次插入时,新插的那条和列表里原本就有的同一条
//    并排出现,之后每一轮都有重影,读起来像 bug。
//    源数据加到 9 条。但**开头那几秒消不掉**:组件的种子和循环源是同一个数组,
//    而循环从 index 0 起 —— 初始列表的头本来就是 src[0],第一次自动添加又插一个
//    src[0],必然并排。要根治得改组件(种子和循环源分开,或循环从 maxItems 起),
//    那是收编来的源码,不动。实测:前 4 拍有重复,种子被顶出去之后就干净并一直干净。
//    autoAddDelay 从 1800 收到 1200,把这段过渡从约 9 秒压到约 5 秒 ——
//    画廊缩略图是滚到才挂载的,过渡越短被撞见的概率越低。
//
// 文案换成「一条会自己长出来的动态流」该有的样子:每条都是独立的一则,
// 不需要连起来读,也就不会因为顺序被打乱而读着别扭。

const items = [
  { id: 1, content: '门口的风铃响了一下,没人进来。' },
  { id: 2, content: '第三桌的茶凉了,客人还没回来。' },
  { id: 3, content: '雨小了些,但还没停。' },
  { id: 4, content: '有人把伞忘在了架子上。' },
  { id: 5, content: '窗玻璃上起了一层雾。' },
  { id: 6, content: '收音机跳到了一段没人点的曲子。' },
  { id: 7, content: '猫从柜台后面挪到了暖气边。' },
  { id: 8, content: '今天的第七杯,还是老样子。' },
  { id: 9, content: '街对面的灯亮了。' },
]

export default function Demo() {
  return (
    <MuyanStage>
      <div style={{ width: 420 }}>
        <AnimatedList
          items={items}
          autoAddDelay={1200}
          maxItems={5}
          /* 遮罩跟着台子的底色走,不然回落成近黑色,在亮底上就是两条黑杠 */
          fadeColor="var(--bg)"
        />
      </div>
    </MuyanStage>
  )
}
