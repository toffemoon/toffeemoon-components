"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  HeartPulse,
  MessagesSquare,
  Trash2,
} from "lucide-react";
import RippleMark from "@/components/ripple-mark";

/**
 * Style guide v2 提案:官网视觉与 iOS app 对齐(深色 + 单 teal)。
 * 真源 = ripple-ios RippleColor.swift / RippleStyle.swift。
 * 挂在 ?styleguide 下,仅展示,不影响现有官网页面。
 */

const swatchGroups: {
  title: string;
  note: string;
  swatches: { name: string; hex: string; use: string; className: string; border?: boolean }[];
}[] = [
  {
    title: "基底",
    note: "蓝黑底是刻意的,不用纯黑;层级靠亮度抬,不靠阴影",
    swatches: [
      { name: "bg", hex: "#0A0C0F", use: "页面底", className: "bg-app-bg", border: true },
      { name: "surface", hex: "#15181C", use: "卡片 / 面板", className: "bg-app-surface", border: true },
      { name: "surface-2", hex: "#1B2026", use: "hover / 再抬一级 [web]", className: "bg-app-surface-2", border: true },
      { name: "hairline", hex: "white 6%", use: "分隔线 / 描边", className: "bg-app-hairline", border: true },
    ],
  },
  {
    title: "文字",
    note: "三级灰阶,全部偏冷",
    swatches: [
      { name: "ink", hex: "#F2F5F6", use: "主文字", className: "bg-app-ink" },
      { name: "ink-2", hex: "#9AA1A6", use: "次文字 / 说明", className: "bg-app-ink-2" },
      { name: "ink-3", hex: "#6A7176", use: "三级 / 占位", className: "bg-app-ink-3" },
    ],
  },
  {
    title: "品牌",
    note: "全站唯一品牌色 teal,克制使用:按钮 / 激活态 / 指示",
    swatches: [
      { name: "accent", hex: "#37C2BA", use: "主 CTA / 激活", className: "bg-app-accent" },
      { name: "accent-light", hex: "#5FD4CC", use: "高亮 / focus", className: "bg-app-accent-light" },
      { name: "accent-muted", hex: "teal 16%", use: "icon chip 底", className: "bg-app-accent-muted", border: true },
      { name: "on-accent", hex: "#06201E", use: "teal 按钮上的字", className: "bg-app-on-accent", border: true },
    ],
  },
  {
    title: "语义",
    note: "wellness-safe:偏离用柔 amber 不用红;coral 只给破坏性操作和异常标记",
    swatches: [
      { name: "warning", hex: "#E6B45A", use: "偏离基线 delta", className: "bg-app-warning" },
      { name: "danger", hex: "#FF6B5E", use: "破坏性 / 异常点", className: "bg-app-danger" },
    ],
  },
];

const typeScale = [
  { label: "display · 40 bold tight", className: "text-[40px] font-bold tracking-tight leading-[1.1]", sample: "July 2026" },
  { label: "h1 · 32 bold", className: "text-[32px] font-bold tracking-tight leading-[1.15]", sample: "Ripple checks on you." },
  { label: "h2 · 24 semibold", className: "text-2xl font-semibold tracking-tight", sample: "Most days, you do nothing." },
  { label: "h3 · 20 semibold", className: "text-xl font-semibold", sample: "Connected sources" },
  { label: "body · 16", className: "text-base", sample: "Ripple reads your vitals, learns your personal baseline, and speaks first." },
  { label: "small · 14", className: "text-sm", sample: "Hold the date for Ripple's read" },
];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-app-ink-2">{title}</p>
      {note && <p className="mt-1.5 text-sm text-app-ink-3">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function StyleguideApp() {
  return (
    <div
      className="min-h-screen bg-app-bg px-6 py-14 font-sans text-app-ink lg:px-8"
      style={{ "--color-accent": "#37c2ba" } as CSSProperties}
    >
      <div className="mx-auto max-w-[1080px]">
        {/* Header */}
        <div className="flex items-center gap-3">
          <RippleMark className="h-8 w-8" />
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Ripple 官网 · Style Guide v2 提案</h1>
            <p className="mt-1 text-sm text-app-ink-2">
              与 iOS app 对齐:深色 + 单 teal · 真源 RippleColor.swift · 2026-07-22
            </p>
          </div>
        </div>

        {/* 色板 */}
        {swatchGroups.map((group) => (
          <Section key={group.title} title={group.title} note={group.note}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {group.swatches.map((s) => (
                <div
                  key={s.name}
                  className="overflow-hidden rounded-2xl border border-app-hairline bg-app-surface"
                >
                  <div
                    className={`h-20 ${s.className} ${s.border ? "border-b border-app-hairline" : ""}`}
                  />
                  <div className="p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">{s.name}</span>
                      <span className="font-mono text-xs text-app-ink-3">{s.hex}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-app-ink-2">{s.use}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ))}

        {/* 字阶 */}
        <Section
          title="字阶"
          note="app 用 SF Pro;web 等价 = Inter,同为紧排 grotesque。kicker 全大写 + 0.5 tracking 是 app 的段落开头习惯"
        >
          <div className="flex flex-col gap-5 rounded-2xl border border-app-hairline bg-app-surface p-6">
            {typeScale.map((t) => (
              <div key={t.label} className="flex flex-col gap-1 border-b border-app-hairline pb-5 last:border-b-0 last:pb-0">
                <span className="font-mono text-xs text-app-ink-3">{t.label}</span>
                <span className={t.className}>{t.sample}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-app-ink-3">kicker · 13 semibold uppercase</span>
              <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-app-ink-2">
                Ripple will read
              </span>
            </div>
          </div>
        </Section>

        {/* 圆角与间距 */}
        <Section title="圆角 · 间距 · 点击域" note="圆角 12 / 16 / 20 + pill;间距 4px 基阶;最小点击域 44,主按钮 54">
          <div className="flex flex-wrap items-end gap-5">
            {[
              { r: "12px", cls: "rounded-xl" },
              { r: "16px", cls: "rounded-2xl" },
              { r: "20px", cls: "rounded-[20px]" },
              { r: "pill", cls: "rounded-full" },
            ].map((x) => (
              <div key={x.r} className="flex flex-col items-center gap-2">
                <div className={`h-20 w-28 border border-app-hairline-2 bg-app-surface ${x.cls}`} />
                <span className="font-mono text-xs text-app-ink-3">{x.r}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 组件样例 */}
        <Section title="组件" note="主按钮带 teal 光晕(accent 35% · blur 9 · y 6),这是 app 的招牌细节">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* 按钮列 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-app-hairline bg-app-surface p-6">
              <button className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-app-accent text-base font-semibold text-app-on-accent shadow-[0_6px_18px_rgba(55,194,186,0.35)] transition-colors hover:bg-app-accent-hover">
                Join the waitlist
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="flex min-h-[44px] w-full items-center justify-center text-sm font-medium text-app-ink-2">
                Maybe later
              </button>
              <button className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-app-danger/40 text-sm font-medium text-app-danger">
                <Trash2 className="h-4 w-4" />
                Delete account
              </button>
              <div className="flex items-center gap-3 border-t border-app-hairline pt-4">
                {[HeartPulse, Bell, MessagesSquare].map((Icon, i) => (
                  <span key={i} className="flex h-11 w-11 items-center justify-center rounded-xl bg-app-accent-muted">
                    <Icon className="h-5 w-5 text-app-accent" />
                  </span>
                ))}
                <span className="text-xs text-app-ink-3">icon chip = teal 16% 底 + teal 图标</span>
              </div>
              <input
                placeholder="you@example.com"
                className="min-h-[48px] rounded-2xl border border-app-hairline-2 bg-app-bg px-4 text-base text-app-ink outline-none placeholder:text-app-ink-3 focus:border-app-accent"
              />
            </div>

            {/* 通知卡 + 日历格 + delta */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-app-hairline bg-app-surface p-4">
                <div className="flex items-center gap-2">
                  <RippleMark className="h-4 w-4" />
                  <span className="text-[11px] font-medium tracking-[0.18em] text-app-ink-3">RIPPLE</span>
                  <span className="ml-auto text-xs text-app-ink-3">now</span>
                </div>
                <p className="mt-2.5 text-[15px] leading-relaxed text-app-ink">
                  Heart rate 146 — that&apos;s 53 above your baseline. Exercising in place?
                </p>
                <div className="mt-3 flex gap-2">
                  {["Just worked out", "Not sure"].map((chip) => (
                    <span key={chip} className="rounded-full border border-app-hairline-2 px-3.5 py-1.5 text-[13px] text-app-ink-2">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-app-hairline bg-app-surface p-4">
                <p className="mb-3 text-xs text-app-ink-3">日历格:普通 / 今天 / 异常 / 调查</p>
                <div className="flex gap-2.5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-surface-2 text-sm text-app-ink-2">17</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-app-accent bg-app-surface-2 text-sm font-semibold text-app-accent">18</span>
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-app-surface-2 text-sm text-app-ink-2">
                    19
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-app-danger" />
                  </span>
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-app-surface-2 text-sm text-app-ink-2">
                    20
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-app-accent" />
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-app-hairline bg-app-surface p-4">
                <div>
                  <p className="text-sm text-app-ink-2">HRV · 7d vs 30d</p>
                  <p className="mt-0.5 text-xl font-semibold">
                    42 ms <span className="text-sm font-medium text-app-warning">−12%</span>
                  </p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-app-accent-muted px-3 py-1.5 text-xs font-medium text-app-accent">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Logged
                </span>
              </div>
            </div>
          </div>
        </Section>

        <p className="mt-14 border-t border-app-hairline pt-6 text-sm leading-relaxed text-app-ink-3">
          说明:此提案取代 2026-06-26 暖色系定稿的方向。定稿后 app-* 值将替换全站语义
          token,现有官网页面再按此重排。成功态不用绿色 —— 系统里没有绿色,确认用 teal。
        </p>
      </div>
    </div>
  );
}
