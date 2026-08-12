"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { ShieldCheck, Fingerprint, Lock, DoorOpen } from "lucide-react";
import StaggeredText from "@/components/staggered-text";
import BlurHighlight from "@/components/blur-highlight";
import { APP_STORE_URL } from "@/components/ui/app-store-badge";
import { FOCUS_RING } from "@/lib/motion";

const cards = [
  {
    title: "Never training data",
    desc: "We never use your vitals to train models, and we never share them for training.",
    blob: "rgba(55,194,186,0.3)",
    icon: ShieldCheck,
  },
  {
    /* "row-level security / your rows" 是数据库黑话(2026-07-28 评审),
       消费者要听的是结论:别人物理上读不到你的数据 */
    title: "Isolated per user",
    desc: "Every account is walled off at the database level — no other user can ever read your data.",
    blob: "rgba(55,194,186,0.22)",
    icon: Fingerprint,
  },
  {
    /* BYO 模型钥匙句已删(B13 同源:上架 app 无 BYO 入口,官网不得声明) */
    title: "Encrypted throughout",
    desc: "Encrypted in transit and at rest — on the way to the database and inside it.",
    blob: "rgba(55,194,186,0.16)",
    icon: Lock,
  },
  {
    title: "Leave with everything",
    desc: "Export your data, or delete your account, any time. No lock-in — deletion is irreversible.",
    blob: "rgba(55,194,186,0.12)",
    icon: DoorOpen,
  },
];

type PrivacyCard = (typeof cards)[number];

function Card({ card, index }: { card: PrivacyCard; index: number }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = card.icon;
  const reduce = useReducedMotion() ?? false;

  // 只在 hover 设备且未开 reduced-motion 时启用倾斜/光晕:
  // 触屏点击会合成 mouseenter 却不发 mouseleave,会把倾斜和光晕卡住(Codex 复核)
  const [hoverable, setHoverable] = useState(false);
  useEffect(() => {
    setHoverable(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
  }, []);
  const enableTilt = hoverable && !reduce;

  // 鼠标跟随的轻微 3D 倾斜(±6°,弹簧平滑),离开归位
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 150, damping: 18, mass: 0.4 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), spring);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    setHovered(false);
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      /* 起点 0.25 = h2 逐词浮现末词的 0.24s(StaggeredText delay=60ms × 5 词),
         与 features-1 同一套家规:让"标题→卡片"的起始顺序与滚动速度无关。
         第 7 轮试过提到 0.45 想连"完成"口径一起修,实测不可复现(同一档两次跑
         −464 / +104),已回滚 —— 本段的 BlurHighlight 与卡片**触发点不同**
         (blur-highlight.tsx:100 硬编码 margin -20% 叠 amount 0.6),
         固定 delay 在数学上修不了,详见账本 B20 */
      transition={{ duration: 0.4, delay: 0.25 + 0.06 * index }}
      style={{ perspective: 900 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={enableTilt ? onMove : undefined}
        onMouseEnter={enableTilt ? () => setHovered(true) : undefined}
        onMouseLeave={enableTilt ? onLeave : undefined}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-panel p-6"
      >
        <motion.div
          initial={false}
          animate={{ opacity: hovered ? 0.6 : 0, scale: hovered ? 1 : 0.75 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-64 rounded-full blur-md"
          style={{
            background: `radial-gradient(circle, ${card.blob} 0%, rgba(255,255,255,0) 70%)`,
            x: "-50%",
          }}
        />

        <Icon className="relative h-5 w-5 text-ink" />

        <h3 className="relative mt-4 text-base font-medium tracking-tight text-ink sm:text-lg">
          {card.title}
        </h3>

        <p className="relative mt-2 max-w-[26ch] text-sm leading-relaxed text-ink-muted">
          {card.desc}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function PrivacyTrust() {
  return (
    <section
      id="privacy"
      className="w-full scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-caramel"
        >
          Privacy
        </motion.p>

        <StaggeredText
          as="h2"
          text="Your health data stays yours."
          segmentBy="words"
          blur
          direction="bottom"
          delay={60}
          respectReducedMotion
          className="max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl"
        />

        <BlurHighlight
          className="mt-4 block max-w-xl text-lg leading-relaxed text-ink-muted"
          highlightedBits={["most personal"]}
          highlightColor="rgba(55, 194, 186, 0.5)"
          highlightClassName="text-ink"
          blurAmount={8}
          viewportOptions={{ once: true, amount: 0.6 }}
        >
          Health data is the most personal data there is. Ripple is built
          accordingly.
        </BlurHighlight>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Card key={card.title} card={card} index={i} />
          ))}
        </div>

        {/* 借 Apple 当第三方背书:隐私主张不止官网自述,App Store 隐私标签是
            过了审核、用户可自行离站验证的版本(竞品研究:Athlytic 同款手法) */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 text-sm text-ink-faint"
        >
          Not just words on a landing page — these practices are declared on{" "}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-md underline decoration-line underline-offset-4 transition-colors hover:text-ink ${FOCUS_RING}`}
          >
            Ripple&apos;s App Store privacy label
          </a>
          , where Apple requires them to match the app.
        </motion.p>
      </div>
    </section>
  );
}
