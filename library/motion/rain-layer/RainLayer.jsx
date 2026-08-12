import { useEffect, useRef } from "react";

// Animated rain: thin, dark, slow lines with spatial depth. A few drops carry a
// cyan / green highlight. Not Matrix-style. Honors prefers-reduced-motion.
function createDrop(width, height, initial = false) {
  const depth = Math.random(); // 0 far -> 1 near
  const tint = Math.random();
  return {
    x: Math.random() * width,
    y: initial ? Math.random() * height : -60 - Math.random() * height * 0.3,
    length: 18 + depth * 60,
    speed: 230 + depth * 360, // slow, depth-scaled
    alpha: 0.05 + depth * 0.16,
    wind: -10 + Math.random() * 16,
    width: 0.35 + depth * 0.85,
    highlight: tint > 0.86, // ~14% of drops glow faintly
    hue: tint > 0.93 ? "green" : "cyan",
  };
}

export function RainLayer() {
  const canvasRef = useRef(null);

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

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = reduceMotion ? 26 : Math.round(Math.min(170, Math.max(86, width / 11)));
      drops = Array.from({ length: count }, () => createDrop(width, height, true));
    };

    const draw = (now) => {
      const delta = Math.min(0.032, (now - lastTime) / 1000);
      lastTime = now;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      for (const drop of drops) {
        if (!reduceMotion) {
          drop.y += drop.speed * delta;
          drop.x += drop.wind * delta;
          if (drop.y - drop.length > height || drop.x < -90 || drop.x > width + 90) {
            Object.assign(drop, createDrop(width, height));
          }
        }

        const x2 = drop.x + drop.wind * 0.08;
        const gradient = context.createLinearGradient(drop.x, drop.y - drop.length, x2, drop.y);
        if (drop.highlight) {
          const glow = drop.hue === "green" ? "32, 217, 130" : "34, 211, 238";
          gradient.addColorStop(0, `rgba(${glow}, 0)`);
          gradient.addColorStop(0.5, `rgba(${glow}, ${drop.alpha * 0.7})`);
          gradient.addColorStop(1, `rgba(225, 244, 240, ${drop.alpha * 0.95})`);
        } else {
          gradient.addColorStop(0, "rgba(120, 150, 165, 0)");
          gradient.addColorStop(0.6, `rgba(150, 178, 190, ${drop.alpha * 0.5})`);
          gradient.addColorStop(1, `rgba(206, 224, 230, ${drop.alpha})`);
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
  }, []);

  return <canvas className="rain-canvas" ref={canvasRef} aria-hidden="true" />;
}
