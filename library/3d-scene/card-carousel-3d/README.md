# 卡片环形轮播 · Card Carousel

AI 互动故事首页「热门故事」的 **three.js 环形卡片轮播原型**。8 张卡围环排列、自动慢转,可拖拽(带惯性)、点击聚焦单卡。当前为待集成原型,故事数据与部分卡面为占位。

## 技术

- Vite + three.js
- 环形布局 + 自动旋转 + 拖拽惯性 + 点击聚焦缓动
- UnrealBloom 辉光后处理
- 卡面:真实封面图 + 程序化占位(CanvasTexture)

## 运行

```bash
npm install
npm run dev      # Vite 默认 http://localhost:5173
```

## 打包成单文件

```bash
npm run build    # 产物:dist/index.html
```

`vite-plugin-singlefile` 把 JS / CSS 与卡面图(base64 data URI)全部内联,产出一个自包含、可离线、双击即开的 HTML。仓库根目录的 `卡片环形轮播.html` 即一份打包好的成品。

> 注:两张大封面(cover1/cover2)未压缩,当前单文件约 7.1MB;集成或正式发布前建议缩尺寸 + 转 WebP/JPG。

## 目录

```
src/main.js         场景 / 交互 / 渲染(顶部 STORIES 为故事数据)
src/assets/covers/  卡面封面图
index.html          入口
卡片环形轮播.html     打包好的单文件成品
```
