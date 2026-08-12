import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 单文件构建:JS / CSS 内联进 index.html,
// 卡面图(png/jpg)通过超大的 assetsInlineLimit 以 base64 data URI 内联。
// 产物为一个自包含的 dist/index.html,双击即开、可离线。
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    assetsInlineLimit: 100 * 1024 * 1024, // 100MB,确保卡面图一律内联
    chunkSizeWarningLimit: 100 * 1024,
    cssCodeSplit: false,
  },
});
