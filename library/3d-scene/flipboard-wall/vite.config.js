import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 5173 },
  // main.js 用了顶层 await 来等纹理加载,打包目标要跟上
  build: { target: 'esnext' },
})
