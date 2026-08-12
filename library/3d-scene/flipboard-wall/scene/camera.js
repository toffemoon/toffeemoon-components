import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// 相机用球坐标控制:仰角取负值就是从下往上看,和现场照片的机位一致。

export function createCamera(config, aspect) {
  const camera = new THREE.PerspectiveCamera(config.camera.fov, aspect, 0.1, 500)
  applyCameraConfig(camera, config)
  return camera
}

export function applyCameraConfig(camera, config) {
  const { azimuth, elevation, distance, fov } = config.camera
  const az = THREE.MathUtils.degToRad(azimuth)
  const el = THREE.MathUtils.degToRad(elevation)

  camera.fov = fov
  camera.position.set(
    distance * Math.cos(el) * Math.sin(az),
    distance * Math.sin(el),
    distance * Math.cos(el) * Math.cos(az)
  )
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
}

/**
 * 轨道控制默认关闭。开着它拖相机的话,面板上的角度数值就不再生效——
 * 两套控制方式同时开会互相打架,所以做成互斥。
 */
export function createControls(camera, domElement, config) {
  const controls = new OrbitControls(camera, domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 5
  controls.maxDistance = 120
  controls.enabled = config.camera.orbit
  return controls
}
