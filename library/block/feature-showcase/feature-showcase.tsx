"use client";

import { motion } from "motion/react";
import { EASE_SOFT } from "@/lib/motion";
import BlurHighlight from "@/components/blur-highlight";
import DemoPhone3D from "@/components/phone-3d";
import { FEATURE_DEMOS, type FeatureDemo } from "@/content/features";

/**
 * 编辑部风格功能展示(承 NAISC 演示片的排版 DNA:
 * `// 编号 / 小标` mono kicker + 大标题斜体强调 + 左边线引文 + 规格清单行)
 * 2026-08-02 雨钦重构(取代 #16 的两块制):三大演示各配一台滚动驱动
 * 3D 手机 —— 01 press and hold(手机左)、02 range review(手机右)、
 * 03 cross-signal + clarifying question(手机左)。屏幕贴真实录屏
 * (public/app/feature-*),内容源在 src/content/features.ts。
 * 旧 PhoneJourney 素材与组件留盘未删(?capture 裸页 + 素材管线仍在用)。
 */

/** 文字栏(编辑部规格单),纯内容,动效由外层决定 */
function FeatureText({ feature }: { feature: FeatureDemo }) {
  return (
    <>
      <p className="font-mono text-xs tracking-[0.18em] text-accent">
        {`// ${feature.index} / ${feature.kicker}`}
      </p>

      <h3 className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
        {feature.titleRoman}{" "}
        <span className="font-medium italic text-accent-soft">{feature.titleItalic}</span>
      </h3>

      {/* 正文整段斜体已撤(2026-07-28 评审:像引文占位),斜体只留标题 titleItalic */}
      <p className="mt-5 max-w-xl border-l-2 border-accent/50 pl-4 text-base leading-relaxed text-ink-muted">
        {feature.para}
      </p>

      <div className="mt-8 max-w-xl">
        <div className="border-b border-line pb-2">
          <span className="font-mono text-[11px] tracking-[0.18em] text-ink-faint">
            {feature.listLabel}
          </span>
        </div>
        {feature.rows.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between gap-4 border-b border-line py-2.5"
          >
            {/* 2026-07-28 评审:<640 原来整列隐藏说明,表只剩名字+ACTIVE 零信息 ——
                小屏把 note 堆到名称下,桌面保持右对齐单行。
                2026-08-02 雨钦:行首 teal 圆点去掉,清版式 */}
            <span className="flex min-w-0 flex-col gap-0.5 font-mono text-sm text-ink">
              <span>{row.name}</span>
              {/* 显隐由 index.css 的 .fs-note-* 兜底规则接管(壳浏览器
                  解析不了 Tailwind v4 嵌套媒体查询,全站最后一处已清零) */}
              <span className="fs-note-stack text-xs text-ink-faint">
                {row.note}
              </span>
            </span>
            <span className="fs-note-inline flex-1 text-right font-mono text-xs text-ink-faint">
              {row.note}
            </span>
            <span className="shrink-0 font-mono text-[10px] tracking-[0.18em] text-accent">
              {feature.status}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function FeatureShowcase() {
  return (
    <section
      id="features"
      className="w-full scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      {/* section 级论点:第一卖点(Judge)——先把话说清,下面的演示只是证据 */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: EASE_SOFT }}
        className="mx-auto mb-12 w-full max-w-[1200px] sm:mb-16"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-caramel">
          See it work
        </p>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
          A number alone means nothing.{" "}
          <span className="text-accent">Ripple checks the rest before it speaks.</span>
        </h2>
        <BlurHighlight
          className="mt-5 block max-w-xl text-lg leading-relaxed text-ink-muted"
          highlightedBits={["make the call"]}
          highlightColor="rgba(55, 194, 186, 0.5)"
          highlightClassName="text-ink"
          blurAmount={8}
          viewportOptions={{ once: true, amount: 0.6 }}
        >
          Not a chart to read — watch Ripple make the call, step by step.
        </BlurHighlight>
      </motion.div>

      {/* 三块交错:01 手机左/解释右,02 手机右/解释左,03 手机左/解释右
          (lg 下用 order 翻转;order 是 lg: 嵌套媒体工具类,壳浏览器失效时
          全部手机在左 —— 纯排版降级,内容不丢) */}
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-20 sm:gap-28">
        {FEATURE_DEMOS.map((feature, i) => {
          const mirrored = i % 2 === 1;
          return (
            <motion.div
              key={feature.index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: EASE_SOFT }}
              className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16"
            >
              {/* 移动端先读题后看戏(2026-07-28 评审):基础 order 文字在前、
                  手机在后;lg 恢复左右交错。order 是嵌套媒体工具类,壳浏览器
                  失效时只是排版降级,内容不丢 */}
              <div
                className={`order-2 flex flex-col items-center ${
                  mirrored ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <DemoPhone3D
                  underlay={`/app/${feature.video}.png`}
                  videoWebm={`/app/${feature.video}.webm`}
                  videoMp4={`/app/${feature.video}.mp4`}
                  alt={feature.alt}
                  altFlat={feature.altFlat}
                  mirror={mirrored}
                />
                {/* 诚实标注:2026-08-02 起屏内是 app 真实录屏,不再是
                    Figma 脚本演示,标注随素材换 */}
                <p className="mt-3 text-center text-xs text-ink-muted">
                  Recorded from the app
                </p>
              </div>

              <div className={`order-1 ${mirrored ? "lg:order-1" : "lg:order-2"}`}>
                <FeatureText feature={feature} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
