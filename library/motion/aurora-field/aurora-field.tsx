"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

/* hero 极光层(B33 拆包:自 hero-21.tsx 原样搬出,three 随之离开主包;
   hero 侧 React.lazy 挂载,fallback 空 —— chunk 到货前只是暂无极光) */
const auroraVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* 深色单主题 · teal 色域(原区块紫色极光重调为 Ripple 品牌色) */
const auroraFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 10.0) * x);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p);
      p = p * 2.03 + vec3(13.7, 7.3, 3.1);
      amplitude *= 0.5;
    }
    return value;
  }

  float grain(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (vUv - 0.5) * aspect;
    float t = uTime * 0.05;

    vec2 flow = p;
    flow.x += sin(flow.y * 2.1 + t * 1.3) * 0.17;
    flow.y += cos(flow.x * 2.5 - t * 1.1) * 0.12;

    float cloud = fbm(vec3(flow * 1.4, t * 0.8));
    float veil = fbm(vec3(flow * 2.3 + vec2(cloud * 0.2, -cloud * 0.14), t * 0.6 + 4.0));
    float ribbon = sin((flow.y + cloud * 0.38) * 6.4 + flow.x * 2.4 - uTime * 0.2);
    float aurora = smoothstep(0.06, 0.9, ribbon * 0.5 + 0.5) * smoothstep(-0.3, 0.8, veil);
    float drift = smoothstep(0.08, 0.82, cloud * 0.5 + 0.5);
    float glowCore = pow(smoothstep(0.92, 0.06, length(p + vec2(0.0, 0.08))), 2.6);
    float vign = smoothstep(1.18, 0.24, length(p * vec2(0.86, 1.22)));

    vec3 color = vec3(0.028, 0.034, 0.042);
    color += vec3(0.13, 0.52, 0.49) * aurora * 0.36 * vign;
    color += vec3(0.06, 0.30, 0.28) * drift * 0.22 * vign;
    color += vec3(0.70, 0.86, 0.84) * glowCore * 0.12;
    color *= 0.5 + vign * 0.68;
    color += (grain(gl_FragCoord.xy) - 0.5) * 0.02;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function AuroraField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: auroraVertexShader,
      fragmentShader: auroraFragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
      },
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      geometry.dispose();
      material.dispose();
      return;
    }

    renderer.domElement.className = "absolute inset-0 h-full w-full";
    container.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    const staticTime = 26;
    let frame = 0;

    const renderFrame = () => {
      material.uniforms.uTime.value = reduceMotion
        ? staticTime
        : clock.getElapsedTime();
      renderer.render(scene, camera);
    };

    const loop = () => {
      renderFrame();
      frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      // 小屏封顶 1.5 dpr:极光是柔噪声,降采样肉眼无差,省一半像素
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2),
      );
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width, height);
      renderFrame();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // 离开视口即停 rAF,回来再续,避免整页滚动时后台空转
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        renderFrame();
        if (!reduceMotion && !frame) frame = requestAnimationFrame(loop);
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    io.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      resizeObserver.disconnect();
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}

