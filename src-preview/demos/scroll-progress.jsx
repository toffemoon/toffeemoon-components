import React from 'react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { RippleStage } from '../ripple.jsx'
import ScrollProgress from '../../library/motion/scroll-progress/scroll-progress.tsx'
import ScrollManager from '../../library/motion/scroll-progress/scroll-manager.tsx'

// 诊断(2026-08-26 重做):作者说「展示得很奇怪,不知道在展示什么」。
// 无头浏览器连拍 10 帧,帧间变化 0.01% —— 不是崩了,是压根没滚起来。三个原因叠在一起:
//
// ① ScrollProgress 里 useScroll() 不带 container,读的是 **window / document 的滚动**。
//    但 demo.css 把 html/body/#stage 全钉死 height:100% + body{overflow:hidden},
//    旧版又把长文塞进 RippleStage 那个 overflowY:auto 的内层 div —— 滚的是内层,
//    window.scrollY 永远是 0,scaleX 永远是 0,那条线宽度为零,等于没渲染。
//    组件没错,是台子没给它一条能滚的路。这里在 demo 侧把文档放开(挂载时改
//    html/body/#stage 的 height/overflow,卸载还原),不动组件源码。
//
// ② 画廊缩略图盖了 .thumb-veil,点不进也滚不动。所以演示台自己开一个 rAF
//    慢速来回滚(15s 一轮,smoothstep 进出,不是匀速甩)。注意:**滚动是演示台驱动的,
//    进度值仍然是组件自己从 window.scrollY 算的** —— 下面那个百分比不是我另算一份,
//    是把组件那个 motion.div 的 computed transform 里的 scaleX 读回来显示,
//    所以它连 useSpring 的滞后都照实反映(手滚到底时数字会慢半拍追上来,那就是弹簧)。
//    详情页里只要用户一动(wheel / touch / 键盘 / 指针),自动滚立刻放手,不抢方向盘 ——
//    这条纪律是抄 scroll-manager 自己的 abort 逻辑。prefers-reduced-motion 时不自动滚,
//    停在 34% 让静止画面里也有个说得清的进度。
//
// ③ 「滚动管理」那一半以前根本没出现在台上。ScrollManager 吃 react-router 的
//    useLocation,没有 Router 就跑不起来,所以这里套一层 MemoryRouter(只为演示,
//    真项目里它跟着 BrowserRouter 走)。左下角两个按钮对应它管的两件事:
//    换 pathname → 瞬时回顶;带 hash → 找到目标并用 ResizeObserver 守 6 秒防布局漂移。
//    尾注那节故意带 scroll-margin-top:96,好看出它是按 scrollMarginTop 校正而不是按 0。
//
// 缩略图口径:iframe 按 250% 排版再 scale(0.4),约 825×515 视口。正文缩完是纹理不是字,
// 所以画面里说话的是左上角那块读数(30px 数字缩完约 12px,读得出)+ 顶部那条 teal 细线,
// 加上一直在动的正文。任意一帧截下来都能看出「有个东西在按滚动推进」。

const SECTIONS = [
  ['01 基线', '连续四天,静息心率比你自己的基线高出 7% 以上。单看任何一天都在正常区间里,所以没有一条规则会被触发。'],
  ['02 趋势', '把四天连起来看才成立 —— 这是趋势,不是读数。异常检测的意义在于它比阈值更早,也更容易说错。'],
  ['03 沉默', '不确定的时候不出声。宁可漏一次,不要因为一次噪声把人叫醒;被叫醒三次而三次都没事,第四次就不会被相信了。'],
  ['04 语气', '措辞按同一套语气写:陈述观察,不下判断。「这四天偏高」而不是「你有风险」。'],
  ['05 时机', '同样一句话,会议之间弹出来和睡前弹出来,是两件事。上下文先于内容。'],
  ['06 留白', '一天最多一次。额度用完就闭嘴,哪怕又检出一个偏离 —— 密度本身就是一种语气。'],
  ['07 回看', '一周之后回头看,大多数偏离都自己回去了。这是好事,说明基线是活的。'],
  ['08 边界', '不诊断。所有输出都停在「我看到了什么」,不迈进「这意味着什么」。'],
]

/* 把组件真实渲染出来的那条线读回来:
   ScrollProgress 是 motion.div style={{scaleX}},computed transform 里的 matrix.a 就是它。
   拿不到(首帧 transform 还是 none)就沿用上一次,不要跳成 1。 */
function readScaleX(el, fallback) {
  if (!el) return fallback
  const t = getComputedStyle(el).transform
  if (!t || t === 'none') return fallback
  try {
    return new DOMMatrixReadOnly(t).a
  } catch {
    const m = t.match(/matrix\(([-\d.eE]+)/)
    return m ? parseFloat(m[1]) : fallback
  }
}

const panel = {
  position: 'fixed',
  zIndex: 70,
  background: 'rgba(10, 12, 15, 0.74)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid var(--color-line, rgba(255,255,255,0.08))',
  borderRadius: 12,
  padding: '13px 15px 14px',
}

const btn = {
  font: 'inherit',
  fontSize: 11,
  lineHeight: 1.6,
  padding: '4px 11px',
  borderRadius: 999,
  border: '1px solid var(--color-line, rgba(255,255,255,0.08))',
  background: 'transparent',
  color: 'var(--color-ink-muted, #9aa1a6)',
  cursor: 'pointer',
}

function Page() {
  const barWrap = React.useRef(null)
  const pctRef = React.useRef(null)
  const fillRef = React.useRef(null)
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const [driving, setDriving] = React.useState(true)

  // ① 把文档放开,让 window 真的能滚(组件读的就是它)。卸载时原样还原。
  React.useEffect(() => {
    const de = document.documentElement
    const body = document.body
    const stage = document.getElementById('stage')
    const saved = [
      [de, de.style.cssText],
      [body, body.style.cssText],
      ...(stage ? [[stage, stage.style.cssText]] : []),
    ]
    de.style.height = 'auto'
    body.style.height = 'auto'
    body.style.overflow = 'visible'
    if (stage) stage.style.height = 'auto'

    // 跟外面的详情页打两个招呼(两个都是 demo 侧的约定,见 Detail.jsx / demo.css):
    // ① data-fit —— 别按内容自动撑高,钉死 600。
    //    这个演示台用 vh 排版又必须让文档能滚,自动撑高会变成正反馈:
    //    框越高 → vh 越大 → 内容越高 → 框再长高,一路顶到上限,
    //    结果是一个 1250px 高的框里露出 4817px 文档的顶上一小片,又大又空。
    // ② data-scrollbar —— 把滚动条放出来。
    //    别处藏滚动条是对的,但这一件「能滚」就是它要演的东西,那条杠是主角之一。
    de.dataset.fit = '600'
    de.dataset.scrollbar = 'show'

    return () => {
      saved.forEach(([el, css]) => {
        el.style.cssText = css
      })
      delete de.dataset.fit
      delete de.dataset.scrollbar
      window.scrollTo(0, 0)
    }
  }, [])

  // ② 演示台驱动滚动(缩略图点不进去,不能等人来滚);用户一动就放手。
  React.useEffect(() => {
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const span = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

    if (calm) {
      const id = window.setTimeout(() => window.scrollTo(0, span() * 0.34), 60)
      setDriving(false)
      return () => clearTimeout(id)
    }

    let raf = 0
    let live = true
    const t0 = performance.now()
    const PERIOD = 15000
    const DOWN = 0.64 // 下行占一轮的比例,回程稍快
    const smooth = (x) => x * x * (3 - 2 * x)

    const tick = (now) => {
      if (!live) return
      const p = ((now - t0) % PERIOD) / PERIOD
      const tri = p < DOWN ? p / DOWN : 1 - (p - DOWN) / (1 - DOWN)
      window.scrollTo(0, smooth(tri) * span())
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const release = () => {
      if (!live) return
      live = false
      cancelAnimationFrame(raf)
      setDriving(false)
    }
    const opts = { passive: true }
    const evts = ['wheel', 'touchstart', 'keydown', 'pointerdown']
    evts.forEach((e) => window.addEventListener(e, release, opts))
    return () => {
      live = false
      cancelAnimationFrame(raf)
      evts.forEach((e) => window.removeEventListener(e, release, opts))
    }
  }, [])

  // ③ 读数:不另算进度,直接把组件那条线的 scaleX 读回来。
  React.useEffect(() => {
    let raf = 0
    let v = 0
    const tick = () => {
      v = readScaleX(barWrap.current?.firstElementChild, v)
      const pct = Math.round(Math.min(1, Math.max(0, v)) * 100)
      if (pctRef.current) pctRef.current.textContent = pct + '%'
      if (fillRef.current) fillRef.current.style.width = pct + '%'
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const page = pathname === '/2' ? '第二页' : '第一页'

  return (
    <>
      {/* 组件本体。外面套一层 span 只为拿到它的 DOM 读 scaleX,不影响 fixed 定位。 */}
      <span ref={barWrap}>
        <ScrollProgress />
      </span>
      {/* 轨道:2px 的线在缩略图里只剩 0.8px,给它一条底衬好让眼睛找得到位置 */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          insetInline: 0,
          top: 0,
          height: 2,
          zIndex: 59,
          background: 'rgba(55, 194, 186, 0.13)',
        }}
      />

      {/* 读数:缩略图里唯一读得清的东西 */}
      <div style={{ ...panel, top: 20, left: 20, minWidth: 186 }}>
        <div className="lbl" style={{ textAlign: 'left', marginBottom: 6 }}>
          scroll progress · scaleX
        </div>
        <div
          ref={pctRef}
          style={{
            fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
            fontSize: 30,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--color-ink, #f2f5f6)',
          }}
        >
          0%
        </div>
        <div
          style={{
            marginTop: 10,
            height: 3,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.09)',
            overflow: 'hidden',
          }}
        >
          <div
            ref={fillRef}
            style={{
              height: '100%',
              width: '0%',
              background: 'var(--color-accent, #37c2ba)',
            }}
          />
        </div>
        <div
          style={{
            marginTop: 9,
            fontSize: 11,
            lineHeight: 1.55,
            color: 'var(--color-ink-faint, #7e868c)',
          }}
        >
          顶缘那条 teal 细线就是组件本体;
          <br />
          这里的数字是把它的 scaleX 读回来。
        </div>
      </div>

      {/* 滚动管理:换页回顶 / 带 hash 定位 */}
      <div style={{ ...panel, left: 20, bottom: 20, maxWidth: 268 }}>
        <div className="lbl" style={{ textAlign: 'left', marginBottom: 7 }}>
          scroll manager · {page}
          {hash || ''}
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <button
            style={btn}
            onClick={() => navigate(pathname === '/2' ? '/1' : '/2')}
          >
            换一页
          </button>
          <button style={btn} onClick={() => navigate(pathname + '#endnote')}>
            跳到 #endnote
          </button>
        </div>
        <div
          style={{
            marginTop: 9,
            fontSize: 11,
            lineHeight: 1.6,
            color: 'var(--color-ink-faint, #7e868c)',
          }}
        >
          换页 → 瞬时回顶;带 hash → 定位到目标并守住 6 秒,防止晚到的内容把它顶偏。
          <br />
          {driving
            ? '演示台正在自动滚 —— 你一动它就让开。'
            : '已经交给你了,滚滚看那条线。'}
        </div>
      </div>

      <RippleStage pad={false} scroll={false} height="auto">
        {/* 居中而不是靠左:左上角那块读数面板是 fixed 的,靠左排的话正文会从它底下穿过去 */}
          <div style={{ padding: '64px 8% 96px', maxWidth: 640, margin: '0 auto' }}>
          <div className="lbl" style={{ textAlign: 'left', marginBottom: 10 }}>
            ripple · 异常检测手记 / {page}
          </div>
          {SECTIONS.map(([h, p]) => (
            <section key={h} style={{ minHeight: 148, marginBottom: 20 }}>
              <h3
                style={{
                  margin: '0 0 10px',
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  color: 'var(--color-ink, #f2f5f6)',
                  opacity: 0.72,
                }}
              >
                {h}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.95,
                  color: 'var(--color-ink-muted, #9aa1a6)',
                  opacity: 0.62,
                }}
              >
                {p}
              </p>
            </section>
          ))}
          {/* scroll-margin-top 是给 ScrollManager 的校正用的,见组件注释 */}
          <section id="endnote" style={{ scrollMarginTop: 96, minHeight: 160 }}>
            <h3
              style={{
                margin: '0 0 10px',
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--color-accent, #37c2ba)',
                opacity: 0.85,
              }}
            >
              尾注 · #endnote
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.95,
                color: 'var(--color-ink-muted, #9aa1a6)',
                opacity: 0.62,
              }}
            >
              这一节带 scroll-margin-top: 96px。ScrollManager 校正时按它比对,
              所以停稳后目标离顶是 96 而不是 0 —— 不这么算的话会来回抽。
            </p>
          </section>
        </div>
      </RippleStage>
    </>
  )
}

export default function Demo() {
  // ScrollManager 吃 useLocation,得有 Router;演示台不需要地址栏,用 MemoryRouter。
  return (
    <MemoryRouter initialEntries={['/1']}>
      <ScrollManager />
      <Page />
    </MemoryRouter>
  )
}
