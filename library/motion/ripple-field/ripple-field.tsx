"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

/* 收尾 CTA 波纹环层(B33 拆包:自 waitlist-6.tsx 原样搬出,理由同 aurora-field) */
const rippleVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* 深色单主题 · 同心波纹环调成品牌 teal(原区块蓝白环) */
const rippleFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;

  float ring(vec2 p, float radius, float width) {
    float d = abs(length(p) - radius);
    return 1.0 - smoothstep(0.0, width, d);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (vUv - 0.5) * aspect;
    float dist = length(p);

    float waves = 0.0;
    for (int i = 0; i < 6; i++) {
      float phase = fract(uTime * 0.05 + float(i) / 6.0);
      float radius = phase * 1.35;
      float fade = smoothstep(0.02, 0.2, radius) * (1.0 - smoothstep(0.5, 1.3, radius));
      float width = 0.014 + radius * 0.055;
      waves += ring(p, radius, width) * fade;
    }
    waves = min(waves, 1.0);

    float glow = exp(-dist * 3.2);
    float grain = hash(gl_FragCoord.xy) - 0.5;

    vec3 color = vec3(0.039, 0.047, 0.059)
      + vec3(0.28, 0.72, 0.69) * waves * 0.085
      + vec3(0.10, 0.38, 0.36) * waves * 0.05
      + vec3(0.05, 0.15, 0.14) * glow * 0.3;
    color += grain * 0.012;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function RippleField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: rippleVertexShader,
      fragmentShader: rippleFragmentShader,
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

    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
    });
    host.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    let frame = 0;

    const renderScene = () => renderer.render(scene, camera);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2),
      );
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width, height);
      renderScene();
    };

    const tick = () => {
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderScene();
      frame = requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    if (reduceMotion) {
      material.uniforms.uTime.value = 5.2;
      renderScene();
    }

    // 波纹环只在视口内跑动画
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        renderScene();
        if (!reduceMotion && !frame) frame = requestAnimationFrame(tick);
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    io.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      resizeObserver.disconnect();
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
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

