// 哪些组件搭了演示台 —— 只取文件名,不加载模块。
//
// eager:false 的 glob 返回的是 { 路径: () => import(...) },拿 key 就够了。
// 所以目录站永远不会把 three / gsap / motion 拉进自己的 bundle,
// 那些依赖只活在 preview.html 那个入口里。

const found = import.meta.glob('/src-preview/demos/*.jsx')

export const DEMO_SLUGS = new Set(
  Object.keys(found)
    .map((p) => p.split('/').pop().replace('.jsx', ''))
    .filter((s) => s !== 'index'),
)

/** 组件的预览地址:优先用打包好的静态产物,其次用演示台,都没有就 null */
export function previewUrl(c) {
  if (c.preview) return c.preview
  if (DEMO_SLUGS.has(c.slug)) return `/preview.html#/${c.slug}`
  return null
}

export const liveCount = (list) => list.filter((c) => previewUrl(c)).length
