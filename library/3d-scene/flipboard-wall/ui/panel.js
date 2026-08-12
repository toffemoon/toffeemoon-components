import GUI from 'lil-gui'
import { MODE_NAMES } from '../wall/timing.js'
import { EASE_OPTIONS, AXIS_OPTIONS } from '../config.js'

// 参数分三类,回调也分三类,代价从低到高:
//   uniform  —— 直接改,零成本
//   retime   —— 重算延迟数组,很便宜
//   rebuild  —— 重建 InstancedMesh,有一帧卡顿,所以只在松手时触发

export function createPanel({ config, handlers }) {
  const gui = new GUI({ title: '翻板墙' })
  gui.domElement.style.setProperty('--width', '300px')

  const onRebuild = () => handlers.rebuild()
  const onRetime = () => handlers.retime()
  const onUniform = () => handlers.syncUniforms()

  // ── 渲染方式 ──────────────────────────────────
  const render = gui.addFolder('渲染方式')
  render
    .add(config.render, 'mode', { 'three.js 灯箱版': '3D', '2D 无光照版': '2D' })
    .name('渲染')
    .onChange(() => handlers.syncRender())
  render
    .add(config.render, 'flip2d', {
      'CSS 3D 翻转 (有透视)': 'flip3d',
      'scaleY 伪翻转 (纯平面)': 'scaley',
      '直接切换 (交叉淡入)': 'fade',
    })
    .name('2D 翻法')
    .onChange(() => handlers.syncRender())
  render.add(config.render, 'dim', 0, 1, 0.01).name('翻转变暗').onChange(() => handlers.syncRender())
  render
    .add(config.render, 'perspective', 300, 4000, 10)
    .name('透视强度 (仅 3D 翻转)')
    .onChange(() => handlers.syncRender())

  // ── 网格 ──────────────────────────────────────
  const grid = gui.addFolder('网格')
  grid.add(config.grid, 'cols', 4, 80, 1).name('列数').onFinishChange(onRebuild)
  grid.add(config.grid, 'rows', 3, 50, 1).name('行数').onFinishChange(onRebuild)
  grid.add(config.panel, 'size', 0.3, 2, 0.01).name('格子边长').onFinishChange(onRebuild)
  grid.add(config.panel, 'gap', 0, 0.3, 0.005).name('格间距').onFinishChange(onRebuild)
  grid.add(config.panel, 'depth', 0.02, 0.6, 0.01).name('面板厚度').onFinishChange(onRebuild)

  // ── 翻转 ──────────────────────────────────────
  const flip = gui.addFolder('翻转')
  flip.add(config.flip, 'axis', AXIS_OPTIONS).name('翻转轴').onChange(onUniform)
  flip.add(config.flip, 'mode', MODE_NAMES).name('时序模式').onChange(onRetime)
  flip.add(config.flip, 'duration', 0.1, 3, 0.01).name('单格时长 (秒)').onChange(onUniform)
  flip.add(config.flip, 'spread', 0, 8, 0.05).name('全墙散布 (秒)').onChange(onRetime)
  flip.add(config.flip, 'hold', 0, 8, 0.05).name('停留 (秒)')
  flip.add(config.flip, 'jitter', 0, 1, 0.01).name('随机抖动').onChange(onRetime)
  flip.add(config.flip, 'ease', EASE_OPTIONS).name('缓动').onChange(onUniform)
  flip.add(config.flip, 'seed', 0, 9999, 1).name('随机种子').onChange(onRetime)
  flip.add(config.flip, 'reseedEachCycle').name('每轮换种子')
  flip.add(config.flip, 'playing').name('自动播放').onChange(() => handlers.syncPlay())
  flip.add({ go: () => handlers.flipNow() }, 'go').name('立刻翻一次')

  // ── 外观 ──────────────────────────────────────
  const look = gui.addFolder('外观')
  look.add(config.look, 'emissive', 0, 3, 0.01).name('灯箱亮度').onChange(onUniform)
  look.add(config.look, 'gloss', 0, 2, 0.01).name('玻璃高光').onChange(onUniform)
  look.add(config.look, 'lightBarStrength', 0, 2, 0.01).name('灯带反射').onChange(onUniform)
  look.addColor(config.look, 'lightBar').name('灯带色温').onChange(onUniform)
  look.add(config.look, 'fresnel', 0, 1.5, 0.01).name('边缘反光').onChange(onUniform)
  look.addColor(config.look, 'edgeColor').name('金属框色').onChange(onUniform)
  look.add(config.look, 'edgeMetal', 0, 2, 0.01).name('金属框反光').onChange(onUniform)
  look.addColor(config.look, 'background').name('背景色').onChange(() => handlers.syncScene())

  // ── 场景 ──────────────────────────────────────
  const scene = gui.addFolder('场景道具')
  scene.add(config.scene, 'showLightBar').name('顶部灯带').onChange(() => handlers.syncScene())
  scene.add(config.scene, 'showBackdrop').name('背板与吊顶').onChange(() => handlers.syncScene())

  // ── 相机 ──────────────────────────────────────
  const cam = gui.addFolder('相机')
  cam.add(config.camera, 'orbit').name('鼠标拖动 (关掉下面的角度)').onChange(() => handlers.syncCamera())
  cam.add(config.camera, 'azimuth', -80, 80, 0.5).name('水平角').onChange(() => handlers.syncCamera())
  cam.add(config.camera, 'elevation', -50, 50, 0.5).name('垂直角 (负=仰视)').onChange(() => handlers.syncCamera())
  cam.add(config.camera, 'distance', 8, 90, 0.5).name('距离').onChange(() => handlers.syncCamera())
  cam.add(config.camera, 'fov', 15, 80, 1).name('视角').onChange(() => handlers.syncCamera())

  // ── 后期 ──────────────────────────────────────
  const post = gui.addFolder('后期')
  post.add(config.post, 'exposure', 0.2, 2, 0.01).name('曝光').onChange(() => handlers.syncPost())
  post.add(config.post, 'bloom').name('辉光').onChange(() => handlers.syncPost())
  post.add(config.post, 'strength', 0, 2, 0.01).name('强度').onChange(() => handlers.syncPost())
  post.add(config.post, 'radius', 0, 1.5, 0.01).name('半径').onChange(() => handlers.syncPost())
  post.add(config.post, 'threshold', 0, 1, 0.01).name('阈值').onChange(() => handlers.syncPost())

  // ── 素材 ──────────────────────────────────────
  const assets = gui.addFolder('素材')
  assets.add({ go: () => handlers.regenerateTextures() }, 'go').name('换一组占位图')

  look.close()
  scene.close()
  post.close()
  assets.close()

  return gui
}
