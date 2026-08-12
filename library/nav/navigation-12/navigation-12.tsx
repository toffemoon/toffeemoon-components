"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  type Variants,
} from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import RippleLogoMark from "@/components/ripple-logo-mark";
import { APP_STORE_URL } from "@/components/ui/app-store-badge";
import { useSession } from "@/lib/auth";
import { FOCUS_RING } from "@/lib/motion";
import {
  PRIMARY_NAV_LINKS,
  isPrimaryNavigationLinkActive,
} from "@/lib/primary-navigation";

/* 分页化(2026-07-29):独立路由导航;FAQ 留在首页(雨钦拍板),指 /#faq。
   锚点 scrollspy 随之退役,高亮改按路由;滚动定位交给 ScrollManager */
const menuStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};

const menuItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const focusRing = FOCUS_RING;

export default function Navigation12() {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const session = useSession();
  // 滚过 hero 后才在移动端露出下载按钮:首屏 hero 自带入口,之后 6+ 屏才补上;
  // 分页没有 hero,进页即显示
  const [pastHero, setPastHero] = useState(false);

  const isActive = (to: string) =>
    isPrimaryNavigationLinkActive(to, pathname, hash);

  // 登录态入口:未登录去 /login,已登录直达 /dashboard
  const sessionLink = session
    ? { name: "Dashboard", to: "/dashboard" }
    : { name: "Sign in", to: "/login" };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 换页时收起移动菜单(点菜单里的 Link 导航后不能留着展开态)
  useEffect(() => {
    setOpen(false);
  }, [pathname, hash]);

  // hero(#waitlist)只存在于首页:离开视口 → 移动端露出下载按钮
  useEffect(() => {
    if (pathname !== "/") {
      setPastHero(true);
      return;
    }
    setPastHero(false);
    const hero = document.getElementById("waitlist");
    if (!hero) {
      setPastHero(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [pathname]);

  // 无框导航:不要盒子,靠一层向下渐隐的压底保证滚动时可读
  return (
    <header className="sticky top-0 z-50 w-full bg-linear-to-b from-bg from-55% via-bg/85 via-80% to-transparent px-4 pb-4 pt-2 sm:px-6 md:pb-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-14 items-center justify-between gap-3"
          aria-label="Primary"
        >
          <Link
            to="/"
            className={`flex items-center gap-2 rounded-full text-ink ${focusRing}`}
          >
            <RippleLogoMark animated={false} className="h-8 w-8" />
            <span className="text-[15px] font-semibold tracking-tight">
              Ripple
            </span>
          </Link>

          {/* 显隐由 index.css 的 .nav-* 兜底规则接管(见该文件注释),
              不用 hidden/md:flex —— 个别壳浏览器解析不了 Tailwind v4 的嵌套媒体查询 */}
          <div className="nav-desktop-links items-center">
            {PRIMARY_NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                aria-current={isActive(link.to) ? "page" : undefined}
                className={`relative cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${focusRing} ${
                  isActive(link.to)
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {isActive(link.to) && (
                  <motion.span
                    layoutId="nav12-active"
                    className="absolute inset-0 rounded-full bg-accent/15"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="relative">{link.name}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={sessionLink.to}
              className={`nav-desktop-session items-center rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${focusRing} ${
                isActive(sessionLink.to)
                  ? "text-ink"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {sessionLink.name}
            </Link>
            {/* 移动端:滚过 hero 后淡入 */}
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={pastHero ? undefined : -1}
              aria-hidden={!pastHero}
              className={`nav-mobile-download items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-all duration-300 hover:bg-accent-hover ${focusRing} ${
                pastHero
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              Download
            </a>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`nav-desktop-download items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover ${focusRing}`}
            >
              Download
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="nav12-mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className={`nav-mobile-burger h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-accent/10 ${focusRing}`}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </motion.nav>

        <AnimatePresence>
          {open && (
            <motion.div
              id="nav12-mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="nav-mobile-menu overflow-hidden"
            >
              <motion.nav
                initial="hidden"
                animate="visible"
                variants={menuStagger}
                className="mt-3 rounded-3xl border border-line bg-panel/95 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                aria-label="Mobile"
              >
                {/* 路由导航即时发生,菜单靠上面的 location effect 收起;
                    锚点落点的偏移由 ScrollManager 的二次校正兜底
                    (收起动画 0.4s 会顶掉第一次定位 —— 老坑,见该文件注释) */}
                {[...PRIMARY_NAV_LINKS, sessionLink].map((link) => (
                  <motion.div key={link.name} variants={menuItem}>
                    <Link
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors duration-200 ${focusRing} ${
                        isActive(link.to)
                          ? "bg-accent/15 text-ink"
                          : "text-ink-muted hover:bg-accent/8 hover:text-ink"
                      }`}
                    >
                      {link.name}
                      {isActive(link.to) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  variants={menuItem}
                  className="mt-2 grid gap-2 border-t border-line px-2 pb-2 pt-3"
                >
                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover ${focusRing}`}
                  >
                    Download
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </motion.div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
