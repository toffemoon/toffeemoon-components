"use client";

import { motion } from "motion/react";
import { EASE_SOFT } from "@/lib/motion";
import { FEATURE_MORE } from "@/content/features";

/* 小功能行(2026-08-02 雨钦:"其他删掉的做成小功能,不放展示的")。
   三大演示之外的能力收成行式清单:无视频位、无卡片(已决 #18 口味),
   语义沿用 dl/dt/dd(已决 #28 的账本骨架),排版走 privacy 三列对齐的
   近亲 —— kicker / 题 / 注。取代上一版 FeatureEvidence 证据段
   (组件与 03–08 数据可从 commit c9bba03 捞回)。 */

export default function FeatureMore() {
  return (
    /* 2026-08-02 雨钦:不要单独一块背景 —— 去掉 bg-bg-sunk 与顶部分界线,
       融进页面连续底色(段落无缝纪律同已决 #10) */
    <section
      data-feature-more="true"
      aria-labelledby="feature-more-heading"
      className="w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: EASE_SOFT }}
        className="mx-auto w-full max-w-[1200px]"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-caramel">
          The rest of the loop
        </p>
        <h2
          id="feature-more-heading"
          className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl"
        >
          Smaller pieces, same discipline.
        </h2>

        <dl
          aria-label="More Ripple capabilities"
          className="mt-12 border-t border-line"
        >
          {FEATURE_MORE.map((item) => (
            <div
              key={item.kicker}
              className="grid gap-2 border-b border-line py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-baseline sm:gap-x-8"
            >
              <dt>
                <span className="block font-mono text-[11px] tracking-[0.18em] text-accent">
                  {item.kicker}
                </span>
                <span className="mt-1.5 block text-base font-medium leading-relaxed text-ink">
                  {item.title}
                </span>
              </dt>
              <dd className="m-0 text-sm leading-relaxed text-ink-muted">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  );
}
