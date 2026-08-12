# 沐言书坊 · Muyan Bookshop

AI 互动故事产品的 **3D 书坊前端设想** —— 把整个产品入口装进一间可走动的书店:收银台、故事展台、当前故事、创作桌、我的书架等都是店内可点击的物件。当前为动线验证原型(白盒 + 卡通渲染),美术质感(Cycles 烘焙)未做。

产品的核心功能与 v0.1 版本已上线:<https://ai-interactive-story.onrender.com/>

## 技术

- Vite + three.js
- 3 渲 2 卡通着色(四阶色阶贴图)+ 基于深度的描边后处理
- GLTF 白盒场景 + 糖沐立绘(Y 轴 billboard)
- 7 个镜头节点之间缓动:拖动环视、点击物件走近、Esc 回到全景

## 运行

```bash
cd web
npm install
npm run dev      # Vite 默认 http://localhost:5173
```

## 打包成单文件

```bash
cd web
npm run build    # 产物:web/dist/index.html
```

`vite-plugin-singlefile` 把 JS / CSS 内联,`.glb` / `.png` 以 base64 data URI 内联,产出一个自包含、可离线、双击即开的 HTML(约 3.4MB)。仓库根目录的 `沐言书坊.html` 即一份打包好的成品。

## 目录

```
web/             前端应用(Vite + three.js)
  src/main.js    场景 / 交互 / 渲染
  src/assets/    bookshop.glb 白盒模型、tangmu.png 立绘
书坊白盒.blend    Blender 白盒源文件
沐言书坊.html     打包好的单文件成品
```
