"use client";

import { motion } from "motion/react";
import { BellRing, History } from "lucide-react";
import StaggeredText from "@/components/staggered-text";

/**
 * 补充卖点(降权段):机制区已由演示 + how-it-works 讲完主线,
 * 这里只留两条真正独有的(长期记忆 / 主动 nudge 的 quiet hours)。
 * 2026-07-28 文案评审:原 secondary 三条短句与前文逐条重叠、又和
 * comparison 三列互为镜像(中段两屏零新信息),整排删除;
 * h2 "Five things at once." 数数式标题随之失效,换成围绕两卡真实
 * 内容的命题。
 */

const primary = [
  {
    icon: History,
    title: "Long-term memory",
    description:
      /* 砍掉"用得越久,每个新信号被读进的上下文越多" —— §三 禁"越用越准的数据飞轮",
         理由是基线只是 7d/30d 滚动窗;这句把 accuracy 换成 context,援引的却是同一个
         "窗口随使用时长变宽"的机制,而那个机制不存在:调查 agent 的证据窗口全是定长的
         (`ripple-core/src/lib/agent.ts:86-92` — 最新读数 / 7d-vs-30d / 近 24h 序列 /
         ±1 天计划 / 静态 53 条规则库),没有任何工具能读历史 investigation 或历史回复。
         保留后半句:迁移成本的定性主张是 §三 明文允许的 */
      "Every anomaly and every reply becomes one continuous story: history a fresh start can't rebuild.",
  },
  {
    /* "Ripple speaks first." 开头已删(全站逐字第 4 次)、"cadence cap" 人话化 */
    icon: BellRing,
    title: "Proactive nudge",
    description:
      "Quiet hours and a hard limit on frequency keep it from ever becoming noise.",
  },
];

export function Features1() {
  return (
    <section className="w-full px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-caramel"
          >
            What else Ripple does
          </motion.p>

          <StaggeredText
            as="h2"
            text="It remembers. And it knows when not to speak."
            segmentBy="words"
            blur
            direction="bottom"
            delay={60}
            respectReducedMotion
            className="mb-5 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl"
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            /* B23:0.38 = h2 逐词浮现末词起点(0.18)+ 其时长(0.6)的完成口径下限,
               保证副标题不早于 h2 完成前显完;卡片起点同轮抬到 ≥0.38 维持顺序 */
            transition={{ duration: 0.4, delay: 0.38 }}
            className="max-w-xl text-lg leading-relaxed text-ink-muted"
          >
            Trackers collect. Ripple makes sense of what they collect.
          </motion.p>
        </div>

        {/* 两条独有卖点:完整正文 */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
          {primary.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                /* 起点 0.38 = 副标题的 delay:让"标题→副标题→卡片"的显形顺序与滚动速度无关 */
                transition={{ duration: 0.4, delay: 0.38 + index * 0.05 }}
                className="flex flex-col"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/16">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-medium tracking-tight text-ink">
                    {feature.title}
                  </h3>
                </div>
                <p className="max-w-[46ch] text-base leading-relaxed text-ink-muted">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
