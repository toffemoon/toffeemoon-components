"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  BedDouble,
  Droplets,
  Flame,
  Footprints,
  Heart,
  HeartPulse,
  Moon,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { EASE_SOFT } from "@/lib/motion";
import StaggeredText from "@/components/staggered-text";
import SimpleGraph from "@/components/simple-graph";

/* 右栏基线图(B34 复活,2026-07-29 雨钦:「往左移动一点,右边加一点证据」):
   一条体征在自己的 usual range 里游走、漂出去、开 case ——
   把 02 Learn / 03 Judge 讲成看得见的图。示例数据,图下有标注;
   amber 只用于偏离点与 CASE OPENED 线(与 dashboard 同语义) */
/* Day 5 原是 52,恰好越过 usual range 上缘,CASE OPENED 会标到一日尖峰上,
   叙事错位 —— 收回带内,让 case 落在后段的持续下漂 */
const DEMO_HRV = [49, 51, 48, 50, 51, 49, 47, 48, 46, 43, 41, 39, 40, 41].map(
  (value, i) => ({
    value,
    label: `Day ${i + 1} · ms`,
    /* usual range(±7% 于均值 48)之外的点标 amber */
    dotColor: value < 44.6 || value > 51.4 ? "#e6b45a" : undefined,
  }),
);
const DEMO_BAND = { from: 44.6, to: 51.4, label: "usual range" };
const DEMO_CASE_INDEX = DEMO_HRV.findIndex((d) => d.dotColor);

/* 九体征规格表(2026-07-29 雨钦选 B+C 结合):图标 + 名称 + 单位。
   图标与 dashboard 指标行同款(跨页同语言),颜色守 teal ——
   多色是 dashboard 数据线的定点例外(已决 #21),营销页不沾 */
const vitalSpecs: { name: string; unit: string; icon: LucideIcon }[] = [
  { name: "Heart rate", unit: "bpm", icon: Heart },
  { name: "HRV", unit: "ms", icon: Activity },
  { name: "Resting HR", unit: "bpm", icon: HeartPulse },
  { name: "Respiratory", unit: "br/min", icon: Wind },
  { name: "Blood oxygen", unit: "%", icon: Droplets },
  { name: "Sleep hours", unit: "h", icon: Moon },
  { name: "Sleep efficiency", unit: "%", icon: BedDouble },
  { name: "Steps", unit: "count", icon: Footprints },
  { name: "Active energy", unit: "kcal", icon: Flame },
];


const steps = [
  {
    num: "01",
    label: "Sense",
    title: "Connect once",
    desc: "Wear your watch as usual. Ripple reads nine vitals from HealthKit. No logging, no charts, nothing to babysit.",
  },
  {
    num: "02",
    label: "Learn",
    title: "Your normal, not average",
    desc: "Ripple recomputes your personal baseline every day: your last 7 days against your last 30. It compares you with you, not with a population average.",
  },
  {
    num: "03",
    label: "Judge",
    title: "A rule opens the case",
    /* deterministic 是圈内词(2026-07-28 评审):想说的只是"开不开 case
       是死规则,不是 AI 的心情" */
    desc: "When a vital drifts more than about 7% from your baseline, a fixed rule — not the AI — opens a case. AI investigates the surrounding context and explains what may have changed. It does not diagnose or recommend medication.",
  },
  {
    num: "04",
    label: "Speak",
    title: "The explanation comes to you",
    desc: "A short nudge reaches you before you think to look. Reply in plain words, and the explanation and your reply become part of one continuous history.",
  },
];

function StepRow({
  step,
  isLast,
  reduce,
}: {
  step: (typeof steps)[number];
  isLast: boolean;
  reduce: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_1fr] gap-x-5 sm:grid-cols-[2rem_1fr] sm:gap-x-8">
      {/* 左轨:圆点 + 向下延伸到下一步的连线(滚到即点亮、连线往下画) */}
      <div className="relative flex flex-col items-center">
        <motion.span
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-45% 0px -45% 0px" }}
          transition={{ duration: 0.4, ease: EASE_SOFT }}
          className="relative z-10 mt-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-accent bg-bg"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </motion.span>
        {!isLast && (
          <div className="relative mt-1.5 w-px flex-1">
            <span className="absolute inset-0 bg-line" />
            <motion.span
              initial={reduce ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-30% 0px -30% 0px" }}
              transition={{ duration: 0.6, ease: EASE_SOFT }}
              className="absolute inset-x-0 top-0 h-full origin-top bg-accent"
            />
          </div>
        )}
      </div>

      {/* 右内容:滚到才淡入 */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40% 0px -40% 0px" }}
        transition={{ duration: 0.5, ease: EASE_SOFT }}
        className={isLast ? "pb-2" : "pb-14 sm:pb-20"}
      >
        <div className="flex items-baseline gap-3 font-mono text-xs tracking-[0.18em] text-accent">
          <span>{step.num}</span>
          <span className="uppercase">{step.label}</span>
        </div>
        <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {step.title}
        </h3>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          {step.desc}
        </p>
      </motion.div>
    </div>
  );
}

export default function HowItWorks4() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      id="how-it-works"
      className="w-full scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start gap-4 text-left"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-caramel">
            Why Ripple
          </p>
          <StaggeredText
            as="h1"
            text="Most days, you do nothing."
            segmentBy="words"
            blur
            direction="bottom"
            delay={60}
            respectReducedMotion
            className="max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl"
          />
          {/* 副标题原本跟外层 0.6s 一起显完,比 h2 逐词浮现的末词(0.24 起 + 0.6 duration
              = 0.84s 落定)早约 300ms,与滚动速度无关。0.44 = 0.84 − 自己的 0.4s duration */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.44 }}
            className="max-w-xl text-lg leading-relaxed text-ink-muted"
          >
            Ripple notices first, checks against your own normal, and explains
            what may have changed — without asking you to live in another
            dashboard.
          </motion.p>
        </motion.div>

        {/* 竖向逐步进场:滚到哪一步,连线往下画、圆点点亮、文字淡入。
            2026-07-29 雨钦:步骤靠左,右栏 sticky 基线图当证据(B34 落地,
            取代 07-28 的 mx-auto 止血)。移动端图排在步骤之后,不做显隐 */}
        <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-xl">
            {steps.map((step, i) => (
              <StepRow
                key={step.num}
                step={step}
                isLast={i === steps.length - 1}
                reduce={reduce}
              />
            ))}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              One vital vs its own baseline
            </p>
            <div className="mt-4">
              <SimpleGraph
                data={DEMO_HRV}
                lineColor="#37c2ba"
                dotColor="#37c2ba"
                height={340}
                curved
                gradientFade
                showGrid
                gridLines="horizontal"
                gridStyle="dashed"
                graphLineThickness={2.5}
                dotSize={5}
                animationDuration={2.4}
                animateOnScroll
                bands={[DEMO_BAND]}
                markers={[{ index: DEMO_CASE_INDEX, label: "Case opened" }]}
              />
            </div>
            {/* 诚实标注:与演示区"scripted walk-through"同一惯例 */}
            <p className="mt-3 text-xs text-ink-muted">
              Illustrative — sample data. Drift past your usual range opens a
              case.
            </p>
          </div>
        </div>

        {/* Sense 的输入清单:九个体征,读自 HealthKit(收编自原九体征段)。
            2026-07-29 雨钦定稿 = 图标 + 名称 + 单位的微型规格表 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-14"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Nine vitals · read from HealthKit
          </span>
          <div className="mt-3 grid grid-cols-1 gap-x-7 sm:grid-cols-2 lg:grid-cols-3">
            {vitalSpecs.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.name}
                  className="flex items-center justify-between gap-4 border-t border-line py-2.5"
                >
                  <span className="flex items-center gap-2.5 font-mono text-sm text-ink">
                    <Icon className="h-4 w-4 shrink-0 text-accent" />
                    {v.name}
                  </span>
                  <span className="font-mono text-xs text-ink-faint">
                    {v.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
