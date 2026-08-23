import { computeDelays } from './timing.js'
import './wall2d.css'

// 2D 版翻板墙:纯 DOM + CSS,不碰 WebGL。
//
// timing.js 是本目录自带的一份 —— 和 3D 版同一套算法,2026-08-21 起解耦各自维护。
// 这个目录不再 import 3D 版的任何文件,连同 config.js 可以整目录单独拿走。
//
// 周期驱动用 setTimeout 而不是每帧回调:动画由 CSS 自己跑,
// JS 每个周期只做一次 classList.toggle。

const EASE_CSS = {
  inOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  outBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  inOutQuint: 'cubic-bezier(0.83, 0, 0.17, 1)',
  linear: 'linear',
}

const MODE_CLASS = {
  flip3d: 'wall2d--flip3d',
  scaley: 'wall2d--scaley',
  fade: 'wall2d--fade',
}

export class Wall2D {
  // sources: 图片播放列表。给 3 张以上就循环轮播,只给两张(或 srcA/srcB)就是来回翻。
  constructor({ config, root, srcA, srcB, sources }) {
    this.config = config
    this.root = root

    this.playlist = (Array.isArray(sources) && sources.length ? sources : [srcA, srcB]).filter(Boolean)
    this.cursor = 0 // 当前露在外面的是 playlist 里的第几张
    this.srcA = this.playlist[0]
    this.srcB = this.playlist[1] ?? this.playlist[0]

    this.cells = []
    this.flipped = false
    this.visible = false
    this.timer = null
    this.advanceTimer = null
    this.seed = config.flip.seed

    // 基础类由组件自己挂,不指望外面的 HTML 写对
    this.root.classList.add('wall2d')

    this.resizeObserver = new ResizeObserver(() => this.syncGap())
    this.resizeObserver.observe(this.root)

    this.build()
  }

  build() {
    const { cols, rows } = this.config.grid

    this.root.textContent = ''
    this.cells = []

    const frag = document.createDocumentFragment()

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div')
        cell.className = 'w2-cell'

        // 每格取源图的哪一块。和 3D 版的 UV 偏移是同一件事,
        // 换成 background-position 的写法而已,同样不用真的切图。
        const px = cols > 1 ? (c / (cols - 1)) * 100 : 0
        const py = rows > 1 ? (r / (rows - 1)) * 100 : 0
        cell.style.setProperty('--bgpos', `${px.toFixed(4)}% ${py.toFixed(4)}%`)

        const front = document.createElement('div')
        front.className = 'w2-face w2-face--front'
        const back = document.createElement('div')
        back.className = 'w2-face w2-face--back'

        cell.append(front, back)
        frag.append(cell)
        this.cells.push(cell)
      }
    }

    this.root.append(frag)
    this.syncStyle()
    this.applyDelays()
  }

  applyDelays() {
    const { cols, rows } = this.config.grid
    const { mode, spread, jitter } = this.config.flip
    const delays = computeDelays({ cols, rows, mode, spread, jitter, seed: this.seed })

    for (let r = 0; r < rows; r++) {
      // timing 里 row 0 在底部(跟着纹理 v 轴),DOM 里第一行在顶部。
      // 这里翻过来,两版的时序方向才看得出是同一个。
      const timingRow = rows - 1 - r
      for (let c = 0; c < cols; c++) {
        this.cells[r * cols + c].style.setProperty('--d', `${delays[timingRow * cols + c].toFixed(3)}s`)
      }
    }
  }

  /** 格缝宽度按 3D 版的比例换算成 px,两版的疏密才对得上 */
  syncGap() {
    const { cols } = this.config.grid
    const { size, gap } = this.config.panel
    const width = this.root.clientWidth
    if (!width) return
    const cellPx = width / cols
    this.root.style.setProperty('--gap', `${Math.max(1, cellPx * (gap / size)).toFixed(2)}px`)
  }

  syncStyle() {
    const { cols, rows } = this.config.grid
    const { duration, ease } = this.config.flip
    const { flip2d, dim, perspective } = this.config.render

    const s = this.root.style
    s.setProperty('--cols', cols)
    s.setProperty('--rows', rows)
    s.setProperty('--aspect', (cols / rows).toFixed(5))
    s.setProperty('--dur', `${duration}s`)
    s.setProperty('--ease', EASE_CSS[ease] ?? EASE_CSS.inOutCubic)
    s.setProperty('--dim', dim)
    s.setProperty('--perspective', `${perspective}px`)
    s.setProperty('--src-a', `url("${this.srcA}")`)
    s.setProperty('--src-b', `url("${this.srcB}")`)

    for (const cls of Object.values(MODE_CLASS)) this.root.classList.remove(cls)
    this.root.classList.add(MODE_CLASS[flip2d] ?? MODE_CLASS.scaley)

    this.syncGap()
  }

  /** 换图。传数组 = 换整个播放列表;传两个参数 = 老的 A/B 用法。 */
  setSources(srcA, srcB) {
    clearTimeout(this.advanceTimer)
    this.playlist = (Array.isArray(srcA) ? srcA : [srcA, srcB]).filter(Boolean)
    this.cursor = 0
    this.flipped = false
    this.root.classList.remove('is-flipped')
    this.srcA = this.playlist[0]
    this.srcB = this.playlist[1] ?? this.playlist[0]
    this.root.style.setProperty('--src-a', `url("${this.srcA}")`)
    this.root.style.setProperty('--src-b', `url("${this.srcB}")`)
  }

  retime() {
    this.seed = this.config.flip.seed
    this.applyDelays()
  }

  tick() {
    this.flipped = !this.flipped
    this.root.classList.toggle('is-flipped', this.flipped)

    if (this.playlist.length > 2) {
      this.cursor = (this.cursor + 1) % this.playlist.length
      this.queueAdvance()
    }

    if (this.config.flip.reseedEachCycle) {
      this.seed = (this.seed + 1) | 0
      this.applyDelays()
    }

    this.schedule()
  }

  /** 轮播:把背面那张换成下一张。
   *  必须等这一轮翻转整个走完再换 —— 翻到一半时"背面"正在展开,提前换会被看见。 */
  queueAdvance() {
    clearTimeout(this.advanceTimer)
    const { spread, duration } = this.config.flip
    const next = this.playlist[(this.cursor + 1) % this.playlist.length]
    const hiddenVar = this.flipped ? '--src-a' : '--src-b'
    this.advanceTimer = setTimeout(
      () => this.root.style.setProperty(hiddenVar, `url("${next}")`),
      (spread + duration) * 1000 + 120,
    )
  }

  /** first=true 用 startDelay(配了的话)—— 落地就能看见在翻,不用干等一整个周期 */
  schedule(first = false) {
    clearTimeout(this.timer)
    if (!this.visible || !this.config.flip.playing) return
    const { spread, duration, hold, startDelay } = this.config.flip
    const wait = first && startDelay != null ? startDelay : spread + duration + hold
    this.timer = setTimeout(() => this.tick(), wait * 1000)
  }

  flipNow() {
    this.tick()
  }

  show() {
    this.visible = true
    this.root.hidden = false
    this.syncGap()
    this.schedule(true)
  }

  hide() {
    this.visible = false
    this.root.hidden = true
    clearTimeout(this.timer)
    clearTimeout(this.advanceTimer)
  }

  dispose() {
    clearTimeout(this.timer)
    clearTimeout(this.advanceTimer)
    this.resizeObserver.disconnect()
    this.root.textContent = ''
  }
}
