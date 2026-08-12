"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** 顶缘全页滚动进度条:细 teal 线,弹簧平滑 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-accent/80"
      style={{ scaleX }}
    />
  );
}
