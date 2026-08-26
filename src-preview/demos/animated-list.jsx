import { MuyanStage } from '../muyan.jsx'
import AnimatedList from '../../library/ui/animated-list/animated-list.tsx'
import '../../library/ui/animated-list/animated-list.css'

// 2026-08-26(二改)修三处。前两处是上一轮的,留着记账:
//
// ① 上下两条黑杠。组件的淡出遮罩是
//    `linear-gradient(..., ${fadeColor || "var(--background, #0a0a0a)"} ...)` ——
//    fadeColor 不传就回落到近黑色。旧版没传,而台子是亮纸底,
//    于是两条黑到透明的硬渐变直接压在白卡片上,看着像渲染事故。
//    这里把 fadeColor 传成 var(--bg):遮罩和底色同色,才是「边缘淡出」该有的样子。
//
// ② 开头几拍的重影 —— 这一轮真修掉了,而且没碰组件源码。
//    病根:组件的种子就是 initialItems 本身,而自动添加的游标
//    `itemIndexRef = useRef(initialItems.length)` 第一次取的是
//    `initialItems[len % len]` = initialItems[0] —— 正好是列表头那条,必然并排重复。
//    绕法:组件给自动添加的条目编的 id 是 `${源id}-${全局序号}`(见 animated-list.tsx
//    的 setInterval 那段),尾数就是一个只增不减的计数。
//    所以文案不从 item.content 取,改从 id 的尾数取 —— 种子是 0..6,
//    第一条自动添加的尾数是 7,取到 LINES[7],跟谁都不重样。
//    LINES 有 15 条、屏上最多 7 条:等它绕回来时,原来那条早被顶出去了。
//    autoAddDelay 也就不用再为了缩短「难看的开头」而压到 1200,收回 2000,节奏更稳。
//
// ③ 一片白。旧版写死 width:420 + 组件默认 height:600px + startFrom:"center",
//    而 `.animated-list-items-center` 是 `padding-top: 50%` —— 百分比 padding 按**宽度**算,
//    420 宽就白顶出 210px。加上框被撑到 1096 高,实测填充率只有 20.1%。
//    现在:startFrom="top" 去掉那 210px,宽 min(640px, 100%)、高 100% 跟着框走 ——
//    框宽随窗口变,列表跟着变,不再是一小条钉在空纸中间。
//    maxItems 从 5 提到 7:净高 512 装得下 6 条半,5 条只填七成、底下空一块。
//    7 条会溢出一点,第 7 条落在下沿的淡出遮罩里只露个边 ——
//    那两条淡出边本来就是给「上下都还有」用的,有东西可淡它才成立。
//
// ④ 颜色和字。这条是作者在自己屏幕上看出来的,我第一轮全跑在浅色偏好下,没看见:
//    animated-list.css 里有一段 `@media (prefers-color-scheme: dark)`,
//    把条目卡刷成 #0a0a0a、字刷成 #fff。它只看**系统偏好**,不看台子是什么主题 ——
//    浏览器设成暗色时,一排近黑的卡就压在纸白的台子上,而我原先写死的 color: var(--fg)
//    又把 #fff 盖回墨色,黑底墨字,基本读不出来。
//    组件源码不能动,所以在这里用一段更高优先级的选择器(.al-fit 前缀,0,2,0 > 0,1,0)
//    把两种偏好都钉死到语义 token 上:底 --sunk、边 --line、字 --fg,跟着台子走。
//    字体也从 --font-serif 换成 --font-sans:serif 那条栈是
//    "Noto Serif SC" → "Songti SC" → "SimSun",这台 Windows 上大概率落到宋体,
//    15px 的宋体正文是这次「字体太差」的另一半;--font-sans 在 Windows 上落到微软雅黑。

const LINES = [
  '风向变了,云从西边压过来。',
  '路灯比昨天早亮了十分钟。',
  '楼下那棵树夜里掉了半树叶子。',
  '雨小了些,但还没停。',
  '远处有人在试音,只响了两声。',
  '天光收得很快,五点半就暗了。',
  '铁皮屋顶被风掀得咔咔响。',
  '河面结了一层薄冰,踩不住。',
  '今天第一班车晚了四分钟。',
  '有人在楼道里换了灯泡。',
  '窗玻璃上起了一层雾。',
  '麻雀落在电线上,一共七只。',
  '收音机自己跳到了另一个台。',
  '街对面的灯亮了。',
  '潮水退到了礁石以外。',
]

// 种子正好放满 MAX 条,id 就是 0..MAX-1 —— 和上面 ② 说的编号规则对齐。
// 放满而不是放 5 条:列表是「满了之后顶掉最旧的」,不是「慢慢长满」,
// 一挂上就该是稳态,否则头几秒下面空一块,缩略图正好撞见的就是那一格。
const MAX = 7
const seed = LINES.slice(0, MAX).map((content, id) => ({ id, content }))

// 种子的 id 是数字 0..MAX-1;自动添加的是字符串 "3-9" 这种,尾数才是全局序号。
// 两种都取最后一段转数字,就得到一条连续的编号轴。
function lineOf(id) {
  const n = Number(String(id).split('-').pop())
  return LINES[(Number.isFinite(n) ? n : 0) % LINES.length]
}

export default function Demo() {
  return (
    <MuyanStage>
      <style>{`
        /* 盖掉组件自带的 prefers-color-scheme 那一段,底色和字都跟台子的语义 token 走 */
        .al-fit .animated-list-item-card {
          background: var(--sunk);
          border: 1px solid var(--line);
          border-radius: var(--r-card);
          padding: 15px 20px;
        }
        .al-fit .animated-list-item-text {
          color: var(--fg);
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: var(--lh-read);
        }
      `}</style>
      <div className="al-fit" style={{ width: 'min(640px, 100%)', height: '100%' }}>
        <AnimatedList
          items={seed}
          autoAddDelay={2000}
          maxItems={MAX}
          startFrom="top"
          height="100%"
          itemGap={14}
          /* 遮罩跟着台子的底色走,不然回落成近黑色,在亮底上就是两条黑杠 */
          fadeColor="var(--bg)"
          /* 样式全交给上面那段 CSS:要盖的是条目卡(.animated-list-item-card)那一层,
             内联只够得着这个文字 div,盖不住卡的底色 —— 索性两处一起放 CSS 里 */
          renderItem={(item) => <div className="animated-list-item-text">{lineOf(item.id)}</div>}
        />
      </div>
    </MuyanStage>
  )
}
