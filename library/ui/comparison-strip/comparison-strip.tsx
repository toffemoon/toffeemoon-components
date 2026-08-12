"use client";

import { Suspense, lazy, useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { APP_STORE_URL } from "@/components/ui/app-store-badge";
import { FOCUS_RING } from "@/lib/motion";

/* B33 拆包:shader 组件懒加载,three 不进主包(本来就是 inView 才挂载) */
const SilkWaves = lazy(() => import("@/components/silk-waves"));

// teal 深色板:从站底色 #0a0c0f 渐次抬到品牌 teal,配低 opacity + 边缘 mask 做极淡点缀
const SILK_COLORS = [
  "#0a0c0f",
  "#0e1a19",
  "#123330",
  "#15423d",
  "#1c5a52",
  "#22736a",
  "#2a9086",
  "#37c2ba",
];

export default function ComparisonStrip() {
  const ref = useRef<HTMLElement>(null);
  // 进视口才挂载 shader,离屏不空转 GPU(挂载一次后保留,避免反复创建 WebGL 上下文)
  const inView = useInView(ref, { once: true, margin: "200px" });

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      {inView && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 68% 60% at 50% 50%, black, transparent 76%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 68% 60% at 50% 50%, black, transparent 76%)",
          }}
        >
          <Suspense fallback={null}>
            <SilkWaves
              speed={0.35}
              scale={2}
              opacity={0.42}
              colors={SILK_COLORS}
              className="absolute inset-0 h-full w-full"
            />
          </Suspense>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-[900px] text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-xs font-medium uppercase tracking-[0.2em] text-caramel"
        >
          Why not just a tracker
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 font-display text-3xl font-bold leading-snug tracking-tight text-ink sm:text-4xl lg:text-5xl"
        >
          Trackers tell you what happened. Dashboards wait for you to look.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-5 font-display text-2xl font-semibold leading-snug tracking-tight text-accent sm:text-3xl"
        >
          Ripple speaks first — and remembers.
        </motion.p>

        {/* beachhead 一句话:认领"表还戴着、数字早就不看了"的人。放在工具失职之后,
            读者才不会被读成失败者(顺序:工具的问题 → 我们怎么做 → 说的就是你) */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base"
        >
          If you still wear your watch but stopped reading the numbers, that is
          exactly who Ripple is for.
        </motion.p>

        {/* 诚实差异化:答"凭什么不用手机自带的健康提醒",类别级不点名品牌 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mx-auto mt-10 grid max-w-2xl gap-3 text-left sm:grid-cols-3 sm:gap-6"
        >
          {[
            { a: "Your baseline", b: "not a fixed threshold" },
            { a: "The whole day, cross-checked", b: "not a single reading" },
            { a: "Remembered", b: "not a one-off ping" },
          ].map((row) => (
            <div key={row.a} className="border-t border-line pt-3">
              <p className="text-sm font-medium text-ink">{row.a}</p>
              <p className="mt-0.5 text-sm text-ink-faint">{row.b}</p>
            </div>
          ))}
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-muted"
        >
          The health alerts already on your phone do none of this.
        </motion.p>

        {/* 中段安静下载入口:说服力峰值处的顺手转化位 */}
        <motion.a
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          /* CTA 收敛(2026-07-28 评审):与 nav 的次级下载按钮同款式样,
             全站只剩两级 —— 官方徽章(主)+ teal 胶囊(次) */
          className={`mt-10 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover ${FOCUS_RING}`}
        >
          Free on the App Store
          <ArrowRight className="h-4 w-4" />
        </motion.a>
      </div>
    </section>
  );
}
