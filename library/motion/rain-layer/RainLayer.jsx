import { useEffect, useRef } from "react";
import "./rain-layer.css";

// 细、暗、慢的雨线,带空间景深,少量雨滴带青绿高光。刻意不是黑客帝国那种。
// 尊重 prefers-reduced-motion。
//
// 2026-08-23:三个参数从写死改成可传 —— density(频率/雨量)、speed(速度)、
// opacity(浓度)。speed / opacity 走 ref,改了下一帧就生效、不重建雨滴;
// density 变了必须重建(雨滴数量是建的时候定的),所以它在依赖数组里。
function createDrop(width, height, initial = false) {
  const depth = Math.random(); // 0 远 -> 1 近
  const tint = Math.random();
  return {
    x: Math.random() * width,
    y: initial ? Math.random() * height : -60 - Math.random() * height * 0.3,
    length: 18 + depth * 60,
    speed: 230 + depth * 360, // 慢,且按景深分层
    alpha: 0.05 + depth * 0.16,
    wind: -10 + Math.random() * 16,
    width: 0.35 + depth * 0.85,
    highlight: tint > 0.86, // 约 14% 的雨滴带微光
    hue: tint > 0.93 ? "green" : "cyan",
  };
}

export function RainLayer({ density = 1, speed = 1, opacity = 1 }) {
  const canvasRef = useRef(null);
  const live = useRef({ speed, opacity });

  useEffect(() => {
    live.current = { speed, opacity };
  }, [speed, opacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let lastTime = performance.now();
    let width = 0;
    let height = 0;
    let drops = [];

    // 容器优先,拿不到再退回视口 —— 组件常被当成整屏背景层用
    const measure = () => {
      const host = canvas.parentElement;
      const w = host?.clientWidth || window.innerWidth;
      const h = host?.clientHeight || window.innerHeight;
      return [w, h];
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      [width, height] = measure();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const base = reduceMotion ? 26 : Math.round(Math.min(170, Math.max(86, width / 11)));
      const count = Math.max(4, Math.round(base * density));
      drops = Array.from({ length: count }, () => createDrop(width, height, true));
    };

    const draw = (now) => {
      const delta = Math.min(0.032, (now - lastTime) / 1000);
      lastTime = now;
      const { speed: spd, opacity: op } = live.current;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      for (const drop of drops) {
        if (!reduceMotion) {
          drop.y += drop.speed * spd * delta;
          drop.x += drop.wind * delta;
          if (drop.y - drop.length > height || drop.x < -90 || drop.x > width + 90) {
            Object.assign(drop, createDrop(width, height));
          }
        }

        const a = drop.alpha * op;
        const x2 = drop.x + drop.wind * 0.08;
        const gradient = context.createLinearGradient(drop.x, drop.y - drop.length, x2, drop.y);
        if (drop.highlight) {
          const glow = drop.hue === "green" ? "32, 217, 130" : "34, 211, 238";
          gradient.addColorStop(0, `rgba(${glow}, 0)`);
          gradient.addColorStop(0.5, `rgba(${glow}, ${a * 0.7})`);
          gradient.addColorStop(1, `rgba(225, 244, 240, ${a * 0.95})`);
        } else {
          gradient.addColorStop(0, "rgba(120, 150, 165, 0)");
          gradient.addColorStop(0.6, `rgba(150, 178, 190, ${a * 0.5})`);
          gradient.addColorStop(1, `rgba(206, 224, 230, ${a})`);
        }
        context.strokeStyle = gradient;
        context.lineWidth = drop.width;
        context.beginPath();
        context.moveTo(drop.x, drop.y - drop.length);
        context.lineTo(x2, drop.y);
        context.stroke();
      }

      if (!reduceMotion) animationFrame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas className="rain-canvas" ref={canvasRef} aria-hidden="true" />;
}
