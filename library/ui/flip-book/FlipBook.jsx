import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { clamp, fold, nearestCorner } from './lib/fold.js'
import { derivePageRatio, flatten, pageToSpread, paginate, spreadToPage } from './lib/paginate.js'
import './FlipBook.css'

// progress = 拖拽距离 / 2W,所以 0.25 对应「横着拖过半个页宽」就翻页。
// 之前设 0.35 要拖过 0.7 个页宽,手感明显偏重。
const COMPLETE_AT = 0.25
// 快速轻扫:位移不够但甩得快,也该翻过去(提示语里写了 SWIPE)。
const FLICK_SPEED = 0.45 // px/ms,约合 450px/s
// 光看速度不够 —— 鼠标手抖那一下速度也很高。必须同时拖出一段实打实的距离:
// 0.09 的 progress ≈ 页宽的 18%,手机上随便一划都不止,但抖一下到不了。
const FLICK_MIN_PROGRESS = 0.09

export default function FlipBook({
  images = [],
  pageRatio = 'auto',
  spreadThreshold,
  singlePageBelow = 640,
  page,
  onPageChange,
  fit = 'contain',
  backFace = 'content',
  showControls = true,
  hint = 'DRAG, SWIPE, OR USE ARROW KEYS',
  className = '',
}) {
  const rootRef = useRef(null)
  const bookRef = useRef(null)
  const nextRefs = useRef({})
  const prevRefs = useRef({})

  const [sized, setSized] = useState(null)
  const [single, setSingle] = useState(false)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [index, setIndex] = useState(0)

  // 调用方十有八九会内联写 images={[...]},每次渲染都是新数组。
  // 直接把它当依赖会 effect → setState → effect 转不停,所以按内容取键。
  const items = useMemo(
    () => images.map((it) => (typeof it === 'string' ? { src: it } : { ...it })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images.map((it) => (typeof it === 'string' ? it : `${it.src}#${it.spread}`)).join('|')],
  )

  // ── 图片尺寸:挂载前只创建 Image 读 naturalSize,不渲染 ──────────────
  // 尺寸表齐了才排页,否则会先按错的比例排一次、加载完再跳一次。
  useEffect(() => {
    let cancelled = false
    if (items.length === 0) {
      setSized([])
      return
    }
    Promise.all(
      items.map(
        (it) =>
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve({ ...it, w: img.naturalWidth, h: img.naturalHeight })
            img.onerror = () => resolve({ ...it, w: 0, h: 0 })
            img.src = it.src
          }),
      ),
    ).then((list) => {
      if (!cancelled) setSized(list)
    })
    return () => {
      cancelled = true
    }
  }, [items])

  // 页面比例:给了数就用,没给就从这批图自己推出来
  const ratio = useMemo(
    () => (typeof pageRatio === 'number' ? pageRatio : sized ? derivePageRatio(sized) : 0.7),
    [pageRatio, sized],
  )

  const spreads = useMemo(
    () => (sized ? paginate(sized, { pageRatio: ratio, threshold: spreadThreshold }) : []),
    [sized, ratio, spreadThreshold],
  )
  const pages = useMemo(() => flatten(spreads), [spreads])
  const s2p = useMemo(() => spreadToPage(spreads), [spreads])
  const p2s = useMemo(() => pageToSpread(spreads), [spreads])

  const views = useMemo(
    () => (single ? pages.map((p) => ({ left: p, right: null })) : spreads),
    [single, pages, spreads],
  )
  const total = views.length

  // ── 容器宽度决定单页还是双页 ────────────────────────────────────────
  // 看容器不看视口 —— 这组件可能被塞进任意宽度的格子里。
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    // 先同步量一次:ResizeObserver 的首帧回调要等一帧渲染,
    // 空等会让书本以 0 尺寸挂载一帧,有些环境里那一帧永远不来。
    const apply = (width, height) => {
      setSingle(width < singlePageBelow)
      setBox({ w: width, h: height })
    }
    const r0 = el.getBoundingClientRect()
    apply(r0.width, r0.height)

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      apply(width, height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [singlePageBelow])

  // 模式切换时按映射把位置带过去,不要跳回第一页
  const prevSingle = useRef(single)
  useEffect(() => {
    if (prevSingle.current === single) return
    setIndex((i) => (single ? s2p[i] ?? 0 : p2s[i] ?? 0))
    prevSingle.current = single
  }, [single, s2p, p2s])

  // 受控页码
  useEffect(() => {
    if (typeof page === 'number') setIndex(clamp(page, 0, Math.max(0, total - 1)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // ── 书本尺寸:在容器里 contain ───────────────────────────────────────
  const geom = useMemo(() => {
    const pad = 28
    const availW = Math.max(0, box.w - pad * 2)
    const availH = Math.max(0, box.h - pad * 2 - (showControls ? 64 : 0))
    const targetRatio = single ? ratio : ratio * 2
    if (availW <= 0 || availH <= 0) return { bookW: 0, bookH: 0, pageW: 0, pageH: 0 }
    let bookW = availW
    let bookH = bookW / targetRatio
    if (bookH > availH) {
      bookH = availH
      bookW = bookH * targetRatio
    }
    return { bookW, bookH, pageW: single ? bookW : bookW / 2, pageH: bookH }
  }, [box, single, ratio, showControls])

  // ── 翻页运行时状态 —— 全部走 ref,一帧都不过 React ────────────────
  const run = useRef({
    phase: 'idle',
    kind: null,
    corner: null,
    start: null,
    rect: null,
    raf: 0,
    progress: 0,
    vx: 0,
    lastX: 0,
    lastT: 0,
  })

  const refsFor = (kind) => (kind === 'next' ? nextRefs.current : prevRefs.current)

  const paint = useCallback(
    (kind, pointer) => {
      const r = refsFor(kind)
      if (!r.back) return null
      const { pageW, pageH } = geom
      const res = fold({
        width: pageW,
        height: pageH,
        corner: run.current.corner,
        pointer,
        spineX: kind === 'next' ? 0 : pageW,
      })
      run.current.progress = res.progress

      r.front.style.clipPath = res.clipRemain || 'none'
      r.back.style.clipPath = res.clipLifted
      r.back.style.transform = res.matrix
      if (r.backShade) r.backShade.style.backgroundImage = res.shadowLifted
      r.backWrap.style.opacity = res.distance > 0.5 ? '1' : '0'
      return res
    },
    [geom],
  )

  const resetLayers = useCallback((kind) => {
    const r = refsFor(kind)
    if (!r.back) return
    r.front.style.clipPath = 'none'
    r.back.style.clipPath = 'polygon(0px 0px, 0px 0px, 0px 0px)'
    r.back.style.transform = 'matrix(1, 0, 0, 1, 0, 0)'
    r.backWrap.style.opacity = '0'
    r.root.style.zIndex = ''
    if (r.backShade) r.backShade.style.backgroundImage = 'none'
  }, [])

  const canTurn = useCallback(
    (kind) => (kind === 'next' ? index < total - 1 : index > 0),
    [index, total],
  )

  // 补完 / 弹回。终点固定在水平方向 —— 纸翻到底时折痕就是书脊,不该还带着斜度。
  const settle = useCallback(
    (kind, from, complete) => {
      const { pageW } = geom
      const corner = run.current.corner
      const to = complete
        ? { x: corner.x + (kind === 'next' ? -2 * pageW : 2 * pageW), y: corner.y }
        : { x: corner.x, y: corner.y }

      const dist = Math.hypot(to.x - from.x, to.y - from.y)
      const dur = clamp(dist * 0.75, 220, 520)
      const t0 = performance.now()
      run.current.phase = 'releasing'

      const step = (now) => {
        const k = clamp((now - t0) / dur, 0, 1)
        const e = 1 - Math.pow(1 - k, 3) // easeOutCubic
        paint(kind, { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e })

        if (k < 1) {
          run.current.raf = requestAnimationFrame(step)
          return
        }

        // 翻完的那一帧:推进页码、换内容、重置变换,必须在同一帧里做完。
        // 拆成两帧就会闪一下旧内容。
        if (complete) {
          const target = index + (kind === 'next' ? 1 : -1)
          flushSync(() => setIndex(target))
          if (onPageChange) onPageChange(target)
        }
        resetLayers(kind)
        if (single) {
          const other = refsFor(kind === 'next' ? 'prev' : 'next')
          if (other.root) other.root.style.visibility = ''
        }
        run.current.phase = 'idle'
        run.current.kind = null
      }
      run.current.raf = requestAnimationFrame(step)
    },
    [geom, index, onPageChange, paint, resetLayers, single],
  )

  const beginTurn = useCallback(
    (kind, corner) => {
      run.current.kind = kind
      run.current.corner = corner
      const r = refsFor(kind)
      r.root.style.zIndex = '3'
      // 单页模式下两套翻页区是叠着的,拖谁就得把另一套藏起来,
      // 否则掀开看到的是另一套的 front,不是底下那页。
      if (single) {
        const other = refsFor(kind === 'next' ? 'prev' : 'next')
        if (other.root) other.root.style.visibility = 'hidden'
      }
    },
    [single],
  )

  // ── 指针 ────────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e) => {
      if (run.current.phase !== 'idle') return
      const { pageW, pageH, bookW } = geom
      if (!pageW) return
      const bookRect = bookRef.current.getBoundingClientRect()
      const localX = e.clientX - bookRect.left
      const kind = localX > bookW / 2 ? 'next' : 'prev'
      if (!canTurn(kind)) return

      const r = refsFor(kind)
      const rect = r.root.getBoundingClientRect()
      const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const corner = nearestCorner(pageW, pageH, kind === 'next' ? 0 : pageW, pt)

      run.current.phase = 'dragging'
      run.current.rect = rect
      run.current.start = pt
      run.current.vx = 0
      run.current.lastX = e.clientX
      run.current.lastT = e.timeStamp
      beginTurn(kind, corner)
      bookRef.current.setPointerCapture(e.pointerId)
      paint(kind, corner) // 按下瞬间纸不动
    },
    [beginTurn, canTurn, geom, paint],
  )

  const onPointerMove = useCallback(
    (e) => {
      if (run.current.phase !== 'dragging') return
      const { rect, start, corner, kind } = run.current
      // 抓取角跟着手指走,但保留按下瞬间的相对位置 ——
      // 否则从页面正中按下,纸会立刻弹起一大块。
      const dx = e.clientX - rect.left - start.x
      const dy = e.clientY - rect.top - start.y
      const dt = Math.max(1, e.timeStamp - run.current.lastT)
      run.current.vx = (e.clientX - run.current.lastX) / dt
      run.current.lastX = e.clientX
      run.current.lastT = e.timeStamp
      if (run.current.raf) cancelAnimationFrame(run.current.raf)
      run.current.raf = requestAnimationFrame(() =>
        paint(kind, { x: corner.x + dx, y: corner.y + dy }),
      )
    },
    [paint],
  )

  const onPointerUp = useCallback(
    (e) => {
      if (run.current.phase !== 'dragging') return
      const { rect, start, corner, kind } = run.current
      if (run.current.raf) cancelAnimationFrame(run.current.raf)
      const dx = e.clientX - rect.left - start.x
      const dy = e.clientY - rect.top - start.y
      const from = { x: corner.x + dx, y: corner.y + dy }
      // 朝书脊方向甩得够快,就算距离不够也翻过去
      const toSpine = kind === 'next' ? -1 : 1
      const flick =
        toSpine * run.current.vx > FLICK_SPEED && run.current.progress > FLICK_MIN_PROGRESS
      settle(kind, from, flick || run.current.progress > COMPLETE_AT)
    },
    [settle],
  )

  // ── 键盘 / 按钮:喂一个虚拟指针,渲染代码完全复用 ──────────────────
  const turn = useCallback(
    (kind) => {
      if (run.current.phase !== 'idle' || !canTurn(kind)) return
      const { pageW } = geom
      if (!pageW) return
      const corner = { x: kind === 'next' ? pageW : 0, y: 0 }
      beginTurn(kind, corner)
      settle(kind, corner, true)
    },
    [beginTurn, canTurn, geom, settle],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') turn('next')
      else if (e.key === 'ArrowLeft') turn('prev')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turn])

  useEffect(() => () => cancelAnimationFrame(run.current.raf), [])

  // ── 渲染 ────────────────────────────────────────────────────────────
  const { bookW, bookH, pageW, pageH } = geom
  const view = views[index] || { left: null, right: null }
  const nextView = views[index + 1] || { left: null, right: null }
  const prevView = views[index - 1] || { left: null, right: null }

  // 每一套翻页区的三层。back 是「手里那张纸的背面」——
  // 单页模式下纸背没有对应内容,走纸纹。
  const zones = single
    ? {
        next: { under: nextView.left, front: view.left, back: null },
        prev: { under: prevView.left, front: view.left, back: null },
      }
    : {
        next: { under: nextView.right, front: view.right, back: nextView.left },
        prev: { under: prevView.left, front: view.left, back: prevView.right },
      }

  const face = (f) => {
    if (!f) return null
    if (f.part === 'full') {
      return <img className="fb-img" src={f.src} alt={f.alt} draggable="false" />
    }
    return (
      <div
        className="fb-spread"
        style={{ width: pageW * 2, height: pageH, left: f.part === 'left' ? 0 : -pageW }}
      >
        <img className="fb-img" src={f.src} alt={f.alt} draggable="false" />
      </div>
    )
  }

  const renderZone = (kind, refs) => {
    const z = zones[kind]
    const useContent = backFace === 'content' && !single && !!z.back
    return (
      <div
        className={`fb-zone fb-zone-${kind}`}
        ref={(el) => (refs.current.root = el)}
        style={{ width: pageW, height: pageH, left: single ? 0 : kind === 'next' ? pageW : 0 }}
      >
        <div className="fb-layer fb-under" ref={(el) => (refs.current.under = el)}>
          {face(z.under)}
        </div>
        <div className="fb-layer fb-front" ref={(el) => (refs.current.front = el)}>
          {face(z.front)}
        </div>
        <div className="fb-back-wrap" ref={(el) => (refs.current.backWrap = el)}>
          <div
            className={`fb-layer fb-back${useContent ? '' : ' fb-back-paper'}`}
            ref={(el) => (refs.current.back = el)}
          >
            {/* 内容印在纸背上,所以先反镜像一次 —— 反射矩阵会再镜像一次,两次抵消 */}
            {useContent && <div className="fb-mirror">{face(z.back)}</div>}
            <div className="fb-shade" ref={(el) => (refs.current.backShade = el)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`fb ${className}`} ref={rootRef} data-fit={fit}>
      <div
        className="fb-book"
        ref={bookRef}
        style={{ width: bookW || 0, height: bookH || 0 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {pageW > 0 && sized && (
          <>
            {renderZone('prev', prevRefs)}
            {renderZone('next', nextRefs)}
            {!single && <div className="fb-gutter" />}
          </>
        )}
      </div>

      {showControls && total > 0 && (
        <div className="fb-controls">
          <button
            className="fb-arrow"
            onClick={() => turn('prev')}
            disabled={index === 0}
            aria-label="上一页"
          >
            &lsaquo;
          </button>
          <div className="fb-meta">
            <div className="fb-counter">
              {pad(index + 1)} / {pad(total)}
            </div>
            {hint && <div className="fb-hint">{hint}</div>}
          </div>
          <button
            className="fb-arrow"
            onClick={() => turn('next')}
            disabled={index >= total - 1}
            aria-label="下一页"
          >
            &rsaquo;
          </button>
        </div>
      )}
    </div>
  )
}

function pad(n) {
  return String(n).padStart(2, '0')
}
