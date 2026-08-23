import * as THREE from 'three'
import { config } from './config.js'
import { FlipWall } from './wall/index.js'
import { Wall2D } from './wall2d/index.js'
import {
  loadWallTextures,
  createPlaceholderTextures,
  canvasToObjectURL,
} from './textures/placeholder.js'
import { createCamera, applyCameraConfig, createControls } from './scene/camera.js'
import { createEnvironment } from './scene/environment.js'
import { createPostFX } from './scene/postfx.js'
import { createPanel } from './ui/panel.js'

const canvas = document.getElementById('app')
const hud = document.getElementById('hud')
const stats = document.getElementById('stats')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = config.post.exposure

const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

const scene = new THREE.Scene()
scene.background = new THREE.Color(config.look.background)

const camera = createCamera(config, window.innerWidth / window.innerHeight)
const controls = createControls(camera, renderer.domElement, config)

/** 墙的宽高比,占位纹理按这个比例生成,免得内容被拉伸 */
function wallAspect() {
  const { cols, rows } = config.grid
  const { size, gap } = config.panel
  return (cols * size + (cols - 1) * gap) / (rows * size + (rows - 1) * gap)
}

let textureSeed = config.flip.seed
let textures = await loadWallTextures({
  aspect: wallAspect(),
  maxAnisotropy,
  seed: textureSeed,
})

const wall = new FlipWall({ config, texA: textures.texA, texB: textures.texB })
scene.add(wall.group)

let environment = createEnvironment({
  width: wall.layout.width,
  height: wall.layout.height,
  config,
})
scene.add(environment.group)

const postfx = createPostFX({ renderer, scene, camera, config })

// ── 2D 版 ──────────────────────────────────────
// 同一份 config、同一套时序算法(2D 版自带同源的 timing.js 拷贝),只是换了渲染方式。
// 两版并存是为了能直接来回切着比,而不是看两份截图猜差别。

let objectURLs = []

async function resolve2DSources() {
  objectURLs.forEach((u) => URL.revokeObjectURL(u))
  objectURLs = []

  if (!textures.isPlaceholder) {
    return { srcA: textures.sources[0], srcB: textures.sources[1] }
  }

  const [srcA, srcB] = await Promise.all([
    canvasToObjectURL(textures.canvasA),
    canvasToObjectURL(textures.canvasB),
  ])
  objectURLs = [srcA, srcB]
  return { srcA, srcB }
}

const firstSources = await resolve2DSources()
const wall2d = new Wall2D({
  config,
  root: document.getElementById('wall2d'),
  srcA: firstSources.srcA,
  srcB: firstSources.srcB,
})

function applyRenderMode() {
  const is2D = config.render.mode === '2D'
  canvas.style.display = is2D ? 'none' : 'block'
  if (is2D) {
    wall2d.syncStyle()
    wall2d.show()
  } else {
    wall2d.hide()
  }
  updateStats()
}

// ── 参数变更的处理 ─────────────────────────────

function disposeTextures() {
  textures.texA?.dispose()
  textures.texB?.dispose()
}

function regeneratePlaceholder() {
  disposeTextures()
  textures = createPlaceholderTextures({
    aspect: wallAspect(),
    maxAnisotropy,
    seed: textureSeed,
  })
  wall.setTextures(textures.texA, textures.texB)
}

function rebuildEnvironment() {
  scene.remove(environment.group)
  environment.dispose()
  environment = createEnvironment({
    width: wall.layout.width,
    height: wall.layout.height,
    config,
  })
  scene.add(environment.group)
}

const handlers = {
  async rebuild() {
    // 网格密度变了,墙的宽高比跟着变,占位图要重画;用户自己的图就保持不动
    if (textures.isPlaceholder) {
      disposeTextures()
      textures = createPlaceholderTextures({
        aspect: wallAspect(),
        maxAnisotropy,
        seed: textureSeed,
      })
    }
    wall.setTextures(textures.texA, textures.texB)
    wall.build()
    rebuildEnvironment()

    const src = await resolve2DSources()
    wall2d.setSources(src.srcA, src.srcB)
    wall2d.build()

    updateStats()
  },

  retime() {
    wall.cycleSeed = config.flip.seed
    wall.refreshDelays()
    wall2d.retime()
  },

  syncUniforms() {
    wall.syncUniforms()
    wall2d.syncStyle() // 单格时长和缓动是两版共用的
  },

  syncRender() {
    applyRenderMode()
  },

  syncPlay() {
    wall2d.schedule()
  },

  syncCamera() {
    controls.enabled = config.camera.orbit
    if (!config.camera.orbit) applyCameraConfig(camera, config)
  },

  syncPost() {
    renderer.toneMappingExposure = config.post.exposure
    postfx.sync(config.post)
  },

  syncScene() {
    environment.setVisibility(config.scene)
    scene.background.set(config.look.background)
  },

  flipNow() {
    if (config.render.mode === '2D') wall2d.flipNow()
    else wall.flipNow()
  },

  async regenerateTextures() {
    textureSeed = (textureSeed + 137) % 10000
    regeneratePlaceholder()
    textures.isPlaceholder = true

    const src = await resolve2DSources()
    wall2d.setSources(src.srcA, src.srcB)
  },
}

createPanel({ config, handlers })

// ── HUD ────────────────────────────────────────

hud.textContent = textures.isPlaceholder
  ? '当前用的是程序生成的占位图。把两张同比例的图命名 a.jpg / b.jpg 放进 public/,刷新即可换成自己的素材。'
  : `素材:${textures.sources.join('  ·  ')}`

let statsTimer = 0
let frames = 0
function updateStats() {
  const { cols, rows } = config.grid
  const label = config.render.mode === '2D' ? `2D · ${config.render.flip2d}` : '3D'
  stats.dataset.cells = `${label} · ${cols} × ${rows} = ${cols * rows} 格`
}
updateStats()
applyRenderMode()

// ── 循环 ───────────────────────────────────────

// 自己算 dt:THREE.Clock 在 r185 已弃用,而这里只需要一个上限保护的秒数,
// 掉帧时 dt 被压到 0.1,免得一帧跳过整个翻转周期。
let lastTime = performance.now()

renderer.setAnimationLoop(() => {
  const now = performance.now()
  const dt = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now

  // 2D 模式下完全不碰 WebGL,循环只剩下统计——
  // 这样 fps 读数反映的就是 CSS 那套的真实开销
  if (config.render.mode === '3D') {
    wall.update(dt)
    if (controls.enabled) controls.update()
    postfx.composer.render()
  }

  frames++
  statsTimer += dt
  if (statsTimer >= 0.5) {
    stats.textContent = `${Math.round(frames / statsTimer)} fps · ${stats.dataset.cells}`
    frames = 0
    statsTimer = 0
  }
})

// 方便在 console 里直接调参:__wall.config.render.mode = '2D'; __wall.handlers.syncRender()
window.__wall = { config, handlers, wall, wall2d }

window.addEventListener('resize', () => {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setSize(w, h)
  postfx.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
})
