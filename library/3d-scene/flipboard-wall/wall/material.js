import * as THREE from 'three'

// 面板材质。
//
// 两个关键决定都在这个文件里:
//
// 1. 翻转在顶点着色器里做。每格通过 instanced attribute 拿到自己的延迟,
//    CPU 每帧只更新一个 uTime。这样上千格也不用逐格算矩阵,调参能实时响应。
//
// 2. 不切图。整张源图当一张纹理,每格按自己的 (col, row) 算 UV 偏移去采样。
//    Box 的 +Z 面永远采样图 A,-Z 面永远采样图 B,侧面走金属框色。
//    翻 180° 之后 -Z 面自然朝向观众,换图就发生了,不需要任何额外逻辑。

const vertexShader = /* glsl */ `
  attribute float aDelay;
  attribute vec2 aCell;

  uniform vec2  uGrid;
  uniform float uTime;
  uniform float uDuration;
  uniform float uBaseAngle;
  uniform float uAxis;      // 0 = 绕 X 轴(上下翻),1 = 绕 Y 轴(左右翻)
  uniform int   uEase;

  varying vec2  vCellUv;
  varying vec2  vFaceUv;
  varying vec3  vNormalLocal;
  varying vec3  vNormalWorld;
  varying vec3  vViewDir;
  varying float vProgress;

  const float PI = 3.141592653589793;

  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
  }
  float easeInOutQuint(float t) {
    return t < 0.5 ? 16.0 * t * t * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 5.0) * 0.5;
  }
  // 带回弹,像物理翻板撞到限位再弹一下
  float easeOutBack(float t) {
    float c1 = 1.70158;
    float c3 = c1 + 1.0;
    float u = t - 1.0;
    return 1.0 + c3 * u * u * u + c1 * u * u;
  }
  float applyEase(float t) {
    if (uEase == 0) return easeInOutCubic(t);
    if (uEase == 1) return easeOutBack(t);
    if (uEase == 2) return easeInOutQuint(t);
    return t;
  }

  void main() {
    float t = clamp((uTime - aDelay) / max(uDuration, 0.0001), 0.0, 1.0);
    vProgress = t;

    float angle = uBaseAngle + applyEase(t) * PI;
    float c = cos(angle);
    float s = sin(angle);

    vec3 p = position;
    vec3 n = normal;

    if (uAxis < 0.5) {
      p = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
      n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
    } else {
      p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
      n = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
    }

    // 未旋转的局部法线:用来判断这个顶点属于 Box 的哪个面。
    // 这是几何固有属性,和翻到哪儿了无关。
    vNormalLocal = normal;

    // 背面 UV 要按翻转轴校正,否则翻过来的图是镜像的。
    //
    // BoxGeometry 的 -Z 面:u 随几何 x 减小而增大,v 随 y 增大而增大。
    //   绕 X 轴翻 180°(x 不变, y 取反):左右因为换了观察侧而镜像 → 翻 u;
    //                                   上下因为 y 取反而颠倒        → 翻 v。
    //   绕 Y 轴翻 180°(x 取反, y 不变):换观察侧和 x 取反正好抵消   → 都不翻。
    vec2 faceUv = uv;
    if (normal.z < -0.5 && uAxis < 0.5) {
      faceUv = vec2(1.0 - faceUv.x, 1.0 - faceUv.y);
    }
    vFaceUv = faceUv;
    vCellUv = (aCell + faceUv) / uGrid;

    #ifdef USE_INSTANCING
      vec4 worldPos = modelMatrix * instanceMatrix * vec4(p, 1.0);
      vNormalWorld = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
    #else
      vec4 worldPos = modelMatrix * vec4(p, 1.0);
      vNormalWorld = normalize(mat3(modelMatrix) * n);
    #endif

    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uEmissive;
  uniform vec3  uEdgeColor;
  uniform float uEdgeMetal;
  uniform vec3  uLightBar;
  uniform float uLightBarStrength;
  uniform float uFresnel;
  uniform float uGloss;

  varying vec2  vCellUv;
  varying vec2  vFaceUv;
  varying vec3  vNormalLocal;
  varying vec3  vNormalWorld;
  varying vec3  vViewDir;
  varying float vProgress;

  void main() {
    vec3 color;

    if (abs(vNormalLocal.z) > 0.5) {
      // 正/背面:灯箱发光的画面
      vec3 tex = vNormalLocal.z > 0.0
        ? texture2D(uTexA, vCellUv).rgb
        : texture2D(uTexB, vCellUv).rgb;

      color = tex * uEmissive;

      // 玻璃面上的顶部灯带倒影:上缘一条强的,中部一条弱的。
      // 这条比什么都管用——没有它,面板看着就是贴纸而不是灯箱。
      float topBar = smoothstep(0.87, 1.0, vFaceUv.y);
      float midBar = smoothstep(0.55, 0.61, vFaceUv.y) * (1.0 - smoothstep(0.61, 0.74, vFaceUv.y));
      color += uLightBar * (topBar * 0.6 + midBar * 0.22) * uLightBarStrength * uGloss;
    } else {
      // 侧边:暗金属框
      vec3 n = normalize(vNormalWorld);
      float sideLight = max(dot(n, normalize(vec3(0.25, 1.0, 0.4))), 0.0);
      color = uEdgeColor * (0.3 + sideLight * uEdgeMetal);
    }

    // 边缘 fresnel,擦出玻璃的轮廓反光
    float f = pow(1.0 - clamp(abs(dot(normalize(vNormalWorld), normalize(vViewDir))), 0.0, 1.0), 3.5);
    color += uLightBar * f * uFresnel;

    // 翻转中的格子略微压暗,模拟转到侧面时受光变少
    float turning = sin(vProgress * 3.141592653589793);
    color *= 1.0 - turning * 0.12;

    gl_FragColor = vec4(color, 1.0);
    // 色彩空间和 tonemapping 统一交给 postfx 的 OutputPass,这里输出线性值,
    // bloom 才能在线性空间正确工作。
  }
`

export const EASE_INDEX = {
  inOutCubic: 0,
  outBack: 1,
  inOutQuint: 2,
  linear: 3,
}

export function createWallMaterial({ texA, texB, cols, rows, look, flip }) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      uTexA: { value: texA },
      uTexB: { value: texB },
      uGrid: { value: new THREE.Vector2(cols, rows) },
      uTime: { value: 0 },
      uDuration: { value: flip.duration },
      uBaseAngle: { value: 0 },
      uAxis: { value: flip.axis === 'y' ? 1 : 0 },
      uEase: { value: EASE_INDEX[flip.ease] ?? 0 },
      uEmissive: { value: look.emissive },
      uEdgeColor: { value: new THREE.Color(look.edgeColor) },
      uEdgeMetal: { value: look.edgeMetal },
      uLightBar: { value: new THREE.Color(look.lightBar) },
      uLightBarStrength: { value: look.lightBarStrength },
      uFresnel: { value: look.fresnel },
      uGloss: { value: look.gloss },
    },
  })
}
