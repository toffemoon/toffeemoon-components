"use client";

import { motion } from "motion/react";
import { Link } from "react-router-dom";
import RippleLogoMark from "@/components/ripple-logo-mark";
import { APP_STORE_URL } from "@/components/ui/app-store-badge";
import { FOCUS_RING } from "@/lib/motion";

/* 分页化(2026-07-29):Product 列改指路由;FAQ 留在首页,指 /#faq */
const columns = [
  {
    title: "Product",
    links: [
      { text: "Why Ripple", href: "/how-it-works" },
      { text: "Features", href: "/features" },
      { text: "FAQ", href: "/#faq" },
      { text: "Dashboard", href: "/dashboard" },
    ],
    note: null,
  },
  {
    title: "Get the app",
    links: [
      { text: "Download on the App Store", href: APP_STORE_URL },
      { text: "Support", href: "https://ripple-legal.vercel.app/support.html" },
    ],
    note: "Free · iPhone with Apple Watch.",
  },
  {
    title: "Legal",
    links: [
      {
        text: "Privacy Policy",
        href: "https://ripple-legal.vercel.app/privacy.html",
      },
      {
        text: "Terms of Service",
        href: "https://ripple-legal.vercel.app/terms.html",
      },
    ],
    note: null,
  },
];

export default function Footer1() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-line pt-14 sm:pt-16">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8"
        >
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <RippleLogoMark animated={false} className="h-9 w-9" />
              <span className="text-lg font-medium tracking-tight text-ink">
                Ripple
              </span>
            </div>
            {/* "speaks first" 全站逐字第 4 次出现在这里,换成变奏(2026-07-28 文案评审) */}
            <p className="max-w-[26ch] font-display text-xl font-semibold leading-snug text-ink">
              The wellness agent that notices first.
            </p>
            {/* NAISC 全站唯一提及处(2026-07-28 决定:hero 徽章撤下,凭证降级到这里一行)。
                版本行是"活着的证据"(Stanford 指南 #8),与 App Store 实况同步维护。
                CC-BY 署名从 Legal 导航列挪到这里(评审:混在法务链接里像一份法律文件,
                colophon 小字才是素材署名的惯例位)—— 署名义务仍然生效,不许删 */}
            <div className="mt-auto flex flex-col gap-1 text-sm text-ink-faint">
              <p>v1.0 · on the App Store since July 2026</p>
              <p>3rd place · National AI Student Challenge 2026</p>
              <p>© 2026 Ripple · Team YoRHa · Not a medical device</p>
              <p className="text-xs">
                iPhone 3D model by{" "}
                <a
                  href="https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline decoration-line underline-offset-2 transition-colors hover:text-ink ${FOCUS_RING} rounded-sm`}
                >
                  polyman Studio
                </a>{" "}
                (CC-BY)
              </p>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            /* 原本这三个列标题是 h4,而它上面最近的标题是 #join 的 h2 —— 全页唯一一处
               层级跳跃(h2 → h4)。但直接改 h3 是修机器不修语义:HTML outline 算法 2022
               年已从规范移除,标题级是文档全局绝对级,h3 等于声称这三列是 #join 那个 h2
               的子节,和 h4 声称某个不存在的 h3 的子节一样是编的。
               这三列本来就是链接列表 = 导航,所以改成 nav + aria-labelledby 指向一个
               普通 <p>:跳跃自然消失,语义反而更准,读屏还多拿到三个具名导航地标。
               视觉零变化(className 原样保留,Tailwind v4 preflight 已把 h1–h6 的
               字号字重重置为 inherit,h4 与 p 的计算样式实测全等) */
            <nav
              key={column.title}
              aria-labelledby={`footer-col-${column.title.replace(/\s+/g, "-").toLowerCase()}`}
              className="flex flex-col gap-4"
            >
              <p
                id={`footer-col-${column.title.replace(/\s+/g, "-").toLowerCase()}`}
                className="text-xs font-medium uppercase tracking-[0.18em] text-caramel"
              >
                {column.title}
              </p>
              <ul className="flex flex-col gap-1">
                {column.links.map((link) => (
                  <li key={link.text}>
                    {link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block rounded-md py-2.5 text-sm text-ink-muted transition-colors hover:text-ink ${FOCUS_RING}`}
                      >
                        {link.text}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className={`inline-block rounded-md py-2.5 text-sm text-ink-muted transition-colors hover:text-ink ${FOCUS_RING}`}
                      >
                        {link.text}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              {column.note && (
                <p className="text-sm leading-relaxed text-ink-faint">
                  {column.note}
                </p>
              )}
            </nav>
          ))}
        </motion.div>
      </div>

      {/* Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none mt-10 select-none overflow-hidden sm:mt-14"
      >
        <p className="-mb-[0.22em] text-center font-display text-[26vw] font-bold leading-[0.9] text-ink/5 md:text-[200px]">
          Ripple
        </p>
      </div>
    </footer>
  );
}
