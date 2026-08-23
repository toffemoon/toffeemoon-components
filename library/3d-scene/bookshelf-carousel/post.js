// 后处理:分层虚化 + 合成
//
// 三步:
//   1. 场景(layer 0,切排过场时含 layer 1)渲到 rtScene —— 半分辨率、不开 MSAA,
//      因为这一层永远要被模糊,锯齿和分辨率都会被糊掉,省下 3/4 的显存和填充
//   2. rtScene 做可变强度高斯模糊(ping-pong 3 次),半径按分辨率归一,DPR 不同看起来一样糊
//   3. 选中物件(layer 1)单独渲到全分辨率 MSAA 的 rtSel(透明底),按预乘 over 盖上去;
//      selMix 控制这层的显隐,切排时交叉溶解而不是硬切。
//      再叠暗角 / 颗粒 / 细扫描线,做 tone mapping + 色彩空间输出
//
// 不走 EffectComposer:链路短、可控,手机上也跑得动。
import * as THREE from 'three';

const QUAD_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const BLUR_FRAG = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform vec2 uDir;        // (1/w, 0) 或 (0, 1/h),已乘半径
  varying vec2 vUv;
  void main() {
    // 9 tap 高斯
    vec4 c = texture2D(tDiffuse, vUv) * 0.2270270270;
    c += texture2D(tDiffuse, vUv + uDir * 1.3846153846) * 0.3162162162;
    c += texture2D(tDiffuse, vUv - uDir * 1.3846153846) * 0.3162162162;
    c += texture2D(tDiffuse, vUv + uDir * 3.2307692308) * 0.0702702703;
    c += texture2D(tDiffuse, vUv - uDir * 3.2307692308) * 0.0702702703;
    gl_FragColor = c;
  }
`;

const COMPOSITE_FRAG = /* glsl */`
  uniform sampler2D tSharp;  // 场景原图
  uniform sampler2D tBlur;   // 场景强模糊
  uniform sampler2D tDepth;  // 场景深度
  uniform sampler2D tSel;    // 选中层,透明底,预乘 alpha
  uniform float uAmount;     // 0..1 全局虚化强度(切排过场时推满)
  uniform float uSelMix;     // 0..1 选中层显隐
  uniform float uDarken;     // 虚化时整体压暗
  uniform float uFocus;      // 对焦的视图空间距离(正数)
  uniform float uNear;       // 相机 near / far,用来把深度转回线性
  uniform float uFar;
  uniform float uFocusRange; // 景深:离焦点多远算全糊
  uniform float uMinBlur;    // 焦点处也留一点点软,免得背景过锐
  uniform float uVignette;
  uniform float uGrain;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  // 非线性深度 → 视图空间距离
  float viewZ(float d) {
    float z = d * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
  }

  void main() {
    // 景深:按每个像素的深度决定用锐图还是糊图
    float dist = viewZ(texture2D(tDepth, vUv).x);
    float coc = clamp(abs(dist - uFocus) / uFocusRange, 0.0, 1.0);
    coc = max(coc, uMinBlur);
    coc = mix(coc, 1.0, uAmount);          // 切排过场时整帧推到全糊
    vec3 base = mix(texture2D(tSharp, vUv).rgb, texture2D(tBlur, vUv).rgb, coc);
    base *= 1.0 - uDarken * coc;
    // 选中层是透明底上的 MSAA resolve,边缘像素已是预乘 alpha:用预乘 over,不能再 mix 一次
    vec4 sel = texture2D(tSel, vUv);
    vec3 col = base * (1.0 - sel.a * uSelMix) + sel.rgb * uSelMix;

    // 暗角
    float d = length((vUv - 0.5) * vec2(1.0, uResolution.y / uResolution.x) * 2.0);
    col *= 1.0 - uVignette * smoothstep(0.55, 1.45, d);
    // 细扫描线
    col *= 1.0 - 0.035 * step(0.5, fract(gl_FragCoord.y * 0.5));
    // 颗粒
    float n = hash(vUv + vec2(fract(uTime * 7.1), fract(uTime * 3.3))) - 0.5;
    col += n * uGrain;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class LayeredBlurPost {
  constructor(renderer, { vignette = 0.55, grain = 0.035, darken = 0.45 } = {}) {
    this.renderer = renderer;
    this.amount = 0;      // 额外的全局虚化(切排过场推满),叠在景深之上
    this.selMix = 1;      // 选中层显隐
    this.focus = 0.62;    // 对焦距离(视图空间),由组件每帧按当前书更新
    this.focusRange = 0.34;
    this.minBlur = 0.12;  // 焦点处也留一点软
    this.blurRadius = 2.3;   // 全糊端的高斯半径;参考图的背景是软而可读,不是糊成色块
    this.blurAll = false; // true = 选中物件也渲进场景层(切排过场用)
    this.time = 0;

    // 场景层:带深度纹理,给景深用。分辨率取 0.7 折中(全清晰没必要,背景本来就软)
    this.sceneScale = 0.7;
    const depthTex = new THREE.DepthTexture(1, 1);
    depthTex.type = THREE.UnsignedIntType;
    depthTex.minFilter = THREE.NearestFilter;
    depthTex.magFilter = THREE.NearestFilter;
    this.rtScene = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType, depthBuffer: true, depthTexture: depthTex,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    });
    // 选中层:全分辨率 MSAA;深度只用来画一个凸多面体,resolve 深度纯属浪费
    this.rtSel = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true, resolveDepthBuffer: false });
    const blurOpts = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.rtA = new THREE.WebGLRenderTarget(1, 1, blurOpts);
    this.rtB = new THREE.WebGLRenderTarget(1, 1, blurOpts);

    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadScene = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.quadScene.add(this.quad);

    this.blurMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: QUAD_VERT, fragmentShader: BLUR_FRAG, depthTest: false, depthWrite: false,
    });
    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        tSharp: { value: null }, tBlur: { value: null }, tDepth: { value: null }, tSel: { value: null },
        uAmount: { value: 0 }, uSelMix: { value: 1 }, uDarken: { value: darken }, uVignette: { value: vignette },
        uFocus: { value: 0.62 }, uNear: { value: 0.02 }, uFar: { value: 20 },
        uFocusRange: { value: 0.34 }, uMinBlur: { value: 0.12 },
        uGrain: { value: grain }, uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: QUAD_VERT, fragmentShader: COMPOSITE_FRAG, depthTest: false, depthWrite: false,
    });
  }

  setSize(w, h) {
    const pr = this.renderer.getPixelRatio();
    const W = Math.max(1, Math.floor(w * pr)), H = Math.max(1, Math.floor(h * pr));
    const sw = Math.max(1, Math.floor(W * this.sceneScale)), sh = Math.max(1, Math.floor(H * this.sceneScale));
    const hw = Math.max(1, Math.floor(W / 2)), hh = Math.max(1, Math.floor(H / 2));
    this.rtScene.setSize(sw, sh);
    this.rtSel.setSize(W, H);
    this.rtA.setSize(hw, hh);
    this.rtB.setSize(hw, hh);
    this.compMat.uniforms.uResolution.value.set(W, H);
  }

  _blit(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCam);
  }

  /**
   * scene / camera:主场景;background:场景底色(THREE.Color)
   * 选中物件须在 layer 1(且只在 layer 1),灯光需同时 enable layer 0 和 1。
   */
  render(scene, camera, background, dt) {
    const r = this.renderer;
    this.time += dt;
    const prevAuto = r.autoClear;
    r.autoClear = true;

    // 1. 场景层。setClearColor 要在 RT 绑定之后调,它按当前目标决定色彩空间
    camera.layers.set(0);
    if (this.blurAll) camera.layers.enable(1);
    r.setRenderTarget(this.rtScene);
    r.setClearColor(background, 1);
    r.render(scene, camera);

    // 2. 强模糊版本(景深的"糊"端);半径按 RT 高度归一,DPR 不同看起来一样糊
    const k = this.rtA.height / 360;
    const radius = this.blurRadius * k;
    const bw = this.rtA.width, bh = this.rtA.height;
    let src = this.rtScene.texture;
    for (let i = 0; i < 3; i++) {
      this.blurMat.uniforms.tDiffuse.value = src;
      this.blurMat.uniforms.uDir.value.set(radius / bw, 0);
      this._blit(this.blurMat, this.rtA);
      this.blurMat.uniforms.tDiffuse.value = this.rtA.texture;
      this.blurMat.uniforms.uDir.value.set(0, radius / bh);
      this._blit(this.blurMat, this.rtB);
      src = this.rtB.texture;
    }

    // 3. 选中层:永远渲(three 只在 render() 里 resolve MSAA,单纯 clear 会留旧帧),显隐交给 selMix
    r.setRenderTarget(this.rtSel);
    r.setClearColor(0x000000, 0);
    camera.layers.set(1);
    r.render(scene, camera);
    camera.layers.set(0);

    // 4. 合成到屏幕
    const u = this.compMat.uniforms;
    u.tSharp.value = this.rtScene.texture;
    u.tBlur.value = this.rtB.texture;
    u.tDepth.value = this.rtScene.depthTexture;
    u.tSel.value = this.rtSel.texture;
    u.uAmount.value = this.amount;
    u.uSelMix.value = this.selMix;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    u.uFocus.value = this.focus;
    u.uFocusRange.value = this.focusRange;
    u.uMinBlur.value = this.minBlur;
    u.uTime.value = this.time;
    this._blit(this.compMat, null);

    r.autoClear = prevAuto;
  }

  dispose() {
    for (const rt of [this.rtScene, this.rtSel, this.rtA, this.rtB]) rt.dispose();
    this.blurMat.dispose(); this.compMat.dispose(); this.quad.geometry.dispose();
  }
}
