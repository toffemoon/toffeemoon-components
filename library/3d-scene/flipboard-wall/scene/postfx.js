import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

// 永远走 composer,bloom 只是开关 enabled——
// 这样色彩空间和 tonemapping 始终由 OutputPass 一处负责,
// 材质那边只管输出线性值,bloom 也就能在线性空间里算对。

export function createPostFX({ renderer, scene, camera, config }) {
  const size = renderer.getSize(new THREE.Vector2())

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    config.post.strength,
    config.post.radius,
    config.post.threshold
  )
  bloom.enabled = config.post.bloom
  composer.addPass(bloom)

  composer.addPass(new OutputPass())

  return {
    composer,
    bloom,
    sync(postConfig) {
      bloom.enabled = postConfig.bloom
      bloom.strength = postConfig.strength
      bloom.radius = postConfig.radius
      bloom.threshold = postConfig.threshold
    },
    setSize(width, height) {
      composer.setSize(width, height)
      bloom.setSize(width, height)
    },
  }
}
