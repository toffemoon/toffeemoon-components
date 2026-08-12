import * as THREE from 'three'

// 占位纹理:程序生成,零素材依赖就能跑起来。
//
// 两张图刻意做成强对比的两种状态,和现场那面墙一样:
//   A = 花花绿绿的画面拼贴
//   B = 规整的文字阵列
// 对比越强,翻转的观感越明显,调时序的时候才看得清。
//
// 换成自己的图:把两张同比例的图丢进 public/,命名 a.jpg 和 b.jpg,刷新即可。

function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822519) + 374761393) >>> 0
    s = (s << 13) | (s >>> 19)
    return (s >>> 0) / 4294967295
  }
}

const PALETTE = ['#2fb8bf', '#f5c518', '#b9a3d6', '#e8a87c', '#e63329', '#1c2b3a', '#f27a9c']

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width)
  canvas.height = Math.round(height)
  return canvas
}

/** A 面:彩色画面拼贴 */
function paintCollage(ctx, w, h, seed) {
  const rnd = makeRng(seed)

  ctx.fillStyle = '#ddd6c9'
  ctx.fillRect(0, 0, w, h)

  // 先铺几块跨多格的大色面。这一步决定了整墙"是一幅画"而不是一堆碎片——
  // 色块必须明显大于单格,翻转时才看得出整体在换画面。
  for (let i = 0; i < 9; i++) {
    const bw = (0.22 + rnd() * 0.3) * w
    const bh = (0.28 + rnd() * 0.42) * h
    ctx.save()
    ctx.translate(rnd() * w, rnd() * h)
    ctx.rotate((rnd() - 0.5) * 0.35)
    ctx.fillStyle = PALETTE[Math.floor(rnd() * PALETTE.length)]
    ctx.globalAlpha = 0.92
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh)
    ctx.restore()
  }

  // 几块深色压暗,给画面拉出明暗层次,不然一片高亮糊成白板
  for (let i = 0; i < 5; i++) {
    ctx.save()
    ctx.translate(rnd() * w, rnd() * h)
    ctx.rotate((rnd() - 0.5) * 0.4)
    ctx.fillStyle = '#141d2b'
    ctx.globalAlpha = 0.85
    const bw = (0.12 + rnd() * 0.22) * w
    const bh = (0.16 + rnd() * 0.3) * h
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh)
    ctx.restore()
  }

  // 再叠中小色块做细节
  for (let i = 0; i < 30; i++) {
    const bw = (0.05 + rnd() * 0.16) * w
    const bh = (0.06 + rnd() * 0.2) * h
    ctx.save()
    ctx.translate(rnd() * w, rnd() * h)
    ctx.rotate((rnd() - 0.5) * 0.6)
    ctx.fillStyle = PALETTE[Math.floor(rnd() * PALETTE.length)]
    ctx.globalAlpha = 0.7 + rnd() * 0.3
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh)
    ctx.restore()
  }
  ctx.globalAlpha = 1

  // 斜条纹区块
  for (let i = 0; i < 8; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const bw = (0.12 + rnd() * 0.2) * w
    const bh = (0.15 + rnd() * 0.3) * h
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, bw, bh)
    ctx.clip()
    ctx.strokeStyle = PALETTE[Math.floor(rnd() * PALETTE.length)]
    ctx.lineWidth = 6 + rnd() * 10
    for (let k = -bh; k < bw + bh; k += 26) {
      ctx.beginPath()
      ctx.moveTo(x + k, y)
      ctx.lineTo(x + k + bh, y + bh)
      ctx.stroke()
    }
    ctx.restore()
  }

  // 网点
  for (let i = 0; i < 6; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const r = (0.06 + rnd() * 0.12) * w
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#1a1a1a'
    for (let dy = -r; dy < r; dy += 16) {
      for (let dx = -r; dx < r; dx += 16) {
        ctx.beginPath()
        ctx.arc(x + dx, y + dy, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  // 漫画分格线。少而细,多了会像划痕盖住底下的色面
  ctx.strokeStyle = '#141414'
  for (let i = 0; i < 8; i++) {
    ctx.lineWidth = 3 + rnd() * 6
    ctx.beginPath()
    ctx.moveTo(rnd() * w, rnd() * h)
    ctx.lineTo(rnd() * w, rnd() * h)
    ctx.stroke()
  }

  // 几个大弧线,打破矩形的呆板
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = PALETTE[Math.floor(rnd() * PALETTE.length)]
    ctx.lineWidth = 8 + rnd() * 22
    ctx.beginPath()
    ctx.arc(rnd() * w, rnd() * h, (0.05 + rnd() * 0.25) * w, rnd() * 6.28, rnd() * 6.28 + 2)
    ctx.stroke()
  }
}

/** B 面:文字阵列 */
function paintTypeWall(ctx, w, h, seed) {
  const rnd = makeRng(seed + 99)

  ctx.fillStyle = '#f6f4f1'
  ctx.fillRect(0, 0, w, h)

  const words = [
    { text: 'FLIP', color: '#e01f26', weight: 900 },
    { text: 'WALL', color: '#141414', weight: 900 },
    { text: '翻板墙', color: '#141414', weight: 900 },
    { text: 'DEMO', color: '#e01f26', weight: 700 },
    { text: '三面翻', color: '#e01f26', weight: 900 },
  ]

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const rows = 11
  const cols = 7
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const word = words[Math.floor(rnd() * words.length)]
      const size = (0.035 + rnd() * 0.05) * h
      const x = ((c + 0.5) / cols) * w + (rnd() - 0.5) * (w / cols) * 0.45
      const y = ((r + 0.5) / rows) * h + (rnd() - 0.5) * (h / rows) * 0.45

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((rnd() - 0.5) * 0.12)
      ctx.fillStyle = word.color
      ctx.font = `${word.weight} ${size}px "Arial Black", "Microsoft YaHei", sans-serif`
      ctx.fillText(word.text, 0, 0)

      // 部分文字下加一条红杠,像 JUMP 那个 logo 的处理
      if (rnd() > 0.6) {
        const tw = ctx.measureText(word.text).width
        ctx.fillStyle = '#e01f26'
        ctx.fillRect(-tw / 2, size * 0.55, tw, size * 0.14)
      }
      ctx.restore()
    }
  }

  // 少量纯色块,打断文字的均匀
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#e01f26' : '#141414'
    ctx.globalAlpha = 0.9
    const bw = (0.03 + rnd() * 0.08) * w
    const bh = (0.03 + rnd() * 0.09) * h
    ctx.fillRect(rnd() * w, rnd() * h, bw, bh)
  }
  ctx.globalAlpha = 1
}

function canvasToTexture(canvas, maxAnisotropy) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = maxAnisotropy
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

/** 只生成 canvas。2D 模式要拿它转 URL 喂给 CSS background,不经过 three.js */
export function createPlaceholderCanvases({ aspect, seed = 7 }) {
  const width = 2048
  const height = Math.max(512, Math.round(width / Math.max(aspect, 0.1)))

  const canvasA = createCanvas(width, height)
  paintCollage(canvasA.getContext('2d'), width, height, seed)

  const canvasB = createCanvas(width, height)
  paintTypeWall(canvasB.getContext('2d'), width, height, seed)

  return { canvasA, canvasB }
}

/** 按墙的宽高比生成一对占位纹理 */
export function createPlaceholderTextures({ aspect, maxAnisotropy = 1, seed = 7 }) {
  const { canvasA, canvasB } = createPlaceholderCanvases({ aspect, seed })

  return {
    texA: canvasToTexture(canvasA, maxAnisotropy),
    texB: canvasToTexture(canvasB, maxAnisotropy),
    canvasA,
    canvasB,
    isPlaceholder: true,
  }
}

/** canvas → blob URL。比 toDataURL 省内存,CSS 的 url() 直接能吃 */
export function canvasToObjectURL(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.92)
  })
}

const CANDIDATES = { a: ['a.jpg', 'a.png', 'a.webp'], b: ['b.jpg', 'b.png', 'b.webp'] }

async function findFile(names) {
  for (const name of names) {
    try {
      const res = await fetch(`/${name}`, { method: 'HEAD' })
      const type = res.headers.get('content-type') || ''
      if (res.ok && type.startsWith('image/')) return `/${name}`
    } catch {
      /* 探测失败就当没有 */
    }
  }
  return null
}

function loadTexture(url, maxAnisotropy) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = maxAnisotropy
        resolve(tex)
      },
      undefined,
      reject
    )
  })
}

/**
 * 优先用 public/ 里的 a.* 和 b.*,没有就生成占位图。
 * 两张都齐了才算数,只放一张会被忽略——半套素材的效果比占位图更难看。
 */
export async function loadWallTextures({ aspect, maxAnisotropy = 1, seed = 7 }) {
  const [urlA, urlB] = await Promise.all([findFile(CANDIDATES.a), findFile(CANDIDATES.b)])

  if (urlA && urlB) {
    try {
      const [texA, texB] = await Promise.all([
        loadTexture(urlA, maxAnisotropy),
        loadTexture(urlB, maxAnisotropy),
      ])
      return { texA, texB, isPlaceholder: false, sources: [urlA, urlB] }
    } catch {
      /* 加载失败退回占位图 */
    }
  }

  return createPlaceholderTextures({ aspect, maxAnisotropy, seed })
}
