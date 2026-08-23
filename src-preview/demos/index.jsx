import { lazy } from 'react'

// demo 注册表 —— slug 对上 components.js 里的 slug。
//
// 每个 demo 负责三件事:import 组件、造一份能看出效果的假数据、把它需要的 token CSS 带上。
// 组件本身从 /library/ 直接 import,所以 demo 和归档的源码永远是同一份,不会各改各的。
//
// **按需加载,不用 eager**:eager 会把所有 demo 一次性拉进来,任何一个 demo 的
// import 断了(缺依赖、路径不对)就会连坐,整个预览入口白屏。改成 lazy 之后
// 坏掉的那个只会在自己格子里报错,其余照常。
//
// 不在这张表里的组件,预览页显示「还没搭演示台」。这是刻意的:
// 有些组件(phone-journey 这类)吃太多项目上下文,单独拎出来演示没意义,
// 与其做个假的不如老实说去原项目看。

const modules = import.meta.glob('./*.jsx')

export const DEMOS = {}
for (const [path, load] of Object.entries(modules)) {
  const slug = path.replace('./', '').replace('.jsx', '')
  if (slug === 'index') continue
  DEMOS[slug] = lazy(load)
}

export const DEMO_SLUGS = Object.keys(DEMOS).sort()
