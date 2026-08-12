import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 单文件构建:JS / CSS 内联进 index.html,
// glb / png 通过超大的 assetsInlineLimit 以 base64 data URI 内联。
// 产物为一个自包含的 dist/index.html,双击即开、可离线。
export default defineConfig({
  plugins: [viteSingleFile()],
  // .glb 不在 Vite 默认资源类型里,显式声明为资源,否则会被当 JS 解析
  assetsInclude: ['**/*.glb'],
  build: {
    assetsInlineLimit: 100 * 1024 * 1024, // 100MB,确保 glb/png 一律内联
    chunkSizeWarningLimit: 100 * 1024,
    cssCodeSplit: false,
  },
});
