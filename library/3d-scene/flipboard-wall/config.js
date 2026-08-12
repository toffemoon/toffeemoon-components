// 所有可调参数集中在这里,控制面板直接绑定这个对象。
// 改默认值就改这里,不用翻代码。

export const config = {
  // 3D = three.js 灯箱版;2D = 纯 DOM/CSS,无 WebGL 无光照。
  // 两版共用下面所有网格与翻转参数,所以切过去能直接比节奏。
  render: {
    mode: '3D', // '3D' | '2D'
    flip2d: 'scaley', // 2D 的三种翻法:'flip3d' | 'scaley' | 'fade'
    dim: 0.62, // 翻转过程中的变暗强度。去掉光照后,这是唯一的"正在翻"的线索
    perspective: 1400, // 只对 flip3d 生效
  },

  grid: {
    cols: 24,
    rows: 14,
  },

  panel: {
    size: 1.0, // 单格边长
    gap: 0.07, // 格间距(金属框缝)。太细的话面板一亮就把格线糊掉了
    depth: 0.11, // 面板厚度。太厚的话翻到一半时侧边的黑条会盖住半格
  },

  flip: {
    axis: 'x', // 'x' 上下翻 / 'y' 左右翻
    mode: 'diagonal', // 时序模式,见 wall/timing.js
    duration: 0.85, // 单格翻转耗时(秒)
    spread: 2.2, // 全墙延迟散布(秒)——第一格到最后一格的时间差
    hold: 1.6, // 翻完后停留(秒)
    jitter: 0.18, // 在规则模式上混入的随机量 0..1
    ease: 'inOutCubic',
    seed: 1337,
    reseedEachCycle: false, // 每轮换一个随机种子,节奏不重复
    playing: true,
  },

  // 曝光是三层叠加的:灯箱亮度 → ACES tonemapping → bloom。
  // 三个都往高了调会直接把画面推成白板,图案全丢。
  // 这组默认值的取法是:让面板亮到"在暗环境里发光",但纹理细节仍然读得出来。
  look: {
    emissive: 0.92, // 灯箱亮度
    edgeColor: '#15171c', // 侧边金属框颜色
    edgeMetal: 0.5,
    lightBar: '#fff2d4', // 顶部灯带色温
    lightBarStrength: 0.45,
    fresnel: 0.26, // 玻璃边缘反光
    gloss: 0.65, // 面板高光强度
    background: '#08080a',
  },

  scene: {
    showLightBar: true,
    showBackdrop: true,
  },

  camera: {
    azimuth: -26, // 水平偏角(度)
    elevation: -13, // 垂直角,负值 = 仰视,和现场照片一致
    distance: 32,
    fov: 38,
    orbit: false, // 打开后可用鼠标拖动,面板里的角度值失效
  },

  // 阈值调低会让整墙一起发光,糊成一片白雾。
  // 只让最亮的高光溢出来,灯箱的"发光感"才立得住。
  post: {
    bloom: true,
    strength: 0.3,
    radius: 0.45,
    threshold: 0.88,
    exposure: 0.95,
  },
}

export const EASE_OPTIONS = ['inOutCubic', 'outBack', 'inOutQuint', 'linear']
export const AXIS_OPTIONS = { '上下翻 (绕 X 轴)': 'x', '左右翻 (绕 Y 轴)': 'y' }
