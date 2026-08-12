import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5188 },
  // library/ 在 src/ 外面,import.meta.glob 要能扫到它,所以 root 保持项目根
  build: { target: 'esnext' },
})
