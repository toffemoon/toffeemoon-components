/* Features 页内容源(2026-08-02 雨钦重构:三大 3D 演示 + 小功能行)。
   三大演示次序(8-02 二次指令):01 cross-signal(并入 clarifying
   question)→ 02 press and hold → 03 range review;每块配一台滚动驱动
   3D 手机,屏幕贴真实录屏(雨钦 8-02 提供,ffmpeg 转 WebM/VP9 + H.264
   双格式,素材在 public/app/feature-*)。
   其余能力降为小功能行,不带展示位。取代上一版 03–08 六项证据账本
   (FEATURE_EVIDENCE,可从 commit c9bba03 捞回)。 */

export interface FeatureDemoRow {
  name: string;
  note: string;
}

export interface FeatureDemo {
  index: string;
  kicker: string;
  titleRoman: string;
  titleItalic: string;
  para: string;
  listLabel: string;
  status: string;
  rows: readonly FeatureDemoRow[];
  /** public/app/ 下的素材基名:`${video}.webm` / `.mp4` / `.png`(首帧垫底) */
  video: string;
  /** 3D 版描述(有"转过来"的叙述) */
  alt: string;
  /** flat fallback 版描述(没有 3D 手机,不能沿用 alt) */
  altFlat: string;
}

export interface FeatureMoreItem {
  kicker: string;
  title: string;
  detail: string;
}

export const FEATURE_DEMOS: readonly FeatureDemo[] = [
  {
    index: "01",
    kicker: "CROSS-SIGNAL ANALYSIS",
    titleRoman: "One signal spikes.",
    titleItalic: "The rest gets checked.",
    /* clarifying question 并入本块(2026-08-02 雨钦):数据分不出两种解释时,
       停下来问一个有用的问题,不用猜的填空 */
    para: "When something drifts, Ripple checks your personal baseline, recent readings, the surrounding days across other signals, and the plans or habits you chose to record. If the data cannot separate two plausible explanations, it pauses and asks you one useful question instead of guessing. Then it tells you what lines up, and why.",
    listLabel: "EVIDENCE · CROSS-CHECKED",
    status: "CHECKED",
    rows: [
      { name: "your baseline", note: "the reading against your normal band" },
      { name: "surrounding signals", note: "the last days across all readings" },
      { name: "recorded context", note: "plans, activities, and habits you added" },
      { name: "one question, when needed", note: "asked only when data cannot decide" },
    ],
    video: "feature-cross-signal",
    alt: "A 3D iPhone turning to face you, then playing a screen recording of Ripple investigating a drift: cross-checking signals, asking one clarifying question, and explaining the result",
    altFlat:
      "Screen recording of Ripple investigating a drift: cross-checking signals, asking one clarifying question, and explaining the result",
  },
  {
    index: "02",
    kicker: "PRESS AND HOLD",
    titleRoman: "Hold anything you see.",
    titleItalic: "Ripple explains it.",
    /* 2026-08-02 雨钦扩写:每一个组件、看到的每一个东西都可以长按 ——
       覆盖面从"date/signal/plan/case"升级为全组件主张 */
    para: "Everything on screen answers to the same gesture. Press and hold a date, a signal, a chart, a plan, a case — any element you can see — and a ring charges under your finger, a soft haptic answers back, and a structured explanation opens with what Ripple checked. No menu and no blank prompt to start.",
    listLabel: "GESTURE · WORKS ON EVERYTHING",
    status: "ACTIVE",
    rows: [
      { name: "a date", note: "the whole day, signals and plans together" },
      { name: "a signal", note: "recent readings against your own baseline" },
      { name: "a chart", note: "what the line is doing, and why" },
      { name: "a plan or case", note: "recorded context or a past investigation" },
      { name: "everything else", note: "one gesture, the same structured read" },
    ],
    video: "feature-press-hold",
    alt: "A 3D iPhone turning to face you, then playing a screen recording of Ripple's long-press gesture opening a structured explanation",
    altFlat:
      "Screen recording of Ripple's long-press gesture opening a structured explanation",
  },
  {
    index: "03",
    kicker: "RANGE REVIEW",
    titleRoman: "Drag across dates.",
    titleItalic: "See the longer story.",
    para: "Drag across the calendar to pick a run of days, and Ripple reads the period as one thread: how a signal moved against your own baseline over weeks, not just on the day it drifted. Follow a change for as long as it takes to understand it.",
    listLabel: "RANGE · ONE DRAG",
    status: "ACTIVE",
    rows: [
      { name: "select a period", note: "drag from a start date to an end date" },
      { name: "read it whole", note: "the range compared with your normal band" },
      { name: "follow the change", note: "keep the thread open past the first alert" },
    ],
    video: "feature-range-review",
    alt: "A 3D iPhone turning to face you, then playing a screen recording of a date-range review: dragging across days and reading the period against a personal baseline",
    altFlat:
      "Screen recording of a date-range review: dragging across days and reading the period against a personal baseline",
  },
] as const;

/* 小功能行:不带展示位的能力清单(2026-08-02 雨钦:"其他删掉的做成小功能,
   不放展示的";SHOWS ITS WORK 经确认一并收进这里) */
export const FEATURE_MORE: readonly FeatureMoreItem[] = [
  {
    kicker: "SHOWS ITS WORK",
    title: "Every answer keeps its receipts.",
    detail:
      "Confidence, the evidence checked, and the investigation steps stay attached to the read.",
  },
  {
    kicker: "CASE HISTORY",
    title: "Unusual days keep their case.",
    detail:
      "A resolved anomaly can be reopened later as the investigation it was, not a stray notification.",
  },
  {
    kicker: "CHOSEN CONTEXT",
    title: "It uses what you decide to record.",
    detail:
      "Plans and habits you add become named context inside a read, never a hidden profile.",
  },
  {
    kicker: "QUIET NOTICES",
    title: "It can notice first, without the noise.",
    detail:
      "A notice begins with a detected change in your body, not a schedule, and quiet hours stay quiet.",
  },
] as const;
