import { useEffect, useState } from 'react'
import { MuyanStage } from '../muyan.jsx'
import Preloader from '../../library/motion/preloader-ais/preloader.tsx'
import '../../library/motion/preloader-ais/preloader.css'

// 来源存疑的一件:Toffeemoon / commonhers-web / AI互动故事 里各有一份几乎相同的 526 行拷贝,
// 出处没标注。先当能用的东西演示,归属等核实。
//
// 2026-08-26 诊断(实测帧间变化 0.00%,画面全程静止):
//
// ① 真正的病根不是「播完了」,是**一次都没播**。旧 demo 写的是 <Preloader key={n} />,
//    没传 loading。组件里 useState(loading) 拿到 undefined,showPreloader 初值就是 false,
//    AnimatePresence 里什么都不挂,children 也没有 —— 整块 stage 是空的,
//    点「重放」只是把一个同样空的实例换掉。所以怎么点都没画面。
// ② loading 得是受控的 false→true→false 循环:组件靠 prevLoading 的上升沿 flushSync 复位,
//    靠下降沿走 exit(分条上滑),两边都要我们自己给。
// ③ 组件的 onComplete / onLoadingComplete 不能用来串下一轮 —— setShowPreloader(false) 会让
//    那个 effect 重跑,cleanup 顺手把 onComplete 的 800ms 定时器清掉,回调压根不触发。
//    同理:传给它的回调**不能写成内联箭头**,onComplete/onLoadingStart 在它 effect 的依赖里,
//    每帧重渲染都会换 identity → effect 每帧重启 → startTime 一直被重置,进度永远卡在 0。
//    所以这里一个回调都不传,节奏全部由本文件的三段状态机自己数。
// ④ 文字颜色是坏的:preloader.css 里写 color: hsl(var(--background)),而沐言 token 里
//    根本没有 --background/--foreground 这两个变量 → 整条声明失效 → 继承成浅色,
//    落在纸色遮罩上等于隐形。不动组件源码,在 demo 侧用 textClassName + 一段更高优先级的
//    选择器盖掉(顺便把 700 的字重收到 500,库的性格不喊)。
// ⑤ 默认配色 .preloader-stair-colored 在暗色偏好下是 #5227ff 荧光紫,和这套暖调完全不搭。
//    传 bgColor 就会跳过那个内层 div,直接用我们给的纸色。
//
// 缩略图那层 .thumb-veil 点不进去,所以循环必须是自动的;手动入口保留给详情页。
// 一轮 4s:遮罩铺满 1.8s → 分条掀开 1.35s → 露出页面 0.85s。
// 任意时刻截屏都落在这三段之一,没有死画面。掀开那 0.92s 是阶梯剪影,也就是这组件的招牌。
// COVER 给到 1.8s 是量出来的:文字 blur-in 要 0.7s,再减去掀开前 0.3s 的淡出,
// 短于这个数就几乎截不到「纸 + 字都站定」那一格,缩略图里只剩一块糊字的米色。
const COVER = 1800 // 遮罩停留(文字 blur-in 约 0.7s,余下是稳定态)
const LIFT = 1350 // 组件实际耗时 300(文字淡出)+ 500(单条)+ 0.06×7(错峰)= 1220,留一点余量
const IDLE = 850 // 页面完全露出的停留

const NEXT = { cover: ['lift', COVER], lift: ['idle', LIFT], idle: ['cover', IDLE] }

// 纸色遮罩 / 遮罩上的墨字。stage 主题是暖夜,纸压上来对比够,阶梯掀开时剪影才看得清。
const PAPER = '#e9e0cd'
const PAPER_INK = '#33291f'

export default function Demo() {
  const [phase, setPhase] = useState('cover')
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (phase === 'idle' && !auto) return // 关掉自动播就停在露出页面这一格
    const [next, wait] = NEXT[phase]
    const id = setTimeout(() => setPhase(next), wait)
    return () => clearTimeout(id) // 卸载时清掉,不留定时器
  }, [phase, auto])

  return (
    <MuyanStage theme="stage">
      <style>{`
        .preloader-loading-text-word.pre-ais-word {
          color: ${PAPER_INK};
          font-family: var(--font-serif);
          font-size: min(5vh, 34px);
          font-weight: 500;
          letter-spacing: 0.12em;
        }
        .pre-ais-page p { margin: 0; }
      `}</style>

      <div className="col" style={{ gap: 14 }}>
        {/* 尺寸走 vh:缩略图的 iframe 是卡片的 2.5 倍,写死 px 会在画廊里缩成一小块 */}
        <div
          style={{
            position: 'relative',
            height: 'min(52vh, 400px)',
            aspectRatio: '16 / 10',
            maxWidth: '92vw',
            overflow: 'hidden',
            borderRadius: 12,
            border: '1px solid var(--line)',
            background: 'var(--panel)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* 遮罩底下的页面。不放进 Preloader 的 children —— 放外面才能单独给遮罩层做淡入,
              否则每轮重新盖上是硬切,页面会「啪」地被吃掉。 */}
          <div
            className="pre-ais-page"
            style={{
              position: 'absolute',
              inset: 0,
              padding: '7% 8%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <p style={{ font: `500 min(3.4vh, 24px)/1.3 var(--font-serif)`, color: 'var(--fg)' }}>
              长路 · 第一节
            </p>
            <div style={{ height: 1, background: 'var(--line)', margin: '5% 0' }} />
            <p style={{ font: `400 min(2.2vh, 15px)/1.9 var(--font-serif)`, color: 'var(--muted)' }}>
              公路一直往北,路面被太阳晒得发白。
            </p>
            <p style={{ font: `400 min(2.2vh, 15px)/1.9 var(--font-serif)`, color: 'var(--muted)' }}>
              天亮前只遇见两辆车,后来连车也没有了。
            </p>
          </div>

          {/* 遮罩层。opacity 由相位切:idle 时归 0(此时组件本就没渲染,看不见),
              进 cover 时回 1 → 280ms 淡入,盖上去这一下不再是硬切。 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: phase === 'idle' ? 0 : 1,
              transition: 'opacity 280ms var(--ease-out)',
            }}
          >
            <Preloader
              loading={phase === 'cover'}
              variant="stairs"
              position="absolute"
              duration={COVER}
              stairCount={8}
              stairsRevealFrom="left"
              stairsRevealDirection="up"
              bgColor={PAPER}
              textClassName="pre-ais-word"
              loadingText="正在铺纸"
              respectReducedMotion
              reducedMotionFallback="fade"
            />
          </div>
        </div>

        <div className="lbl">遮罩铺满 → 分条错峰掀开 → 露出页面,自动循环</div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPhase('cover')} style={btn}>重放一次</button>
          <button onClick={() => setAuto((a) => !a)} style={btn}>
            {auto ? '停下自动播' : '开始自动播'}
          </button>
        </div>
      </div>
    </MuyanStage>
  )
}

const btn = {
  font: '13px system-ui, sans-serif',
  padding: '9px 20px',
  borderRadius: 10,
  cursor: 'pointer',
  border: '1px solid var(--line)',
  background: 'var(--panel)',
  color: 'var(--fg)',
}
