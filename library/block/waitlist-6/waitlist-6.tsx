"use client";

import { Suspense, lazy } from "react";
import { motion, type Variants } from "motion/react";
import AppStoreBadge from "@/components/ui/app-store-badge";

const RippleField = lazy(() => import("@/components/ripple-field"));

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Waitlist6() {
  return (
    <section
      id="join"
      className="relative flex w-full scroll-mt-24 items-center overflow-hidden px-4 py-28 sm:px-6 sm:py-36 lg:px-8"
    >
      {/* 波纹环在段落上下边缘渐隐,不被 section 边界硬裁出分界线 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 22%, black 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 22%, black 80%, transparent 100%)",
        }}
      >
        <Suspense fallback={null}>
          <RippleField />
        </Suspense>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_50%,rgba(10,12,15,0.85),transparent_72%)]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="relative z-10 mx-auto w-full max-w-[1200px]"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {/* 收尾 chip("Free · No subscription",前身 "Now on the App Store")
             2026-08-02 雨钦指令删除 —— 与 FAQ 价格条同批,价格信息全站收敛 */}
          <motion.h2
            variants={item}
            className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl md:text-6xl"
          >
            Your body speaks before you feel it.
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
          >
            Download it, wear your watch, and let it learn your baseline —
            it speaks up only when something shifts.
          </motion.p>

          <motion.div variants={item} className="mt-10">
            {/* 官方徽章不吃 padding 覆写(它是原版 artwork img),收尾位放大一档 */}
            <AppStoreBadge className="[&>img]:h-[60px]" />
          </motion.div>

          <motion.p variants={item} className="mt-6 text-sm text-ink-faint">
            iPhone with Apple Watch · iOS 18+
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
