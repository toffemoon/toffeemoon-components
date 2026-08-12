// 接线 shim —— 2D 版里写的是 `from "../wall/timing.js"`,因为原项目里 wall2d 和 wall 是同级。
// 这正是那件事的证据:时序引擎和渲染解耦,两个版本吃的是同一份文件。
export * from '../flipboard-wall/wall/timing.js'
