"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { Suspense, lazy, useRef } from "react";
import RippleLogoMark from "@/components/ripple-logo-mark";
import AppStoreBadge from "@/components/ui/app-store-badge";

const AuroraField = lazy(() => import("@/components/aurora-field"));

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const headline: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const orb: Variants = {
  hidden: { opacity: 0, scale: 0.8, filter: "blur(12px)" },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

/* 品牌词强调(2026-08-02 雨钦,已决 #32):hero 字标撤下后,"Ripple" 的
   品牌感落在右栏 h1 的词本身 —— 浅 teal→teal 渐变 + 柔和辉光。起手色刻意
   避开月白(周围正文就是月白,首字母会融掉),保证整词读作 teal 强调 */
function BrandRipple() {
  return (
    <span
      className="bg-linear-to-r from-[#8fe6df] to-[#37c2ba] bg-clip-text text-transparent"
      style={{ filter: "drop-shadow(0 0 22px rgba(55,194,186,0.35))" }}
    >
      Ripple
    </span>
  );
}

export function Hero21() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  // 滚动视差退场:内容随滚动缓慢上移并淡出,极光留在原位
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="waitlist"
      className="relative flex min-h-[calc(100svh-73px)] w-full scroll-mt-24 items-start overflow-hidden px-4 pb-12 pt-6 sm:px-6 sm:pb-20 sm:pt-14 lg:items-center lg:px-8"
    >
      {/* 背景栈整体向下渐隐到透明:让全站底色与氛围光晕连续穿过段落边界,不留分界线 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
        }}
      >
        <Suspense fallback={null}>
          <AuroraField />
        </Suspense>
        {/* 暗角 + 底部压暗,压住极光保证文字可读 */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_78%_66%_at_50%_50%,rgba(10,12,15,0)_32%,rgba(10,12,15,0.58)_100%),linear-gradient(to_bottom,rgba(10,12,15,0.08)_52%,rgba(10,12,15,1))]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 lg:-mt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12"
      >
        {/* 左:logo 舞台 — 放大出血;描边画完后 logo 常驻清晰态
            (2026-08-02 雨钦,已决 #32:字标不再入场,退底虚化随之退役;
            品牌词强调移到右栏 h1 的 BrandRipple。字标与退底代码可从
            commit 9619adc 捞回) */}
        <motion.div
          variants={orb}
          /* 移动端舞台 210px→170px(提案 A):舞台块吃掉首屏太多,标题和下载钮更早入眼 */
          className="relative mx-auto flex h-[170px] max-h-[28svh] w-full max-w-[360px] items-center justify-center sm:h-[380px] sm:max-h-none sm:max-w-[520px] lg:h-[640px] lg:max-w-none"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 m-auto h-2/3 w-2/3 rounded-full bg-accent/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            /* 出血 insets 收回居中(原 lg 左偏是给字标腾位,字标已撤);
              coral 星点保留 —— fadeAccent 是虚化态专用,清晰态不糊 */
            className="absolute -inset-6 flex items-center justify-center sm:-inset-8 lg:-inset-14"
          >
            <RippleLogoMark animated={!reduce} className="h-full w-full" />
          </div>
        </motion.div>

        {/* 右:文字栈(抬上层,字标尾端从底下穿过) */}
        {/* NAISC 徽章已按 2026-07-28 决定降级:比赛凭证全站只提一次,落位页脚品牌块
            (竞品研究:访客不认识的比赛徽章在 hero 高权重位读出的是"学生比赛作品") */}
        <div className="relative z-[1] flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left">
        {/* kicker(提案 A):冷访客 1 秒拿到类别 + 平台;副标随之砍掉重复的
            首句 "A wellness agent for iPhone and Apple Watch."(圈内词 agent
            也一并退出首屏) */}
        <motion.p
          variants={item}
          className="mt-7 text-xs font-medium uppercase tracking-[0.2em] text-caramel"
        >
          Wellness app for iPhone + Apple Watch
        </motion.p>

        <motion.h1
          variants={headline}
          className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl"
        >
          {/* 已决 #32:第二行整行 teal 改回 ink,颜色强调收敛到品牌词本身 */}
          You don&apos;t check <BrandRipple />.
          <br />
          <BrandRipple /> checks on&nbsp;you.
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
        >
          It learns your own baseline, cross-checks the rest of your day, and
          speaks first — with a reason.
        </motion.p>

        {/* 收尾行:微文案居左、下载按钮右下,不再各占一行 */}
        <motion.div
          variants={item}
          className="mt-10 flex w-full flex-col-reverse items-center gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <p className="text-balance text-center text-sm text-ink-faint lg:text-left">
            Free · Private by design · Not a medical&nbsp;device
          </p>
          {/* shrink-0:收尾行在 lg(1024)切成 flex-row 与微文案共享一行,而 hero 左栏
              在 1024 只有 410px 宽,徽章会被压到 148px —— 实测 1024/1080/1140 三档把
              "App Store" 拆成两行、按钮高度从 65.8 撑到 107.5(1194/1200 仍是 79.5)。
              不许它被压,微文案自己折行即可(实测收尾行整体反而从 107.5 降回 65.8) */}
          <AppStoreBadge className="shrink-0" />
        </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
