/**
 * Dashboard 数据层(演示版,2026-07-29)
 *
 * 形状对齐 ripple-core 的 baseline 口径:每天每个体征有 7 天均值 vs 30 天均值,
 * 偏差超过 30 天均值的约 7% 记为 watch(与官网 FAQ / 后端 anomaly 引擎同一说法);
 * 状态只有 normal / watch 两元,与 app 一致。
 * 九个指标的 id 与人话名直接取自 ripple-core `explain.ts` 的 METRIC_LABEL,不另造。
 *
 * 数据本身是确定性种子生成的演示数据(页面上有 Sample data 标注)。
 * 将来接真后端:实现 DashboardSource.load() 从 ripple-core 拉真实 baseline,
 * demoSource 原样退役,页面层不动。
 */

export type MetricId =
  | "hrv_sdnn"
  | "resting_heart_rate"
  | "heart_rate"
  | "respiratory_rate"
  | "spo2"
  | "step_count"
  | "active_energy"
  | "sleep_hours"
  | "sleep_efficiency";

export interface MetricDef {
  id: MetricId;
  label: string;
  unit: string;
  decimals: number;
}

/** 展示顺序:HRV 打头(示范位),其余按 心肺 → 活动 → 睡眠 */
export const METRICS: MetricDef[] = [
  { id: "hrv_sdnn", label: "HRV", unit: "ms", decimals: 0 },
  { id: "resting_heart_rate", label: "Resting heart rate", unit: "bpm", decimals: 0 },
  { id: "heart_rate", label: "Heart rate", unit: "bpm", decimals: 0 },
  { id: "respiratory_rate", label: "Respiratory rate", unit: "br/min", decimals: 1 },
  { id: "spo2", label: "Blood oxygen", unit: "%", decimals: 1 },
  { id: "step_count", label: "Steps", unit: "", decimals: 0 },
  { id: "active_energy", label: "Active energy", unit: "kcal", decimals: 0 },
  { id: "sleep_hours", label: "Sleep", unit: "h", decimals: 1 },
  { id: "sleep_efficiency", label: "Sleep efficiency", unit: "%", decimals: 0 },
];

export interface DayMetric {
  value: number;
  avg7: number;
  avg30: number;
  /** (avg7 − avg30) / avg30 × 100,ripple-core 的 deviation_pct 同口径 */
  deviationPct: number;
  status: "normal" | "watch";
}

export interface DayRecord {
  /** YYYY-MM-DD(本地时区) */
  date: string;
  status: "normal" | "watch";
  metrics: Record<MetricId, DayMetric>;
  /** 当天偏离基线的指标,按偏差绝对值降序 */
  watch: MetricId[];
}

export interface DashboardData {
  /** 升序,最后一项是最新一天 */
  days: DayRecord[];
}

/** 接真后端时的替换点:真实实现从 ripple-core 拉 baseline,签名不变 */
export interface DashboardSource {
  load(): Promise<DashboardData>;
}

/** 与 FAQ / ripple-core 同口径的 watch 阈值(≈7%) */
export const WATCH_THRESHOLD_PCT = 7;

/* ── 确定性伪随机(mulberry32):同一天打开,数据完全一致 ── */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MetricModel {
  base: number;
  /** 日间噪声幅度(相对 base) */
  noise: number;
  /** 慢波动幅度(相对 base),模拟自然周期 */
  drift: number;
  min: number;
  max: number;
}

const MODELS: Record<MetricId, MetricModel> = {
  hrv_sdnn: { base: 48, noise: 0.08, drift: 0.05, min: 18, max: 90 },
  resting_heart_rate: { base: 56, noise: 0.03, drift: 0.02, min: 44, max: 78 },
  heart_rate: { base: 74, noise: 0.05, drift: 0.03, min: 55, max: 110 },
  respiratory_rate: { base: 14.2, noise: 0.04, drift: 0.02, min: 11, max: 20 },
  spo2: { base: 97.4, noise: 0.006, drift: 0.003, min: 93, max: 100 },
  /* 步数/能量的日噪声若给到真实量级(±30%),7 日均值的抖动就能独自越过
     7% 阈值,日历一片 amber —— 演示数据刻意收敛,让 watch 日基本来自剧情 */
  step_count: { base: 8200, noise: 0.12, drift: 0.06, min: 900, max: 22000 },
  active_energy: { base: 520, noise: 0.12, drift: 0.05, min: 120, max: 1400 },
  sleep_hours: { base: 7.3, noise: 0.09, drift: 0.04, min: 4.2, max: 10 },
  sleep_efficiency: { base: 91, noise: 0.03, drift: 0.015, min: 72, max: 100 },
};

/**
 * 演示剧情:近期两段短偏离期(日视图的戏),往前再铺几段拉长的偏离期
 * (10-14 天,像一次生病 / 出差 / 训练周期),让周/月/年视图有可看的起伏。
 * 数字全是演示数据,页面有 Sample data 标注。
 */
const EPISODES: {
  fromDaysAgo: number;
  toDaysAgo: number;
  shift: Partial<Record<MetricId, number>>;
}[] = [
  {
    fromDaysAgo: 14,
    toDaysAgo: 11,
    shift: {
      hrv_sdnn: -0.13,
      resting_heart_rate: 0.09,
      sleep_hours: -0.15,
      sleep_efficiency: -0.05,
    },
  },
  {
    fromDaysAgo: 37,
    toDaysAgo: 35,
    shift: {
      step_count: 0.45,
      active_energy: 0.42,
      hrv_sdnn: -0.06,
      heart_rate: 0.05,
    },
  },
  {
    fromDaysAgo: 96,
    toDaysAgo: 90,
    shift: { sleep_hours: -0.12, sleep_efficiency: -0.05, hrv_sdnn: -0.08 },
  },
  {
    fromDaysAgo: 205,
    toDaysAgo: 192,
    shift: { hrv_sdnn: -0.11, resting_heart_rate: 0.07, respiratory_rate: 0.06 },
  },
  {
    fromDaysAgo: 390,
    toDaysAgo: 376,
    shift: { step_count: 0.32, active_energy: 0.3, heart_rate: 0.05 },
  },
  {
    fromDaysAgo: 615,
    toDaysAgo: 602,
    shift: { sleep_hours: -0.13, hrv_sdnn: -0.09, resting_heart_rate: 0.06 },
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;
/** 对外暴露的天数:两年 —— dashboard 年视图(24 个月逐月)要吃满它 */
const VISIBLE_DAYS = 760;
/** 额外的前置天数,让第一天的 30 日均值也算得出来 */
const LEAD_DAYS = 30;

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function buildData(today: Date): DashboardData {
  const total = VISIBLE_DAYS + LEAD_DAYS;
  const start = new Date(today.getTime() - (total - 1) * DAY_MS);

  // 每个指标一条独立随机流(种子固定),互不干扰
  const rand: Record<MetricId, () => number> = Object.fromEntries(
    METRICS.map((m, i) => [m.id, mulberry32(0x52495050 + i * 97)]),
  ) as Record<MetricId, () => number>;

  // 先生成原始序列
  const series: Record<MetricId, number[]> = Object.fromEntries(
    METRICS.map((m) => [m.id, [] as number[]]),
  ) as Record<MetricId, number[]>;

  for (let i = 0; i < total; i++) {
    const daysAgo = total - 1 - i;
    for (const def of METRICS) {
      const model = MODELS[def.id];
      const mIdx = METRICS.findIndex((m) => m.id === def.id);
      /* 周期取 6 天:7 日窗恰好磨平一个整周期,慢波动不会独自把
         avg7/avg30 顶过 7% 阈值 —— watch 日应主要来自 EPISODES 剧情,
         否则日历一片 amber,与"most days, you do nothing"相悖 */
      const wave = Math.sin((i / 6) * Math.PI * 2) * model.drift;
      /* 季节性慢波(周期约 4 个月,幅度 ~3%,各指标错相位):
         短窗里几乎看不见,月/年视图的起伏靠它 —— 否则月均把
         6 天小波全部磨平,曲线是条死直线 */
      const seasonal =
        Math.sin((i / 121) * Math.PI * 2 + mIdx * 1.7) * model.drift * 0.6;
      const noise = (rand[def.id]() * 2 - 1) * model.noise;
      let factor = 1 + wave + seasonal + noise;
      for (const ep of EPISODES) {
        if (daysAgo <= ep.fromDaysAgo && daysAgo >= ep.toDaysAgo) {
          factor *= 1 + (ep.shift[def.id] ?? 0);
        }
      }
      series[def.id].push(clamp(model.base * factor, model.min, model.max));
    }
  }

  const avgOf = (arr: number[], end: number, span: number) => {
    const from = Math.max(0, end - span + 1);
    const slice = arr.slice(from, end + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  };

  const days: DayRecord[] = [];
  for (let i = LEAD_DAYS; i < total; i++) {
    const date = new Date(start.getTime() + i * DAY_MS);
    const metrics = {} as Record<MetricId, DayMetric>;
    const watch: MetricId[] = [];
    for (const def of METRICS) {
      const arr = series[def.id];
      const avg7 = avgOf(arr, i, 7);
      const avg30 = avgOf(arr, i, 30);
      const deviationPct = ((avg7 - avg30) / avg30) * 100;
      const status =
        Math.abs(deviationPct) >= WATCH_THRESHOLD_PCT ? "watch" : "normal";
      metrics[def.id] = { value: arr[i], avg7, avg30, deviationPct, status };
      if (status === "watch") watch.push(def.id);
    }
    watch.sort(
      (a, b) =>
        Math.abs(metrics[b].deviationPct) - Math.abs(metrics[a].deviationPct),
    );
    days.push({
      date: toDateKey(date),
      status: watch.length > 0 ? "watch" : "normal",
      metrics,
      watch,
    });
  }
  return { days };
}

let cached: { key: string; data: DashboardData } | null = null;

/** 演示数据源:以"今天"为终点的 60 天,当天内结果稳定 */
export function getDemoDashboard(): DashboardData {
  const today = new Date();
  const key = toDateKey(today);
  if (cached?.key === key) return cached.data;
  cached = { key, data: buildData(today) };
  return cached.data;
}

export const demoSource: DashboardSource = {
  load: () => Promise.resolve(getDemoDashboard()),
};

/** 取某指标截至 endDate(含)的最近 n 天数值,给迷你走势图用 */
export function getSeries(
  data: DashboardData,
  metric: MetricId,
  endDate: string,
  n: number,
): number[] {
  const idx = data.days.findIndex((d) => d.date === endDate);
  if (idx === -1) return [];
  const from = Math.max(0, idx - n + 1);
  return data.days.slice(from, idx + 1).map((d) => d.metrics[metric].value);
}

export function metricDef(id: MetricId): MetricDef {
  return METRICS.find((m) => m.id === id)!;
}

/** 数值格式化(步数带千分位,其余按 decimals) */
export function formatValue(id: MetricId, value: number): string {
  const def = metricDef(id);
  if (id === "step_count") return Math.round(value).toLocaleString("en-US");
  return value.toFixed(def.decimals);
}
