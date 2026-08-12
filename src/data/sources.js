// 把 /library/**/* 全部当纯文本读进来 —— 不执行,只展示。
//
// 这样做的好处:加一个组件只要把源码文件复制进 library/<cat>/<slug>/,
// 站点这边不用改任何代码就能看到、能复制。组件各自的依赖(three / gsap / motion …)
// 也不用装进这个库,因为从头到尾没 import 过它们。

const RAW = import.meta.glob('/library/**/*.{js,jsx,ts,tsx,css,html,md,json}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const LANG = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  css: 'css', html: 'html', md: 'markdown', json: 'json',
}

/** 某一组的所有文件,按「先代码后样式再文档」排序 */
export function filesOf(cat, slug) {
  const prefix = `/library/${cat}/${slug}/`
  const weight = (n) => {
    if (/\.(jsx|tsx)$/.test(n)) return 0
    if (/\.(js|ts)$/.test(n)) return 1
    if (/\.css$/.test(n)) return 2
    if (/\.html$/.test(n)) return 3
    return 4
  }
  return Object.entries(RAW)
    .filter(([p]) => p.startsWith(prefix))
    .map(([p, code]) => {
      const rel = p.slice(prefix.length)
      const ext = rel.split('.').pop()
      return {
        path: rel,
        code,
        lang: LANG[ext] || 'text',
        lines: code.split('\n').length,
        bytes: new Blob([code]).size,
      }
    })
    .sort((a, b) => weight(a.path) - weight(b.path) || a.path.localeCompare(b.path))
}

/** 全库统计,首页顶部用 */
export function stats() {
  const files = Object.values(RAW)
  return {
    files: files.length,
    lines: files.reduce((n, c) => n + c.split('\n').length, 0),
  }
}

/** 跨全库搜源码内容 —— 找「我以前那个抖动是怎么写的」这种 */
export function grep(needle) {
  if (!needle || needle.length < 2) return []
  const q = needle.toLowerCase()
  const hits = []
  for (const [p, code] of Object.entries(RAW)) {
    const lines = code.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        // p 形如 /library/<cat>/<slug>/<file...> —— split 后 [0] 是空串
        const seg = p.split('/')
        hits.push({ cat: seg[2], slug: seg[3], path: seg.slice(4).join('/'), line: i + 1, text: lines[i].trim() })
        if (hits.length >= 60) return hits
      }
    }
  }
  return hits
}
