import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 单文件构建:JS / CSS 内联进 index.html,封面图以 base64 data URI 内联。
// 产物 dist/index.html 自包含、可离线、双击即开。
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    assetsInlineLimit: 100 * 1024 * 1024,
    chunkSizeWarningLimit: 100 * 1024,
    cssCodeSplit: false,
  },
});
