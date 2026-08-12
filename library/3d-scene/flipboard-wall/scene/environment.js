import * as THREE from 'three'

// 现场那股味有一半不在墙本身,而在墙周围:
// 顶边那排灯珠、天花板的射灯、墙后的暗背板。
// 这些都是纯视觉道具,配合 bloom 才有灯箱镶在天花板下的感觉。

function createLightBar({ width, height }) {
  const group = new THREE.Group()

  const beadMat = new THREE.MeshBasicMaterial({ color: 0xfff6e2 })
  const beadGeo = new THREE.SphereGeometry(0.075, 10, 8)
  const beadCount = Math.max(8, Math.round(width / 0.62))
  const beads = new THREE.InstancedMesh(beadGeo, beadMat, beadCount)

  const m = new THREE.Matrix4()
  for (let i = 0; i < beadCount; i++) {
    const x = -width / 2 + (i / (beadCount - 1)) * width
    m.makeTranslation(x, height / 2 + 0.34, 0.24)
    beads.setMatrixAt(i, m)
  }
  beads.instanceMatrix.needsUpdate = true
  group.add(beads)

  // 灯珠背后一条连续的软光带,把单颗灯珠糊成一条线
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 0.6, 0.42),
    new THREE.MeshBasicMaterial({
      color: 0xffeccc,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  glow.position.set(0, height / 2 + 0.34, 0.1)
  group.add(glow)

  // 天花板射灯:墙前上方一排,离墙远一些
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const spotGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.34, 12)
  const spotCount = 7
  const spots = new THREE.InstancedMesh(spotGeo, spotMat, spotCount)
  for (let i = 0; i < spotCount; i++) {
    const x = -width * 0.42 + (i / (spotCount - 1)) * width * 0.84
    m.makeTranslation(x, height / 2 + 2.6, 5.4)
    spots.setMatrixAt(i, m)
  }
  spots.instanceMatrix.needsUpdate = true
  group.add(spots)

  return group
}

function createBackdrop({ width, height }) {
  const group = new THREE.Group()

  // 格缝里露出来的底。
  // 只比墙大一点点,不向外溢——外面那圈暗色交给场景背景,
  // 这块提亮是为了让格线看着像浅色金属条,而不是一道道死黑的缝。
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.02, height * 1.02),
    new THREE.MeshBasicMaterial({ color: 0x30333b })
  )
  back.position.z = -0.35
  group.add(back)

  // 天花板条形吊顶,给画面一个顶
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.8, 9),
    new THREE.MeshBasicMaterial({ color: 0x14151a, side: THREE.DoubleSide })
  )
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.set(0, height / 2 + 3.4, 3.5)
  group.add(ceiling)

  return group
}

export function createEnvironment({ width, height, config }) {
  const group = new THREE.Group()

  const lightBar = createLightBar({ width, height })
  const backdrop = createBackdrop({ width, height })

  lightBar.visible = config.scene.showLightBar
  backdrop.visible = config.scene.showBackdrop

  group.add(backdrop, lightBar)

  return {
    group,
    setVisibility(sceneConfig) {
      lightBar.visible = sceneConfig.showLightBar
      backdrop.visible = sceneConfig.showBackdrop
    },
    dispose() {
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
      })
    },
  }
}
