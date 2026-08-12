import * as THREE from 'three'
import { createPanelGeometry, layoutCells } from './geometry.js'
import { createWallMaterial, EASE_INDEX } from './material.js'
import { computeDelays } from './timing.js'

// 把几何、材质、时序装配成一面墙,并推进翻转周期。
//
// 一个周期 = spread(全墙散布) + duration(单格翻转) + hold(停留)。
// 一个周期结束就把基准角推 180°,正面背面自然互换。
// 基准角对 360° 取模,所以跑再久也不会有浮点累积误差。

export class FlipWall {
  constructor({ config, texA, texB }) {
    this.config = config
    this.texA = texA
    this.texB = texB

    this.group = new THREE.Group()
    this.time = 0
    this.baseAngle = 0
    this.cycleSeed = config.flip.seed
    this.mesh = null
    this.material = null

    this.build()
  }

  build() {
    this.disposeMesh()

    const { cols, rows } = this.config.grid
    const { size, gap, depth } = this.config.panel

    const layout = layoutCells({ cols, rows, size, gap })
    this.layout = layout

    const geometry = createPanelGeometry({ size, depth })
    geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(layout.cells, 2))

    this.delays = this.computeDelays()
    this.delayAttr = new THREE.InstancedBufferAttribute(this.delays, 1)
    geometry.setAttribute('aDelay', this.delayAttr)

    this.material = createWallMaterial({
      texA: this.texA,
      texB: this.texB,
      cols,
      rows,
      look: this.config.look,
      flip: this.config.flip,
    })

    this.mesh = new THREE.InstancedMesh(geometry, this.material, layout.count)
    this.mesh.frustumCulled = false // 顶点在 shader 里动过,自动包围盒不可信

    const m = new THREE.Matrix4()
    for (let i = 0; i < layout.count; i++) {
      m.makeTranslation(layout.offsets[i * 3], layout.offsets[i * 3 + 1], layout.offsets[i * 3 + 2])
      this.mesh.setMatrixAt(i, m)
    }
    this.mesh.instanceMatrix.needsUpdate = true

    this.group.add(this.mesh)
    this.syncUniforms()
  }

  computeDelays() {
    const { cols, rows } = this.config.grid
    const { mode, spread, jitter } = this.config.flip
    return computeDelays({ cols, rows, mode, spread, jitter, seed: this.cycleSeed })
  }

  /** 换了时序模式 / 散布 / 抖动 / 种子时调用,不用重建网格 */
  refreshDelays() {
    const next = this.computeDelays()
    this.delays.set(next)
    this.delayAttr.needsUpdate = true
  }

  /** 改了任何 uniform 类参数后调用。全量同步,省得漏 */
  syncUniforms() {
    if (!this.material) return
    const u = this.material.uniforms
    const { look, flip, grid } = this.config

    u.uGrid.value.set(grid.cols, grid.rows)
    u.uDuration.value = flip.duration
    u.uAxis.value = flip.axis === 'y' ? 1 : 0
    u.uEase.value = EASE_INDEX[flip.ease] ?? 0
    u.uEmissive.value = look.emissive
    u.uEdgeColor.value.set(look.edgeColor)
    u.uEdgeMetal.value = look.edgeMetal
    u.uLightBar.value.set(look.lightBar)
    u.uLightBarStrength.value = look.lightBarStrength
    u.uFresnel.value = look.fresnel
    u.uGloss.value = look.gloss
  }

  setTextures(texA, texB) {
    this.texA = texA
    this.texB = texB
    if (this.material) {
      this.material.uniforms.uTexA.value = texA
      this.material.uniforms.uTexB.value = texB
    }
  }

  /** 手动触发一次翻转(面板上的按钮用) */
  flipNow() {
    this.time = 0
  }

  update(dt) {
    const { spread, duration, hold, playing } = this.config.flip

    if (playing) {
      const cycle = spread + duration + hold
      this.time += dt
      if (this.time >= cycle) {
        this.time -= cycle
        this.baseAngle = (this.baseAngle + Math.PI) % (Math.PI * 2)
        if (this.config.flip.reseedEachCycle) {
          this.cycleSeed = (this.cycleSeed + 1) | 0
          this.refreshDelays()
        }
      }
    }

    if (this.material) {
      this.material.uniforms.uTime.value = this.time
      this.material.uniforms.uBaseAngle.value = this.baseAngle
    }
  }

  disposeMesh() {
    if (!this.mesh) return
    this.group.remove(this.mesh)
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.mesh = null
    this.material = null
  }

  dispose() {
    this.disposeMesh()
  }
}
