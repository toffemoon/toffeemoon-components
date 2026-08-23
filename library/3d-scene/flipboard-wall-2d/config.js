// 2D 版自己的默认参数 —— 2026-08-21 从 3D 版 config.js 摘出 2D 用得到的部分,值保持一致。
// 两版参数从此各自维护,改这份不影响 3D 版。

export const config = {
  render: {
    flip2d: 'scaley', // 三种翻法:'flip3d' | 'scaley' | 'fade'
    dim: 0.62, // 翻转过程中的变暗强度,scaley / fade 唯一的"正在翻"线索
    perspective: 1400, // 只对 flip3d 生效
  },

  grid: {
    cols: 24,
    rows: 14,
  },

  panel: {
    size: 1.0, // 单格边长
    gap: 0.07, // 格间距。syncGap 按 gap/size 的比例换算成 px
  },

  flip: {
    mode: 'diagonal', // 时序模式,见 timing.js 的 MODES
    duration: 0.85, // 单格翻转耗时(秒)
    spread: 2.2, // 全墙延迟散布(秒)——第一格到最后一格的时间差
    hold: 1.6, // 翻完后停留(秒)
    startDelay: 0.8, // 首次翻转前的等待(秒)。不配就等一整个周期,落地那几秒会像静止的
    jitter: 0.18, // 在规则模式上混入的随机量 0..1
    ease: 'inOutCubic', // 见 index.js 的 EASE_CSS
    seed: 1337,
    reseedEachCycle: false, // 每轮换一个随机种子,节奏不重复
    playing: true,
  },
}
