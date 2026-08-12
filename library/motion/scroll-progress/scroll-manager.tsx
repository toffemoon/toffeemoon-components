import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 跨路由滚动管理:
 * - 换页 → 回到顶部(瞬时,不做平滑:平滑滚动会被路由切换的布局变化中止,
 *   老 bug 在 navigation-12 的移动菜单里踩过,见该文件注释)
 * - 带 hash(如 /#faq)→ 等目标渲染出来后定位过去;同样用瞬时定位,
 *   避免与移动菜单收起动画(0.4s 高度动画)互相打断
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      let attempts = 0;
      let raf = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "auto", block: "start" });
        } else if (attempts++ < 30) {
          raf = requestAnimationFrame(tryScroll);
        }
      };
      raf = requestAnimationFrame(tryScroll);
      // 持续校正:两类布局漂移会顶掉第一次定位 ——
      // ① 移动菜单收起的 0.4s 高度动画(navigation-12 的老坑);
      // ② 页面媒体/懒加载块晚到,目标 section 被继续往下推。
      // 定时点校正追不上(实测 dev 模式移动端能漂过 3s),改用
      // ResizeObserver 盯 body:布局每长一次就立刻扶正一次,守 6 秒。
      // 只在目标确实偏了才重定位(阈值 8px),比对把 scroll-margin-top
      // 折算进去(#faq 带 scroll-mt-24,停稳时 top 本就是 96 不是 0)。
      // 用户一动(滚轮/触摸/按键)立即放手,不抢方向盘。
      const correct = () => {
        const el = document.getElementById(id);
        if (!el) return;
        const expected = parseFloat(
          getComputedStyle(el).scrollMarginTop || "0",
        );
        const top = el.getBoundingClientRect().top;
        if (Math.abs(top - expected) > 8) {
          el.scrollIntoView({ behavior: "auto", block: "start" });
        }
      };
      const ro = new ResizeObserver(correct);
      ro.observe(document.body);
      const stopAt = window.setTimeout(() => ro.disconnect(), 6000);
      const abort = () => {
        ro.disconnect();
        clearTimeout(stopAt);
      };
      const opts = { once: true, passive: true } as const;
      window.addEventListener("wheel", abort, opts);
      window.addEventListener("touchstart", abort, opts);
      window.addEventListener("keydown", abort, opts);
      return () => {
        cancelAnimationFrame(raf);
        abort();
        window.removeEventListener("wheel", abort);
        window.removeEventListener("touchstart", abort);
        window.removeEventListener("keydown", abort);
      };
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}

/** 每页标题;卸载时不用还原(下一页会立刻设置自己的) */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
