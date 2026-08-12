import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { resolve } from 'node:path'

const lib = (p) => resolve(__dirname, 'library', p)

export default defineConfig({
  // Tailwind 只处理写了 `@import "tailwindcss"` 的 CSS —— 全库只有
  // library/token/ripple/index.css 是,所以 ripple 那批组件的样式能起来,
  // 目录站和其余项目的组件不受影响。
  plugins: [react(), tailwind()],
  resolve: {
    // ripple-site 的组件用 `@/` 互相引用,收进本库后那些 import 会断。
    // 精确项指回分类目录里那份(同一个文件,不复制),兜底项走 library/_alias/。
    // 顺序要紧:Vite 按数组顺序匹配,长前缀必须排在 '@' 之前。
    alias: [
      { find: '@/components/ui/app-store-badge', replacement: lib('ui/app-store-badge/app-store-badge.tsx') },
      { find: '@/components/ripple-logo-mark', replacement: lib('ui/ripple-logo-mark/ripple-logo-mark.tsx') },
      { find: '@/components/ripple-mark', replacement: lib('ui/ripple-logo-mark/ripple-mark.tsx') },
      { find: '@/components/simple-graph', replacement: lib('ui/simple-graph/simple-graph.tsx') },
      // 下面四条走的是 lazy(() => import('@/...')) 动态形式,和静态 import 一样要接
      { find: '@/components/silk-waves', replacement: lib('motion/silk-waves/silk-waves.tsx') },
      { find: '@/components/aurora-field', replacement: lib('motion/aurora-field/aurora-field.tsx') },
      { find: '@/components/ripple-field', replacement: lib('motion/ripple-field/ripple-field.tsx') },
      { find: '@/components/phone-3d-canvas', replacement: lib('3d-scene/phone-3d/phone-3d-canvas.tsx') },
      { find: '@/components/phone-3d', replacement: lib('3d-scene/phone-3d/phone-3d.tsx') },
      { find: '@', replacement: lib('_alias') },
    ],
  },
  server: { port: 5188 },
  build: {
    target: 'esnext',
    rollupOptions: {
      // 两个入口:
      //   index.html   —— 目录站,只依赖 React,库源码当文本读
      //   preview.html —— 演示台,在 iframe 里跑,这里才真正 import three/gsap/motion
      // 分开打包,目录站的体积不会被组件依赖拖累。
      input: {
        main: resolve(__dirname, 'index.html'),
        preview: resolve(__dirname, 'preview.html'),
      },
    },
  },
})
