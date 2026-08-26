# `_alias` —— ripple-site 的内部接线

ripple-site 的组件用 `@/lib/...`、`@/content/...`、`@/components/...` 这套 shadcn 风格的别名互相引用。
把它们单独收进这个库之后,那些 import 就断了 —— 组件本身没问题,是接线掉了。

这个目录补上接线:vite.config.js 里 `@` 指向这里。

| 放这里的 | 为什么 |
|---|---|
| `lib/` `content/` | ripple-site 自己的工具函数和文案数据,不是独立组件,没必要在分类目录里单列一条 |
| `components/staggered-text.tsx`<br>`components/blur-highlight.tsx` | 这两件在多个项目里各有一份**不同**的拷贝。ripple-site 的 block 必须吃 ripple 自己那版,否则渲染出来不是站上的样子 —— 所以这里放的是 ripple 版,和 `library/text/` 下收的那份不是同一个文件 |

其余 `@/components/*`(ripple-logo-mark、phone-3d、simple-graph、app-store-badge …)由 vite.config.js 里的
逐条 alias 指回分类目录 —— 那些本来就是从 ripple-site 收来的同一份文件,不用再复制一次。

**注意**:ripple-site 的组件吃 Tailwind 4。这句以前写的是「这个库没装 Tailwind,所以只能看源码」——
已经不对了:`@tailwindcss/vite` 早接进来了(只处理写了 `@import "tailwindcss"` 的 CSS,
全库只有 `library/token/ripple/index.css` 是),`block/` 那批和 `nav/navigation-12` 都有能跑的演示台。
(`nav/footer-1` 2026-08-26 已删。)
