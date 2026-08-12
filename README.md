# Toffeemoon Components

陈雨钦的私人前端组件库。把散在翻板墙、沐言书坊、Ripple、AI 互动故事、Yuqin portfolio、YoRHa-A2 这些项目里的组件、动效和三维场景收在一处 —— 能浏览、能查源码、能复制走。

**私用,不公开发布。** 库里同时收了自研件和 React Bits 移植/改造件,归属在每一条上都标了,别把移植的当自己的作品往外拿。

```bash
npm install
npm run dev      # http://localhost:5180
```

## 为什么这么设计

**源码只读不跑。** `library/` 下的文件全部通过 `import.meta.glob(..., '?raw')` 当纯文本读进来,站点从头到尾没 `import` 过 three / gsap / motion 里的任何一个。所以这个库自己的依赖只有 React 三件套,`npm install` 是秒级的,而且永远不会因为某个组件的依赖升级把整个库跑挂。

**预览走 iframe,不走同进程渲染。** 组件来自五个项目,token 系统各不相同(沐言的 CSS 变量、Toffeemoon 的 `--y-*`/`--c-*`、Ripple 的 Tailwind 4),塞进同一个 React app 里 CSS 必然打架,three.js 场景也没法和 React 组件共存。iframe 沙箱两个问题一起解决,代价是预览产物要单独打包一份。

## 加一个组件

1. 把源码文件复制进 `library/<分类>/<slug>/`
2. 在 `src/data/components.js` 的 `COMPONENTS` 里补一条元信息

站点这边不用改代码 —— 文件列表、行数统计、搜索索引都是自动扫的。

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
| `muyan-bookshop.html` | 沐言书坊 | 同上 |

没接预览的两类:React 组件(要各自写 demo entry,后面逐个补)、s1000rr Lean Lab(模型 10.8 MB 且必须走 HTTP 才能 fetch `.glb`)。

## 各组件的原始仓库

| 项目 | 仓库 |
|---|---|
| 翻板墙 | `toffemoon/flipboard-wall` |
| 卡片环形轮播 | `toffemoon/card-carousel` |
| 沐言书坊 | `toffemoon/muyan-bookshop` |
| Toffeemoon Design System | `toffemoon/toffeemoon-design-system` |
| ripple-site | `toffemoon/ripple-site` |
| AI 互动故事 | `toffemoon/ai-interactive-story` |
| Yuqin portfolio | `toffemoon/toffeemoon` |
| YoRHa-A2 | `yorhagengyue/yorha-a2-team`(耿越主理) |
| S1000RR Lean Lab | `yijiangj2025-prog/s1000rr-lean-lab`(账号归属待确认) |
