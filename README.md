# Toffeemoon Components

陈雨钦的私人前端组件库。把散在翻板墙、沐言书坊、Ripple、AI 互动故事、Yuqin portfolio、YoRHa-A2 这些项目里的组件、动效和三维场景收在一处 —— 能浏览、能查源码、能复制走。

从**翻页书**开始也收直接为库写的件,不再只是收编 —— 那类件的源码 import 是通的,不需要下面说的补 shim 那一套。

**私用,不公开发布。** 库里同时收了自研件和 React Bits 移植/改造件,归属在每一条上都标了,别把移植的当自己的作品往外拿。

```bash
npm install
npm run dev      # http://localhost:5180
```

## 两个入口

| 入口 | 是什么 | 依赖 |
|---|---|---|
| `index.html` | 目录站 —— 画廊、分类、源码、搜索 | 只有 React 三件套 |
| `preview.html` | 演示台 —— 在 iframe 里真跑组件 | three / gsap / motion / lucide |

Vite 分开打包,目录站的体积不会被组件依赖拖累。

## 为什么这么设计

**目录站只读源码,不跑源码。** `library/` 下的文件全部通过 `import.meta.glob(..., '?raw')` 当纯文本读进来,目录站从头到尾没 `import` 过 three / gsap / motion 里的任何一个。所以某个组件的依赖升级把自己搞挂了,目录、搜索、源码浏览照常能用。

**预览走 iframe,不走同进程渲染。** 组件来自八个项目,token 体系各不相同(沐言的 `[data-theme]`、Toffeemoon 的 `--y-*`/`--c-*`、Ripple 的 Tailwind 4),塞进同一个页面 CSS 必然打架,three.js 场景也没法和 React 组件共存。iframe 沙箱一次解决,而且画廊里的缩略图和详情页的大图是同一个 URL,不用维护两套。

**画廊里的 iframe 按需挂载。** 六十来个 iframe 同时活着会把浏览器压垮,所以只在进入视口时挂载、离开就卸掉,同屏活着的通常不超过 8 个。没有演示台的组件不留白 —— 切一段源码当画面,这样"一眼看到都有什么"对全部组件成立,而不是只对能跑的那些成立。

## 加一个演示台

在 `src-preview/demos/` 放一个 `<slug>.jsx`,default export 一个组件,直接从 `../../library/...` import 要演示的东西。注册是自动的(glob 扫目录),不用改任何注册表。

demo 是**按需加载**的:某个 demo 的 import 断了,只有它自己那格报错,其余照常 —— 别改回 eager glob,那样一个坏的会连坐全部。

**61 组全部有预览** —— 57 个演示台 + 4 个打包好的静态产物(翻板墙 / 卡片环形轮播 / 沐言书坊 / 书架轮播)。

## 收来的源码,import 是断的

这是搬运组件库最花时间的一件事,不是写 demo。原项目里的文件按那边的目录结构互相引用,搬过来全断。三类,三种补法:

| 断法 | 例子 | 怎么补 |
|---|---|---|
| 别名 | ripple-site 的 `@/lib/motion`、`@/components/silk-waves` | `vite.config.js` 的 alias 表 + `library/_alias/`。注意**动态** `lazy(() => import('@/…'))` 也要接,只 grep `from "@/"` 会漏 |
| 相对路径 | `Card.jsx` 里的 `./Tag`、`AppShell` 里的 `../PillNav` | 在断掉的位置放一个一行 re-export 的 **shim**,不复制源码 —— 库里每份源码只有一份 |
| 素材 | `../assets/moon/…`、`/models/iphone.glb` | 相对的按原路径放进对应分类目录(`library/motion/assets/`),绝对的放 `public/` |

有两处是**故意不补**的:`state/game.jsx` 是应用存档(给了空实现,ResumeBar 会自己收起来)、`card-carousel-3d` 和 `muyan-bookshop` 的图片素材(这两件走静态产物预览,库里的源码不需要跑)。

`block/` 那批吃 Tailwind 4 —— `@tailwindcss/vite` 已接进来,只处理写了 `@import "tailwindcss"` 的 CSS,全库只有 `library/token/ripple/index.css` 是,所以不会污染其他项目的组件。

## 加一个组件

1. 把源码文件复制进 `library/<分类>/<slug>/`
2. 在 `src/data/components.js` 的 `COMPONENTS` 里补一条元信息
3. 想让它在画廊里活起来,再去 `src-preview/demos/` 加一个同名 `.jsx`

站点这边不用改代码 —— 文件列表、行数统计、搜索索引、演示台注册都是自动扫的。

从原项目收源码时注意:那些文件里的 import 路径是按原项目的目录写的,搬过来就断了。ripple-site 的 `@/` 别名由 `vite.config.js` 的 alias 表和 `library/_alias/` 接回去(见那个目录的 README)。

分类:`3d-scene` `motion` `ui` `nav` `text` `block` `video` `token`

## 归属标记

| 标记 | 含义 |
|---|---|
| **自研** | 完全自己写的 |
| **改造** | React Bits 等来源上大幅改过:换 token、改挂载方式、加交互 |
| **移植** | 基本原样搬进来的 |
| **待查** | 来源没标注,还没核实 |

当前 `待查` 两条:`staggered-text` 和 `preloader-ais` —— 四个项目里各有一份几乎相同的拷贝,出处没写。

## 预览产物

`public/previews/` 下是打包好的自包含成品,和原项目脱钩,原项目改了这里不会自动跟着变。要更新就回原项目 `npm run build` 再复制一次。

| 组件 | 来源 | 怎么来的 |
|---|---|---|
| `flipboard-wall/` | 翻板墙 | `npm run build` 的 dist 整个复制 |
| `card-carousel-3d.html` | 卡片环形轮播 | 原项目自带的 `vite-plugin-singlefile` 单文件产物 |
| `bookshelf-carousel.html` | 书架轮播 | 同上 |
| `muyan-bookshop.html` | 沐言书坊 | 同上 |

没接预览的:React 组件 —— 要各自写 demo entry,后面逐批补。

## 各组件的原始仓库

| 项目 | 仓库 |
|---|---|
| 翻板墙 | `toffemoon/flipboard-wall` |
| 卡片环形轮播 | `toffemoon/card-carousel` |
| 书架轮播 | 本地 `Desktop/书架轮播`,已 git init,未推远端 |
| 沐言书坊 | `toffemoon/muyan-bookshop` |
| Toffeemoon Design System | `toffemoon/toffeemoon-design-system` |
| ripple-site | `toffemoon/ripple-site` |
| AI 互动故事 | `toffemoon/ai-interactive-story` |
| Yuqin portfolio | `toffemoon/toffeemoon` |
| YoRHa-A2 | `yorhagengyue/yorha-a2-team`(耿越主理) |
