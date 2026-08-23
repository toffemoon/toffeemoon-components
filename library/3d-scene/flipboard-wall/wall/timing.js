// 时序引擎。
//
// 这是整个 demo 里最值得反复调的部分,所以做成纯函数:
// 输入格子坐标,输出 0..1 的归一化延迟,不碰 three.js、不碰 DOM。
// 想加新节奏,在 MODES 里加一条就行。

/** 确定性哈希,保证同一个 seed 下每次刷新的随机分布一致 */
function hash(x, y, seed) {
  let h = Math.imul(x + 374761393, 1274126177)
  h ^= Math.imul(y + 668265263, 2246822519)
  h ^= Math.imul(seed + 1, 3266489917)
  h = Math.imul(h ^ (h >>> 15), 2246822519)
  h ^= h >>> 13
  return (h >>> 0) / 4294967295
}

/** 每个模式返回 0..1;0 = 第一批翻,1 = 最后一批翻。
 *  键是英文 identifier —— config.flip.mode 和控制面板按这些名字选模式,中文名在各条注释里 */
export const MODES = {
  /** 随机 —— 纯随机:最接近视频里那种"乱"的观感 */
  random: (col, row, cols, rows, seed) => hash(col, row, seed),

  /** 对角波浪 —— 从左下角推到右上角,最容易看出"波"的方向 */
  diagonal: (col, row, cols, rows) => {
    const span = cols - 1 + (rows - 1) || 1
    return (col + row) / span
  },

  /** 中心扩散 —— 从正中间往四周炸开 */
  'center-out': (col, row, cols, rows) => {
    const cx = (cols - 1) / 2
    const cy = (rows - 1) / 2
    const d = Math.hypot(col - cx, row - cy)
    const max = Math.hypot(cx, cy) || 1
    return d / max
  },

  /** 中心收拢 —— 从四周往中间收 */
  'center-in': (col, row, cols, rows) => 1 - MODES['center-out'](col, row, cols, rows),

  /** 列扫 —— 一列一列翻,最规整 */
  'col-sweep': (col, _row, cols) => col / (cols - 1 || 1),

  /** 行扫 —— 一行一行翻 */
  'row-sweep': (_col, row, _cols, rows) => row / (rows - 1 || 1),

  /** 分组批次 —— 随机分成若干批,批内同时翻——比纯随机更有"节拍" */
  batch: (col, row, cols, rows, seed) => {
    const batches = 6
    const b = Math.floor(hash(col, row, seed) * batches)
    return b / (batches - 1)
  },

  /** 涟漪 —— 从中心出发的多道同心波 */
  ripple: (col, row, cols, rows) => {
    const d = MODES['center-out'](col, row, cols, rows)
    return (Math.sin(d * Math.PI * 3) * 0.5 + 0.5) * 0.6 + d * 0.4
  },
}

export const MODE_NAMES = Object.keys(MODES)

/**
 * 为整面墙算出每格的延迟(秒)。
 *
 * @returns {Float32Array} 长度 cols*rows,索引 = row * cols + col
 */
export function computeDelays({ cols, rows, mode, spread, jitter, seed }) {
  const fn = MODES[mode] ?? MODES.random
  const out = new Float32Array(cols * rows)
  const j = Math.min(Math.max(jitter, 0), 1)

  let min = Infinity
  let max = -Infinity

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const base = fn(col, row, cols, rows, seed)
      const noise = hash(col * 7 + 13, row * 11 + 5, seed)
      const v = base * (1 - j) + noise * j
      out[row * cols + col] = v
      if (v < min) min = v
      if (v > max) max = v
    }
  }

  // 归一化后再乘 spread,保证不管哪个模式,第一格都在 0、最后一格都在 spread。
  // 不做这步的话,换模式时整体节奏长度会飘。
  const range = max - min || 1
  for (let i = 0; i < out.length; i++) {
    out[i] = ((out[i] - min) / range) * spread
  }

  return out
}
