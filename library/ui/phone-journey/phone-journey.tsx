"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { EASE_SOFT } from "@/lib/motion";

/**
 * 单手机连续旅程:一条真实的 app 操作流,不分段展示 ——
 * 日历长按(ring 充能)→ Day Detail 推入 → 点「Heart-rate spike」通知卡
 * → 调查页推入(核查跑动 → 提问 → 点选「Yes, exercising」→ VERDICT)。
 * 滚入视口后自动演一遍(带模拟指尖);访客任何节点都能亲手接管:
 * 自己长按日期、自己点通知卡、自己点答案 chip,终态点按整段重放。
 * 父级通过 onGroupChange 拿到当前叙事组(0=手势/当天,1=调查),
 * 右侧解释文字随之切换。
 * 素材与全部坐标来自正式版 Figma(homeagent 现版)节点几何。
 * prefers-reduced-motion 时渲染静态充能定格,无计时器无交互。
 */

const SCREEN_W = 393;
const VIEW_H = 833;
/** 三帧统一的空底色(逐像素采样),补隙用 */
const BG = "#0b0d11";

const CAL_SRC = "/app/longpress-cal.png";
const DAY_SRC = "/app/longpress-day.png";

/** 日历 26 号 today 圆心与充能 ring */
const CX = 299.64;
const CY = 285;
const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;
const CHARGE_MS = 1600;
const AUTO_DELAY_MS = 700;

/** Day Detail 里「Heart-rate spike」通知卡(2.2 帧内绝对坐标) */
const NOTICE = { x: 16, y: 148, w: 361, h: 76 };
/** 调查提问页「Yes, exercising」快捷回复 chip(2.5 帧内绝对坐标) */
const CHIP = { x: 32, y: 469, w: 124, h: 32 };

type Phase =
  | "calendar"
  | "charging"
  | "unlocked"
  | "day"
  | "dayTap"
  | "invLive"
  | "invQuestion"
  | "invAnswer"
  | "invResolved";

export type JourneyGroup = 0 | 1;

/** 2026-07-28 两块交错改版:整条旅程可按块裁段循环。
    full = 原始整段(日历→调查),gesture = 只循环长按→当天,
    investigation = 只循环调查三态。 */
export type JourneySegment = "full" | "gesture" | "investigation";

const groupOf = (p: Phase): JourneyGroup => (p.startsWith("inv") ? 1 : 0);

const pct = (u: number) => `${(u / VIEW_H) * 100}%`;
const pctW = (u: number) => `${(u / SCREEN_W) * 100}%`;

/* ── 调查页三态:共享区域交叉淡化、变化区域滑入,避免整屏切片感 ── */

interface SliceSpec {
  region: [number, number];
  pin?: "bottom";
  slide?: boolean;
  /** 激活时的入场延迟(秒),做同态内的分行进场 */
  delay?: number;
}

interface InvState {
  src: string;
  slices: SliceSpec[];
}

const INV: Record<"invLive" | "invQuestion" | "invResolved", InvState> = {
  invLive: {
    src: "/app/investigation-live.png",
    slices: [
      { region: [0, 110] }, // 状态栏 + 头部(badge 随态渐变)
      { region: [110, 365] }, // 异常卡 + REASONING + motion 行(live/question 逐像素相同)
      // 核查时间线分行进场:Location 卡 → Calendar 排队 → 状态行
      { region: [361, 481], slide: true, delay: 0.1 },
      { region: [483, 531], slide: true, delay: 0.32 },
      { region: [537, 567], slide: true, delay: 0.52 },
      { region: [570, 633], pin: "bottom" }, // 输入栏钉底
    ],
  },
  invQuestion: {
    src: "/app/investigation-question.png",
    slices: [
      { region: [0, 110] },
      { region: [110, 365] },
      { region: [365, 558], slide: true }, // 提问卡滑入
      { region: [558, 621], pin: "bottom" },
    ],
  },
  invResolved: {
    src: "/app/investigation-resolved.png",
    slices: [
      { region: [0, 110] },
      { region: [110, 796], slide: true }, // 收拢后的全文 + VERDICT 滑入
    ],
  },
};

function InvStateLayer({ state, active }: { state: InvState; active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: active ? 2 : 1 }}>
      {state.slices.map((s) => {
        const [y0, y1] = s.region;
        const outer =
          s.pin === "bottom"
            ? { bottom: 0, height: pct(y1 - y0) }
            : { top: pct(y0), height: pct(y1 - y0) };
        return (
          <motion.div
            key={y0}
            className="absolute inset-x-0 overflow-hidden"
            style={outer}
            initial={false}
            animate={
              s.slide
                ? { opacity: active ? 1 : 0, y: active ? 0 : 14 }
                : { opacity: active ? 1 : 0 }
            }
            transition={{
              duration: s.slide ? 0.45 : 0.3,
              ease: EASE_SOFT,
              delay: active ? (s.delay ?? 0) : 0,
            }}
          >
            <img
              src={state.src}
              alt=""
              draggable={false}
              className="absolute left-0 w-full"
              style={{ top: `${(-y0 / (y1 - y0)) * 100}%` }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * invLive 的「核查进行中」动效层,叠在静态截图上(坐标来自 2.4 节点几何):
 * Location 卡骨架条流光扫过 + 状态行 spinner 旋转(盖住静态图标重画)
 * + 头部 Investigating 圆点呼吸。随相位卸载,不做全局循环。
 */
function LiveCheckingFx() {
  const bars = [
    { x: 70, y: 438, w: 230, h: 9 },
    { x: 70, y: 454, w: 150, h: 9 },
  ];
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 3 }}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, delay: 0.45 }}
    >
      {bars.map((b) => (
        <div
          key={b.y}
          className="absolute overflow-hidden rounded-full"
          style={{ left: pctW(b.x), top: pct(b.y), width: pctW(b.w), height: pct(b.h) }}
        >
          <motion.div
            className="absolute inset-y-0 w-1/2"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(95, 212, 204, 0.20), transparent)",
            }}
            initial={{ x: "-110%" }}
            animate={{ x: "310%" }}
            transition={{ duration: 1.3, ease: "linear", repeat: Infinity, repeatDelay: 0.25 }}
          />
        </div>
      ))}
      {/* 状态行 spinner:小圆片盖住静态图标(所在处为纯底色),画旋转弧 */}
      <div
        className="absolute"
        style={{ left: pctW(78), top: pct(544.5), width: pctW(17), aspectRatio: "1" }}
      >
        <div className="absolute inset-0 rounded-full" style={{ backgroundColor: BG }} />
        <motion.div
          className="absolute inset-[1px] rounded-full border-[1.5px] border-transparent"
          style={{
            borderTopColor: "#37c2ba",
            borderRightColor: "rgba(55, 194, 186, 0.35)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
        />
      </div>
      {/* 头部 Investigating 圆点呼吸(叠在原点上) */}
      <motion.div
        className="absolute rounded-full bg-accent"
        style={{ left: pctW(278), top: pct(78.5), width: pctW(7), aspectRatio: "1" }}
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
      />
    </motion.div>
  );
}

/** 模拟指尖:圆角高亮 + 光点 */
function TapDot({ rect }: { rect: { x: number; y: number; w: number; h: number } }) {
  return (
    <svg
      viewBox={`0 0 ${SCREEN_W} ${VIEW_H}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      style={{ zIndex: 3 }}
    >
      <motion.rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        rx={16}
        fill="rgba(55, 194, 186, 0.16)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
      <motion.circle
        cx={rect.x + rect.w / 2}
        cy={rect.y + rect.h / 2}
        r={17}
        fill="rgba(242, 245, 246, 0.12)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
    </svg>
  );
}

interface PhoneJourneyProps {
  alt: string;
  onGroupChange?: (group: JourneyGroup) => void;
  segment?: JourneySegment;
}

export default function PhoneJourney({
  alt,
  onGroupChange,
  segment = "full",
}: PhoneJourneyProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.4 });

  const [phase, setPhase] = useState<Phase>(
    segment === "investigation" ? "invLive" : "calendar",
  );
  const [done, setDone] = useState(false);
  const progress = useMotionValue(0);
  const dashOffset = useTransform(progress, (p) => RING_C * (1 - p));

  const heldRef = useRef(false);
  const autoRef = useRef(false);
  const playedRef = useRef(false);
  /** 长按松手后浏览器会补发 click;短窗口抑制,防止误命中下一屏的热区 */
  const suppressClickRef = useRef(false);
  /** 首播启动 timer 单独持有:访客抢先按下时要能显式取消,不能被它抢回控制权 */
  const autoStartRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const chargeRef = useRef<AnimationPlaybackControls | null>(null);
  const enterPhaseRef = useRef<(p: Phase) => void>(() => {});

  useEffect(() => {
    onGroupChange?.(groupOf(phase));
    if (import.meta.env.DEV) {
      // 录屏管线的剪辑定位探针:相位变更时间线(scripts/capture-journey.py 读)
      const w = window as unknown as {
        __journeyLog?: Array<{ phase: string; t: number }>;
      };
      (w.__journeyLog ??= []).push({ phase, t: performance.now() });
    }
  }, [phase, onGroupChange]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  /* startCharge 必须声明在 enterPhase 之前:后者的依赖数组在渲染期求值,
     引用后声明的 const 会 TDZ 崩(它俩的运行期互引本来就靠 enterPhaseRef 解环) */
  const startCharge = useCallback(() => {
    chargeRef.current?.stop();
    setPhase("charging");
    const remaining = Math.max(0.05, ((1 - progress.get()) * CHARGE_MS) / 1000);
    chargeRef.current = animate(progress, 1, {
      duration: remaining,
      ease: "linear",
      onComplete: () => enterPhaseRef.current("unlocked"),
    });
  }, [progress]);

  /** 相位机:进入相位并排好该相位的自动推进;访客动作 = 直接 enterPhase 跳转 */
  const enterPhase = useCallback(
    (p: Phase) => {
      clearTimers();
      setPhase(p);
      const next = () => enterPhaseRef.current;
      switch (p) {
        case "unlocked":
          later(() => next()("day"), 520);
          break;
        case "day":
          if (segment === "gesture") {
            // 裁段循环:当天页停 2.6s 后放电重来,不进调查流
            later(() => {
              progress.set(0);
              setPhase("calendar");
              later(() => {
                autoRef.current = true;
                startCharge();
              }, 900);
            }, 2600);
          } else {
            later(() => next()("dayTap"), 1700);
          }
          break;
        case "dayTap":
          later(() => next()("invLive"), 500);
          break;
        case "invLive":
          later(() => next()("invQuestion"), 2800);
          break;
        case "invQuestion":
          later(() => next()("invAnswer"), 2300);
          break;
        case "invAnswer":
          later(() => next()("invResolved"), 750);
          break;
        case "invResolved":
          setDone(true);
          if (segment === "investigation") {
            // 裁段循环:解案页停 3.6s 后从调查头重播
            later(() => next()("invLive"), 3600);
          }
          break;
        default:
          break;
      }
    },
    [clearTimers, later, segment, progress, startCharge],
  );
  enterPhaseRef.current = enterPhase;

  /** 提前松手:放电退回 */
  const discharge = useCallback(() => {
    chargeRef.current?.stop();
    chargeRef.current = animate(progress, 0, { duration: 0.35, ease: "easeOut" });
    setPhase("calendar");
  }, [progress]);

  // 启动 timer 由本 effect 自清理(StrictMode 双执行安全);played 只在真正开跑时置位
  useEffect(() => {
    if (!inView || reduced || playedRef.current) return;
    autoStartRef.current = window.setTimeout(() => {
      autoStartRef.current = null;
      playedRef.current = true;
      autoRef.current = true;
      // investigation 裁段没有充能入口,直接从调查头开播
      if (segment === "investigation") enterPhaseRef.current("invLive");
      else startCharge();
    }, AUTO_DELAY_MS);
    return () => {
      if (autoStartRef.current !== null) {
        window.clearTimeout(autoStartRef.current);
        autoStartRef.current = null;
      }
    };
  }, [inView, reduced, startCharge, segment]);

  useEffect(
    () => () => {
      clearTimers();
      chargeRef.current?.stop();
    },
    [clearTimers],
  );

  if (reduced) {
    // investigation 裁段的静态定格是解案页,不是日历
    if (segment === "investigation") {
      return (
        <div
          role="img"
          aria-label={alt}
          className="relative w-full overflow-hidden rounded-[2.25rem]"
          style={{ aspectRatio: `${SCREEN_W} / ${VIEW_H}`, backgroundColor: BG }}
        >
          <img
            src="/app/investigation-resolved.png"
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      );
    }
    return (
      <div
        role="img"
        aria-label={alt}
        className="relative w-full overflow-hidden rounded-[2.25rem]"
        style={{ aspectRatio: `${SCREEN_W} / ${VIEW_H}`, backgroundColor: BG }}
      >
        <img src={CAL_SRC} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
        <svg
          viewBox={`0 0 ${SCREEN_W} ${VIEW_H}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <circle cx={CX} cy={CY} r={19} fill="rgba(242, 245, 246, 0.10)" />
          <g transform={`rotate(-90 ${CX} ${CY})`}>
            <circle
              cx={CX}
              cy={CY}
              r={RING_R}
              fill="none"
              stroke="#37c2ba"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * 0.35}
              style={{ filter: "drop-shadow(0 0 6px rgba(55, 194, 186, 0.55))" }}
            />
          </g>
        </svg>
      </div>
    );
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "calendar" && phase !== "charging") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    // 访客接管:取消待发的自动首播,并视为已播过
    if (autoStartRef.current !== null) {
      window.clearTimeout(autoStartRef.current);
      autoStartRef.current = null;
      playedRef.current = true;
    }
    clearTimers();
    autoRef.current = false;
    heldRef.current = true;
    startCharge();
  };

  const endHold = () => {
    if (heldRef.current) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
    }
    heldRef.current = false;
    if (phase === "charging" && !autoRef.current) discharge();
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SCREEN_W;
    const y = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    const inside = (r: { x: number; y: number; w: number; h: number }) =>
      x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

    if (
      segment !== "gesture" &&
      (phase === "day" || phase === "dayTap") &&
      inside(NOTICE)
    ) {
      enterPhase("invLive");
    } else if (phase === "invQuestion" && inside(CHIP)) {
      enterPhase("invAnswer");
    } else if (phase === "invResolved") {
      clearTimers();
      if (segment === "investigation") {
        // 裁段重放:回调查头,不回日历
        enterPhase("invLive");
      } else {
        // 整段旅程重放
        progress.set(0);
        setPhase("calendar");
        later(() => {
          autoRef.current = true;
          startCharge();
        }, 900);
      }
    }
  };

  const dayOpen = phase !== "calendar" && phase !== "charging" && phase !== "unlocked";
  const invOpen = phase.startsWith("inv");
  const gestureVisible = phase === "charging" || phase === "unlocked";

  return (
    <div ref={rootRef} className="w-full">
      {/* role=group 不是 img:这个根元素绑着长按/点击交互,自称静态图片
          对读屏用户是错误语义(2026-07-28 评审);reduced 分支才是真 img */}
      <div
        role="group"
        aria-label={alt}
        onPointerDown={onPointerDown}
        onPointerUp={endHold}
        onPointerCancel={endHold}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        className="relative w-full select-none overflow-hidden rounded-[2.25rem]"
        style={{
          aspectRatio: `${SCREEN_W} / ${VIEW_H}`,
          backgroundColor: BG,
          // pan-y:保留纵向滚动,浏览器接管滚动时 pointercancel → 放电
          touchAction: "pan-y",
          WebkitTouchCallout: "none",
        }}
      >
        {/* L0 日历(iOS push 视差:被推开时左移 + 压暗) */}
        <motion.img
          src={CAL_SRC}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full"
          animate={{
            x: dayOpen ? "-28%" : "0%",
            filter: dayOpen ? "brightness(0.55)" : "brightness(1)",
          }}
          transition={{ duration: 0.5, ease: EASE_SOFT }}
        />

        {/* 手势层:指尖光点 + 充能弧 */}
        <svg
          viewBox={`0 0 ${SCREEN_W} ${VIEW_H}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <AnimatePresence>
            {gestureVisible && (
              <motion.circle
                cx={CX}
                cy={CY}
                r={19}
                fill="rgba(242, 245, 246, 0.10)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
          <g transform={`rotate(-90 ${CX} ${CY})`}>
            <motion.circle
              cx={CX}
              cy={CY}
              r={RING_R}
              fill="none"
              stroke="#37c2ba"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={RING_C}
              style={{
                strokeDashoffset: dashOffset,
                filter: "drop-shadow(0 0 6px rgba(55, 194, 186, 0.55))",
              }}
              animate={{ opacity: gestureVisible ? 1 : 0 }}
              transition={{ duration: 0.15 }}
            />
          </g>
        </svg>

        {/* 解锁脉冲(HTML 层做 scale,避开 SVG transform-origin 兼容问题) */}
        <AnimatePresence>
          {phase === "unlocked" && (
            <motion.div
              className="pointer-events-none absolute rounded-full border-2 border-accent-soft"
              style={{
                left: `${((CX - RING_R) / SCREEN_W) * 100}%`,
                top: `${((CY - RING_R) / VIEW_H) * 100}%`,
                width: `${((RING_R * 2) / SCREEN_W) * 100}%`,
                aspectRatio: "1",
              }}
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.7, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* L1 Day Detail:iOS push;进入调查时同样被推开 */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={false}
          animate={{ x: dayOpen ? "0%" : "104%" }}
          transition={{ duration: 0.5, ease: EASE_SOFT }}
          style={{ boxShadow: "-24px 0 48px rgba(0, 0, 0, 0.5)", backgroundColor: BG }}
        >
          <motion.img
            src={DAY_SRC}
            alt=""
            draggable={false}
            className="absolute left-0 top-0 w-full"
            animate={{
              x: invOpen ? "-28%" : "0%",
              filter: invOpen ? "brightness(0.55)" : "brightness(1)",
            }}
            transition={{ duration: 0.5, ease: EASE_SOFT }}
          />
          <AnimatePresence>{phase === "dayTap" && <TapDot rect={NOTICE} />}</AnimatePresence>
        </motion.div>

        {/* L2 调查页:iOS push;内部三态区域过渡 */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={false}
          animate={{ x: invOpen ? "0%" : "104%" }}
          transition={{ duration: 0.5, ease: EASE_SOFT }}
          style={{ boxShadow: "-24px 0 48px rgba(0, 0, 0, 0.5)", backgroundColor: BG }}
        >
          <InvStateLayer state={INV.invLive} active={phase === "invLive"} />
          <InvStateLayer
            state={INV.invQuestion}
            active={phase === "invQuestion" || phase === "invAnswer"}
          />
          <InvStateLayer state={INV.invResolved} active={phase === "invResolved"} />
          <AnimatePresence>{phase === "invLive" && <LiveCheckingFx />}</AnimatePresence>
          <AnimatePresence>{phase === "invAnswer" && <TapDot rect={CHIP} />}</AnimatePresence>
        </motion.div>
      </div>

      <motion.p
        className="mt-3 text-center font-mono text-[11px] tracking-[0.18em] text-ink-faint"
        initial={{ opacity: 0 }}
        animate={{ opacity: done && phase === "invResolved" ? 1 : 0 }}
        transition={{ duration: 0.6, ease: EASE_SOFT }}
        aria-hidden={!(done && phase === "invResolved")}
      >
        {"// tap to replay"}
      </motion.p>
    </div>
  );
}
