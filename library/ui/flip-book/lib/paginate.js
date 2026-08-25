// 图片 → 书页 —— 纯函数模块,不 import 任何东西,不碰 DOM。

/**
 * 「横图铺跨页、竖图占单页」的分界值。
 *
 * 不写死成 1.3 这种魔数 —— 它是从页面比例推出来的:单页比是 pageRatio,
 * 跨页比是它的两倍,分界取两者的几何中项,即 pageRatio × √2。
 * pageRatio = 0.62 时分界是 0.877,落地就是横竖之分,可预测。
 */
export function computeThreshold(pageRatio) {
  return pageRatio * Math.SQRT2
}

/**
 * 让书的比例去适配照片,而不是反过来。
 *
 * 页面比例定死一个数(比如从别人的书上量来的 0.62)几乎一定是错的:
 * 一批 3:4、3:2 的实拍塞进 1:1.6 的页里,contain 就是留白不齐、cover 就是裁掉一大块,
 * 两条路都难看。而这两种难看是同一个根:页不合图。
 *
 * 每张图其实都"想要"一个页面比例 —— 竖图想要自己的比例,横图铺跨页所以想要自己比例的一半。
 * 取全部图这个诉求的几何平均,就是对这批图整体损失最小的页面比例。
 *
 * 分类本身要用到页面比例(见 computeThreshold),所以先用 1.0 自举一次再迭代几轮,
 * 很快就不动了。
 */
export function derivePageRatio(items, { min = 0.5, max = 0.95, fallback = 0.7 } = {}) {
  const ratios = items.filter((it) => it.w > 0 && it.h > 0).map((it) => it.w / it.h)
  if (ratios.length === 0) return fallback

  let threshold = 1
  let ratio = fallback
  for (let i = 0; i < 4; i++) {
    // 横图铺跨页(宽是页的两倍),所以它想要的页面比例是自己的一半
    const wants = ratios.map((r) => (r >= threshold ? r / 2 : r))
    const mean = wants.reduce((a, r) => a + Math.log(r), 0) / wants.length
    const next = Math.min(max, Math.max(min, Math.exp(mean)))
    if (Math.abs(next - ratio) < 1e-6) break
    ratio = next
    threshold = computeThreshold(ratio)
  }
  return ratio
}

/** 单张图判跨页还是单页。显式写了 spread 就听显式的。 */
export function classify(item, threshold) {
  if (typeof item.spread === 'boolean') return item.spread ? 'spread' : 'single'
  if (!item.w || !item.h) return 'single'
  return item.w / item.h >= threshold ? 'spread' : 'single'
}

function face(item, part) {
  return { src: item.src, alt: item.alt || '', part }
}

/**
 * 排成跨页列表。
 * 跨页图独占一个展开面(左右各半张),单页图两两配对,落单的右侧留白页。
 */
export function paginate(items, { pageRatio = 0.62, threshold } = {}) {
  const th = threshold == null ? computeThreshold(pageRatio) : threshold
  const spreads = []
  let pending = null

  const flushPending = () => {
    if (pending) {
      spreads.push({ left: face(pending, 'full'), right: null })
      pending = null
    }
  }

  for (const item of items) {
    if (classify(item, th) === 'spread') {
      flushPending()
      spreads.push({ left: face(item, 'left'), right: face(item, 'right') })
    } else if (pending) {
      spreads.push({ left: face(pending, 'full'), right: face(item, 'full') })
      pending = null
    } else {
      pending = item
    }
  }
  flushPending()

  return spreads
}

/**
 * 窄屏用的单页列表:把每个展开面摊成一到两页,空白页丢掉。
 * 跨页图在这里被拆成左半、右半两屏 —— 构图完整,只是分两次看。
 */
export function flatten(spreads) {
  const pages = []
  for (const s of spreads) {
    if (s.left) pages.push(s.left)
    if (s.right) pages.push(s.right)
  }
  return pages
}

/** 展开面序号 → 单页序号,窄屏切换时用来保住当前位置。 */
export function spreadToPage(spreads) {
  const map = []
  let n = 0
  for (const s of spreads) {
    map.push(n)
    if (s.left) n++
    if (s.right) n++
  }
  return map
}

/** 单页序号 → 展开面序号,反向切换时用。 */
export function pageToSpread(spreads) {
  const map = []
  spreads.forEach((s, i) => {
    if (s.left) map.push(i)
    if (s.right) map.push(i)
  })
  return map
}
