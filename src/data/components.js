// 组件清单 —— 这个库的事实来源。
//
// 每条记录描述一「组」(一个组件常常是 jsx + css 两个文件,或一整个 three.js 场景多个文件)。
// 源码本身不写在这里,由 sources.js 从 /library/<cat>/<slug>/ 自动扫出来 —— 加组件时先
// 把文件复制进对应目录,再在这里补一条元信息即可。
//
// owner 字段是这个库最要紧的一栏:
//   self    — 完全自己写的
//   adapted — 拿别处(多数是 React Bits)当起点,自己大幅改过:换 token、改挂载方式、加交互
//   ported  — 基本原样移植,只是搬进项目
//   unknown — 来源没标注,还没核实
//
// self 和 adapted 都算自己的作品 —— 灵感来自别处、代码是自己改出来的,那就是自己的。
// ported 不算,那一档只是把别人的东西搬了个地方。
//
// source 字段单独记上游是谁(React Bits / React Bits Pro / …)。站点公开之后
// 这一栏会跟着组件名一起显示 —— 改造件标出起点,不是心虚,是说清楚哪部分是自己做的。

export const REPOS = {
  flipwall: null, // 还没有远端 —— 2026-08-12 查:连本地 git 都没有
  carousel: 'https://github.com/toffemoon/card-carousel',
  muyan: 'https://github.com/toffemoon/muyan-bookshop',
  tds: 'https://github.com/toffemoon/toffeemoon-design-system',
  ripple: 'https://github.com/toffemoon/ripple-site',
  aistory: 'https://github.com/toffemoon/ai-interactive-story',
  yuqin: 'https://github.com/toffemoon/toffeemoon',
  yorha: 'https://github.com/yorhagengyue/yorha-a2-team',
  bookshelf: null, // 本地 Desktop/书架轮播,已 git init,未推远端
  flipbook: null, // 本地 Desktop/翻页书,已 git init,未推远端
}

export const CATEGORIES = [
  { id: '3d-scene', name: '三维场景', hint: 'three.js / R3F,整场景级' },
  { id: 'motion', name: '动效与转场', hint: '开场、路由转场、背景氛围' },
  { id: 'ui', name: '界面组件', hint: '卡片、弹层、表单、图表' },
  { id: 'nav', name: '导航', hint: '壳、菜单、导航栏' },
  { id: 'text', name: '文字动效', hint: '逐字、渐显、计数' },
  { id: 'block', name: '页面区块', hint: '整段落地页 section' },
  { id: 'video', name: '视频组件', hint: 'Remotion,渲染成视频不是网页' },
  { id: 'token', name: '设计 token', hint: '色彩 / 字体 / 间距变量表' },
]

export const OWNERS = {
  self: { label: '自研', tone: 'green' },
  adapted: { label: '改造', tone: 'amber' },
  ported: { label: '移植', tone: 'blue' },
  unknown: { label: '待查', tone: 'grey' },
}

export const COMPONENTS = [
  // ───────────────────────────── 三维场景 ─────────────────────────────
  {
    slug: 'flipboard-wall', cat: '3d-scene', name: '翻板墙 · 3D',
    from: '翻板墙', repo: 'flipwall', owner: 'self',
    deps: ['three', 'lil-gui'],
    preview: '/previews/flipboard-wall/index.html',
    desc: '地铁站整面网格翻板广告墙的 three.js 复刻。上千块面板各自翻转,靠时序错落拼出整墙换图。',
    notes: [
      '翻转在顶点着色器里做:每格通过 instanced attribute 拿自己的延迟值,CPU 每帧只更新一个 uTime。整墙一个 InstancedMesh,上千格也满帧。',
      '不切图:整张源图当一张纹理,每格按 (列,行) 算 UV 偏移采样。用 Box 不用 Plane —— +Z 面永远采图 A,-Z 面永远采图 B,翻 180° 之后换图自然发生,不需要额外逻辑。',
      '右上角控制面板所有参数实时可调。',
    ],
  },
  {
    slug: 'flipboard-wall-2d', cat: '3d-scene', name: '翻板墙 · 2D + 时序引擎',
    from: '翻板墙', repo: 'flipwall', owner: 'self',
    deps: [],
    preview: null,
    desc: '同一面墙的纯 DOM + CSS 版,不碰 WebGL。附独立的时序引擎 timing.js。',
    notes: [
      'timing.js 是纯函数模块:(col, row, cols, rows, seed) → 0..1 延迟。内置八种节奏 —— 随机、对角波浪、中心扩散、中心收拢、列扫、行扫、分组批次、涟漪。',
      '时序引擎和 3D 版同一套算法,但 2026-08-21 起是各自独立的拷贝 —— 2D 目录不再 import 3D 版任何文件(timing.js、默认 config 都自带),可整目录单独拿走。',
      '周期驱动用 setTimeout 不用逐帧回调:动画交给 CSS 跑,JS 每周期只做一次 classList.toggle。',
      '演示台用 public/wall/ 的八张照片循环轮播 —— Wall2D 收 sources 数组,等一轮翻转走完才换背面那张(提前换会被看见)。',
      '整个库里最适合单独抽成一个包的一件。',
    ],
  },
  {
    slug: 'card-carousel-3d', cat: '3d-scene', name: '卡片环形轮播',
    from: 'AI互动故事', repo: 'carousel', owner: 'self',
    deps: ['three'],
    preview: '/previews/card-carousel-3d.html',
    desc: '8 张卡围环排列、自动慢转,可拖拽带惯性、点击聚焦单卡。仿星穹铁道抽卡式。',
    notes: [
      'PBR 薄盒卡身 + 扫光 + UnrealBloom 辉光后处理。',
      '卡面:真实封面图 + 程序化占位(CanvasTexture)。',
      'AI 互动故事首页「热门故事」用,当前仍是待集成原型。',
    ],
  },
  {
    slug: 'bookshelf-carousel', cat: '3d-scene', name: '书架轮播',
    from: '个人博物馆', repo: 'bookshelf', owner: 'self',
    deps: ['three', 'gsap'],
    preview: '/previews/bookshelf-carousel.html',
    desc: '一排密排的书立在架上,当前那本绕自己的书脊为铰链从架中展开,以 3/4 视角悬在书架前方。仿绝区零录像带架。',
    notes: [
      '驱动只有一个连续量 pos(浮点索引):每本书的姿态由 t = pos - index 决定,拖动直接改 pos、点箭头用 GSAP 补间 pos,同一套计算 —— 所以"划过很多本"就是这段开合动画被加速连播。',
      '姿态拆两段:extend(探出书架,书脊仍朝镜头)与 swing(绕书脊转开封面),swing 包在 extend 内。相邻两本的 extend 首尾搭接,交接时画面上始终有书在动。',
      '变速曲线:交接快、展开慢,快慢比约 2.6:1(stepEaseFn 把线性时间重映射成 pos 进度)。',
      '按深度的连续景深:场景 RT 挂 DepthTexture,合成时按 coc 在锐版与糊版之间插值,近处书脊可读、越远越糊。',
      '首尾相接的循环、书间留缝与倾斜参差、封面按需生成 + LRU、竖屏锁水平视角、prefers-reduced-motion。',
      '为个人博物馆的"书架 = 项目 / 经历"做的,也可单独用。封面目前是程序化占位。',
    ],
  },
  {
    slug: 'muyan-bookshop', cat: '3d-scene', name: '沐言书坊',
    from: '沐言书坊', repo: 'muyan', owner: 'self',
    deps: ['three'],
    preview: '/previews/muyan-bookshop.html',
    desc: '把产品入口装进一间可走动的 3D 书店:收银台、故事展台、创作桌、我的书架都是可点击物件。',
    notes: [
      '三渲二卡通着色(四阶色阶贴图)+ 基于深度的描边后处理。',
      '糖沐立绘走 Y 轴 billboard。',
      '7 个镜头节点之间缓动:拖动环视、点击物件走近、Esc 回全景。',
      '动线验证原型,美术质感(Cycles 烘焙)未做。',
    ],
  },
  {
    slug: 'frame-border', cat: '3d-scene', name: 'frame-border 着色器边框',
    from: 'Toffeemoon Design System', repo: 'tds', owner: 'self',
    deps: ['@react-three/fiber'], preview: null,
    desc: 'R3F 着色器画的动态边框,内容走 children 套在框里。fbm 噪声算边,同一个 shader 能出霓虹 / 烛照 / 薄雾 / 锐边四种味道。',
    notes: [
      '2026-08-23 修 .frame-border-content:原来是 position:relative,而 R3F 给 <Canvas> 外层 div 打的行内 position:relative + height:100% 压过了 .frame-border-canvas 的 absolute,内容层就被整块顶到容器下方。改成 absolute 铺满容器。',
    ],
  },
  {
    slug: 'signal-orb', cat: '3d-scene', name: 'SignalOrb 信号球',
    from: 'Toffeemoon Design System', repo: 'tds', owner: 'self',
    deps: ['three'], preview: null,
    desc: '带月面贴图的信号球,用作品牌符号 / 加载指示。鼠标移入可带动转向。',
    notes: [
      '2026-08-23 补了 signal-orb.css —— 原项目的样式表没随组件收进来,而组件是拿 mount.clientWidth/Height 去建 renderer 的,容器塌成 0 就 setSize(0,0),画面全黑。属于"跑得起来但看不见"那类坑。',
    ],
  },
  {
    slug: 'phone-3d', cat: '3d-scene', name: 'phone-3d 手机滚动展示',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['three', '@react-three/fiber', '@react-three/drei', 'motion'], preview: null,
    desc: '一台 3D 手机随页面滚动旋转推进,屏幕内容跟着换。懒加载 Canvas,不影响首屏。',
    notes: [
      '屏幕是贴在 mesh 上的 VideoTexture,不是 DOM 叠层 —— 双层交叉淡化在壳浏览器上会渲成多重曝光,是弃案,别复活。',
      '2026-08-23 加 orbit 开关:打开后 OrbitControls 接管相机(可拖转 / 滚轮推拉 / 松手自转),滚动编排让位。默认 false,线上站行为不变;演示台开着,因为格子里没有滚动行程可用。',
    ],
  },

  // ───────────────────────────── 动效与转场 ─────────────────────────────
  {
    slug: 'surface-tension', cat: 'motion', name: 'Surface Tension 开场',
    from: 'Toffeemoon Design System', repo: 'tds', owner: 'self',
    deps: ['three', '@react-three/fiber'], preview: null,
    desc: 'Toffeemoon v1.0 的默认 preloader:水面张力。含 Preloader 壳 + 时间轴 hook + RippleReveal 涟漪环。',
    notes: [
      'RippleReveal 只画可见的涟漪环;真正的揭示(alpha 遮罩)由 preloader 根节点上的 --reveal-radius 单独驱动,环不当遮罩用。',
      '2026-08-23:原来 Preloader 里有 ?loader=blacktop / ?loader=puddle 两个变体分支,那两个组件已随 v1.0 月球线一起从本库删除,变体开关也去掉了,只留 Surface Tension 本体。',
    ],
  },
  {
    slug: 'rain-layer', cat: 'motion', name: 'RainLayer 慢雨',
    from: 'Toffeemoon Design System', repo: 'tds', owner: 'self',
    deps: [], preview: null,
    desc: '细、暗、慢的雨线,带空间景深,少量雨滴带青绿高光。刻意不是黑客帝国那种。频率 / 速度 / 浓度可调。',
    notes: [
      '尊重 prefers-reduced-motion。',
      '2026-08-23 把三个写死的量改成 props:density(频率)、speed(速度)、opacity(浓度)。speed / opacity 走 ref,改了下一帧生效;density 变了要重建雨滴,所以它在依赖数组里。',
      '默认值是按"满屏背景层"调的,细到在小画布里几乎看不见 —— 演示台把默认抬到 density 1.8 / opacity 2.4 才看得出来。',
    ],
  },
  {
    slug: 'ripple-transition', cat: 'motion', name: '涟漪路由转场',
    from: '沐言书坊', repo: 'muyan', owner: 'self',
    deps: [], preview: null,
    desc: '从落点扩开一圈圈水纹,盖满的那一下换页,然后淡出。速度、曲率、圈数、波幅四个参数可调。',
    notes: [
      '前身是同目录的落墨转场:一个纯色层 + clip-path: circle() 涨圆。那份实现的注释里按钮就叫「涟漪入局」,画出来却是一滴墨 —— 2026-08-26 把名字兑现成实现。',
      '从 clip-path 换成 canvas 是被逼的:clip-path: circle() 只给得出一条硬边,而涟漪的命是「一圈圈」。CSS 的 repeating-radial-gradient 能画等距的圈,但涟漪的圈不是等距的 —— 能量往外衰减,圈会朝后堆,曲率这个参数调的就是这件事。代价是一个全屏 canvas,但它只活转场那一下(<1s)就自删,仍然零克隆。',
      '曲率 curvature 是进度指数:进度按 t^(1/curvature) 走,>1 起手快收尾慢(真实水纹失能量的样子),<1 起手慢末尾抽一下。同一个指数也用来排圈的位置。',
      '换页排在盖满的那一帧回调,所以换页藏在覆盖层底下,看不见闪。减动偏好下整层不建,直接换页。',
      '演示台的台子必须是亮底 —— 覆盖层的颜色就是目的地的暗底色,深色盖在深色上等于隐形,前身那版就栽在这。',
    ],
  },

  {
    slug: 'aurora-field', cat: 'motion', name: 'aurora-field 极光背景',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['motion'], preview: null,
    desc: 'canvas 极光场,慢速流动的色带。尊重 prefers-reduced-motion。',
  },
  {
    slug: 'ripple-field', cat: 'motion', name: 'ripple-field 涟漪场',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['motion'], preview: null,
    desc: 'Ripple 品牌的涟漪背景场,同心圆扩散。',
  },
  {
    slug: 'silk-waves', cat: 'motion', name: 'silk-waves 丝绸波',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['motion'], preview: null,
    desc: '丝绸质感的波纹背景,309 行,三个背景场里最重的一个。',
  },
  {
    slug: 'click-spark', cat: 'motion', name: 'ClickSpark 点击火花',
    from: 'AI互动故事', repo: 'aistory', owner: 'adapted', source: 'React Bits',
    deps: [], preview: null,
    desc: '点击处迸出火花。React Bits 原件的改造版。',
    notes: [
      '原组件是「包裹 children + 容器 onClick」的局部用法;本项目内容走 document 滚动,包裹会让 canvas 不跟随滚动、滚动后火花错位。',
      '改成全局固定铺满视口的 canvas + window 级点击监听 —— 这个改动才是这份代码的价值,直接抄原版会踩同一个坑。',
    ],
  },
  {
    slug: 'scroll-progress', cat: 'motion', name: '滚动进度与滚动管理',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['motion'], preview: null,
    desc: '顶部滚动进度条 + 路由切换时的滚动位置管理 + 共用的缓动曲线常量表(motion.ts)。',
  },
  {
    slug: 'preloader-ais', cat: 'motion', name: 'preloader(沐言版)',
    from: 'AI互动故事', repo: 'aistory', owner: 'unknown',
    deps: ['motion'], preview: null,
    desc: '526 行的 preloader,Toffeemoon / commonhers-web / AI互动故事 里各有一份几乎相同的拷贝。',
    notes: ['来源没标注 —— 四个项目同一份代码,不确定是自研还是从哪移植的。用之前先核一下。'],
  },

  // ───────────────────────────── 界面组件 ─────────────────────────────
  {
    slug: 'card', cat: 'ui', name: '统一 Card',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: [], preview: null,
    desc: '整个库里设计最完整的一件。展示型组件,只认 CardModel,禁 kind 大开关。支持翻面。',
    notes: [
      '配套 cardModel.js —— 数据形状定义在那里,组件本身不做类型分支。',
      '翻面用「两面各自 perspective() + rotateY」,不靠父级 preserve-3d,规避 Safari 的层级 bug。',
    ],
  },
  {
    slug: 'primitives', cat: 'ui', name: '基础件组(7 件)',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: [], preview: null,
    desc: 'Button / Badge / Tag / Chip / Input / ChatBubble + 统一出口 index.js + ui.css。',
    notes: [
      'Button:primary(accent 填)/ secondary(accent-2 描边)/ ghost(纯文字)/ line(中性描边),size sm/md,full 占满整行。',
      'ChatBubble:微信式气泡,received(面板填,异侧圆角)/ sent(accent-2 填)。',
      '全部吃 CSS 变量,换 token 就换皮 —— 见「设计 token」分类。',
    ],
  },
  {
    slug: 'identity-card', cat: 'ui', name: 'IdentityCard 身份卡',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: [], preview: null,
    desc: '横版暖米白纸质卡,点一下翻面。onboarding 收尾时印上称呼与口味发给用户。',
  },
  {
    slug: 'char-detail-modal', cat: 'ui', name: 'CharDetailModal 详情弹层',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: [], preview: null,
    desc: '固定全屏覆盖的详情弹层,放在轮播外用不会被卡片的 transform 顶歪。',
  },
  {
    slug: 'image-crop-field', cat: 'ui', name: 'ImageCropField 裁图字段',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: ['react-easy-crop'], preview: null,
    desc: '表单里的图片上传 + 裁剪字段,配套 image.js(File → dataURL、裁剪导出)。',
  },
  {
    slug: 'flip-book', cat: 'ui', name: '翻页书',
    from: '翻页书', repo: 'flipbook', owner: 'self',
    deps: [],
    preview: null,
    desc: '一组图片变成一本能拖着翻的书。硬折页 —— 纸面保持平面,只有折痕直线和阴影,不上 WebGL。',
    notes: [
      '折页是镜像反射不是绕轴旋转:折痕线取抓取角到指针的垂直平分线,掀起的那块是整页关于它的 2D 反射再 clip 到一侧。横着拖得竖直折痕,斜着拖得斜角掀起 —— 一套公式两种手感。绕书脊 rotateY 的 turn.js 骨架做不出斜折边。',
      '页钉在书脊上:书脊必须整条落在折痕的留下侧,展开即「抓着的角到书脊任一端的距离不能比原来更远」。可达区域是两个圆盘的交,而两圆恰好交于抓取角和它关于书脊的镜像,所以最近点不用解圆交方程。再加一条上下 band,否则往正上方拽会连出横跨整页的陡对角线。',
      '页面比例从照片反推(pageRatio 默认 auto)。定死一个数意味着怎么摆都得付代价 —— contain 留白不齐、cover 裁掉一大块,同一个根:页不合图。每张图都「想要」一个比例(竖图要自己的,横图铺跨页所以要一半),取几何平均即整体损失最小。',
      '组件根节点 overflow: clip 是必须的:掀起的纸伸到书本外面会算进祖先的可滚动区域,页面长出滚动条 → 容器变窄 → ResizeObserver 重排,拖一下缩一次。',
      '拖动时每帧只改 3 个元素的 transform / clip-path / background-image,直接操作 DOM ref 不过 React state。翻完那一帧推进页码、换内容、重置变换必须在同一个 rAF 里(flushSync),拆两帧会闪。',
      '库里第一个不从别处收编、直接为组件库写的件。fold.js / paginate.js 是纯函数,原项目里有 57 条 vitest 单测(含「书脊永不被掀起」的网格不变量),这边没有 test runner 所以没搬。',
    ],
  },
  {
    slug: 'card-carousel-dom', cat: 'ui', name: 'CardCarousel(DOM 版)',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: [], preview: null,
    desc: '不用 WebGL 的横排卡片轮播:RAF 平滑惯性滚动(lerp 逼近 target),卡片随滚动速度起微浪,静止则平。',
    notes: ['自己写的复刻 —— 目标是 React Bits CircularGallery(bend=0)的观感,但用 DOM 实现,好保留项目自己的 <Card>。'],
  },
  {
    slug: 'story-hero', cat: 'ui', name: 'StoryHero',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: [], preview: null,
    desc: '故事详情页头图区,组合 Card / Tag / Badge / CardCarousel。',
  },
  {
    slug: 'showcase-grid', cat: 'ui', name: 'ShowcaseGrid 作品网格',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: ['motion', 'lucide-react'], preview: null,
    desc: '探索页的作品卡网格,带进出场动画。',
  },
  {
    slug: 'simple-graph', cat: 'ui', name: 'simple-graph 可交互折线图',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['motion'], preview: null,
    desc: '563 行的自绘折线图,带 hover 读数、区间高亮、进场绘制动画。没用图表库。',
  },
  {
    slug: 'comparison-strip', cat: 'ui', name: 'comparison-strip 对比条',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['motion'], preview: null,
    desc: '左右对比的横条,滚动进入视口时展开。',
  },
  {
    slug: 'phone-journey', cat: 'ui', name: 'phone-journey 手机演示动线',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['motion'], preview: null,
    desc: '629 行,整个 ripple-site 最大的一件:手机内的操作流程按滚动逐步演示,配 webm 视频段。',
  },
  {
    slug: 'ripple-logo-mark', cat: 'ui', name: 'Ripple logo 动画 mark',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: [], preview: null,
    desc: 'SVG 描边生长 + 填充动画的 logo,含深色变体(navy → 月白,teal → 品牌色,coral 星点保留)。附静态版 ripple-mark。',
  },
  {
    slug: 'app-store-badge', cat: 'ui', name: 'App Store 徽章',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: [], preview: null,
    desc: 'Apple marketingtools 官方 artwork 的正确用法封装。',
    notes: ['经验:自绘 teal 版被四个评审 agent 一致点名是全站最大的「山寨感」来源。别自绘,用官方 svg。'],
  },
  {
    slug: 'yuqin-cards', cat: 'ui', name: 'Yuqin 编辑感卡片组(6 件)',
    from: 'YUQIN', repo: 'yuqin', owner: 'self',
    deps: [], preview: null,
    desc: 'ProjectCard / WritingCard / ContactCard / SectionHeader / ChapterGuide / MarqueeBand。',
    notes: [
      '编辑感卡:32px 圆角,右上柔和径向高光,1px 茶色描边,暖色阴影。',
      '每件都很小(9–42 行)—— 这组的价值在克制,不在复杂。',
    ],
  },
  {
    slug: 'depth-card', cat: 'ui', name: 'depth-card 景深卡',
    from: 'AI互动故事', repo: 'aistory', owner: 'ported', source: 'React Bits',
    deps: [], preview: null,
    desc: 'React Bits 组件,基本原样移植。',
  },
  {
    slug: 'animated-list', cat: 'ui', name: 'animated-list',
    from: 'AI互动故事', repo: 'aistory', owner: 'adapted', source: 'React Bits',
    deps: ['motion'], preview: null,
    desc: 'React Bits 的动画列表,386 行,项目里改过。',
  },
  {
    slug: 'stepper', cat: 'ui', name: 'Stepper 分步器',
    from: 'AI互动故事', repo: 'aistory', owner: 'adapted', source: 'React Bits',
    deps: ['motion'], preview: null,
    desc: 'React Bits Stepper,onboarding 流程用,改过步进逻辑。',
  },
  {
    slug: 'line-sidebar', cat: 'ui', name: 'LineSidebar',
    from: 'AI互动故事', repo: 'aistory', owner: 'ported', source: 'React Bits',
    deps: [], preview: null,
    desc: 'React Bits LineSidebar,原样移植,仅追加 .is-disabled 一条样式。',
  },

  // ───────────────────────────── 导航 ─────────────────────────────
  {
    slug: 'app-shell', cat: 'nav', name: 'AppShell 应用壳',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: ['react-router-dom', 'lucide-react'], preview: null,
    desc: '移动端底部导航壳 + ResumeBar 续读条 + 路由表 nav.js。',
  },
  {
    slug: 'yuqin-navbar', cat: 'nav', name: 'Yuqin 导航栏与页脚',
    from: 'YUQIN', repo: 'yuqin', owner: 'self',
    deps: [], preview: null,
    desc: '编辑感导航栏(含中英切换)+ 页脚。配套 Persona-5 斜切转场:620ms 焦糖色扫过 + 亚 5% 闪白,滚动错开 220ms 落在转场中段。',
  },
  {
    slug: 'dock', cat: 'nav', name: 'Dock 停靠栏',
    from: 'AI互动故事', repo: 'aistory', owner: 'adapted', source: 'React Bits',
    deps: ['motion'], preview: null,
    desc: 'React Bits Dock,本地 vendored:改吃沐言 token + 加触摸放大。',
  },
  {
    slug: 'pill-nav', cat: 'nav', name: 'PillNav 药丸导航',
    from: 'AI互动故事', repo: 'aistory', owner: 'adapted', source: 'React Bits',
    deps: ['gsap'], preview: null,
    desc: 'React Bits PillNav,vendored:文字 logo + 吃语义 token + 适配 HashRouter。',
  },
  {
    slug: 'flowing-menu', cat: 'nav', name: 'FlowingMenu 流动菜单',
    from: 'AI互动故事', repo: 'aistory', owner: 'adapted', source: 'React Bits',
    deps: ['gsap'], preview: null,
    desc: 'React Bits Flowing Menu,vendored:文字流动带、吃 token、加触摸触发。',
  },
  {
    slug: 'staggered-menu', cat: 'nav', name: 'StaggeredMenu 错落菜单',
    from: 'AI互动故事', repo: 'aistory', owner: 'adapted', source: 'React Bits',
    deps: ['gsap'], preview: null,
    desc: '710 行,整个库里单文件最大的一件。React Bits StaggeredMenu 的 JS+CSS 变体,适配沐言。',
  },
  {
    slug: 'navigation-12', cat: 'nav', name: 'navigation-12',
    from: 'ripple-site', repo: 'ripple', owner: 'adapted', source: 'React Bits Pro',
    deps: ['motion'], preview: null,
    desc: 'React Bits Pro 的 block 起手,按 Ripple 改造。229 行。',
  },
  {
    slug: 'footer-1', cat: 'nav', name: 'footer-1',
    from: 'ripple-site', repo: 'ripple', owner: 'adapted', source: 'React Bits Pro',
    deps: ['motion', 'react-router-dom'], preview: null,
    desc: 'React Bits Pro block,按 Ripple 改造。',
  },

  // ───────────────────────────── 文字动效 ─────────────────────────────
  {
    slug: 'staggered-text', cat: 'text', name: 'staggered-text 逐字入场',
    from: 'Toffeemoon Design System', repo: 'tds', owner: 'unknown',
    deps: [], preview: null,
    desc: '313 行的逐字动画文本。四个项目里各有一份几乎相同的拷贝。',
    notes: ['和 preloader 一样,来源没标注。用之前先核一下出处。'],
  },
  {
    slug: 'shiny-text', cat: 'text', name: 'ShinyText 扫光文字',
    from: 'AI互动故事', repo: 'aistory', owner: 'ported', source: 'React Bits',
    deps: [], preview: null,
    desc: 'React Bits ShinyText,JS+CSS 版原样移植。',
  },
  {
    slug: 'count-up', cat: 'text', name: 'CountUp 数字滚动',
    from: 'AI互动故事', repo: 'aistory', owner: 'ported', source: 'React Bits',
    deps: [], preview: null,
    desc: 'React Bits CountUp,JS 版原样移植。',
  },
  {
    slug: 'blur-highlight', cat: 'text', name: 'blur-highlight 模糊高亮',
    from: 'AI互动故事', repo: 'aistory', owner: 'ported', source: 'React Bits',
    deps: ['motion'], preview: null,
    desc: 'React Bits 组件。ripple-site 里也有一份(310 行,略有出入)。',
  },

  // ───────────────────────────── 页面区块 ─────────────────────────────
  {
    slug: 'hero-21', cat: 'block', name: 'hero-21 首屏',
    from: 'ripple-site', repo: 'ripple', owner: 'adapted', source: 'React Bits Pro',
    deps: ['motion'], preview: null, desc: 'React Bits Pro block,按 Ripple 改造。',
  },
  {
    slug: 'features-1', cat: 'block', name: 'features-1',
    from: 'ripple-site', repo: 'ripple', owner: 'adapted', source: 'React Bits Pro',
    deps: ['motion', 'lucide-react'], preview: null, desc: 'React Bits Pro block,按 Ripple 改造。',
  },
  {
    slug: 'features-6', cat: 'block', name: 'features-6',
    from: 'ripple-site', repo: 'ripple', owner: 'adapted', source: 'React Bits Pro',
    deps: ['motion'], preview: null, desc: 'React Bits Pro block,按 Ripple 改造。185 行。',
  },
  {
    slug: 'faq-1', cat: 'block', name: 'faq-1 折叠问答',
    from: 'ripple-site', repo: 'ripple', owner: 'adapted', source: 'React Bits Pro',
    deps: ['lucide-react'], preview: null, desc: 'React Bits Pro block,按 Ripple 改造。',
  },
  {
    slug: 'how-it-works-4', cat: 'block', name: 'how-it-works-4',
    from: 'ripple-site', repo: 'ripple', owner: 'adapted', source: 'React Bits Pro',
    deps: ['motion'], preview: null, desc: 'React Bits Pro block,按 Ripple 改造。256 行。',
  },
  {
    slug: 'waitlist-6', cat: 'block', name: 'waitlist-6 等候名单',
    from: 'ripple-site', repo: 'ripple', owner: 'adapted', source: 'React Bits Pro',
    deps: ['motion'], preview: null, desc: 'React Bits Pro block,按 Ripple 改造。',
  },
  {
    slug: 'feature-showcase', cat: 'block', name: '功能展示三件',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['motion'], preview: null,
    desc: 'feature-showcase / feature-more / page-cta —— 这三件是 Ripple 自己写的,不是 block 库来的。',
  },
  {
    slug: 'styleguide-app', cat: 'block', name: 'styleguide-app 样式指南页',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: [], preview: null,
    desc: '站内自带的样式指南页面,把 token 和组件铺出来自查。这个库的思路某种程度上就是它的放大版。',
  },

  // ───────────────────────────── 视频组件 ─────────────────────────────
  {
    slug: 'remotion-kit', cat: 'video', name: 'Remotion 组件组(6 件)',
    from: 'yorha-a2-team', repo: 'yorha', owner: 'self',
    deps: ['remotion'], preview: null,
    desc: 'Stage / Card / Arrow / Dot / SectionFade / Subtitle + theme.ts。渲染成视频,不是网页组件。',
    notes: [
      '用在「Agent 与 Subagent」科普片:9 个 section 各自组合这些原子件。',
      'Subtitle 吃 srt.ts 的时间轴数据自动打轴。',
    ],
  },

  // ───────────────────────────── 设计 token ─────────────────────────────
  {
    slug: 'toffeemoon', cat: 'token', name: 'Toffeemoon token',
    from: 'Toffeemoon Design System', repo: 'tds', owner: 'self',
    deps: [], preview: null,
    desc: 'Yuqin(--y-*,暖奶油 + 焦糖,Cormorant Garamond / Manrope)与 CommenHers(--c-*,骨白 + 叶绿,Geist)两套色彩字体 token 合一份。',
  },
  {
    slug: 'muyan', cat: 'token', name: '沐言 token',
    from: 'AI互动故事', repo: 'aistory', owner: 'self',
    deps: [], preview: null,
    desc: 'AI 互动故事的 tokens.css + base.css + type.css。上面所有「基础件组」和 Card 都吃这套。',
  },
  {
    slug: 'ripple', cat: 'token', name: 'Ripple token',
    from: 'ripple-site', repo: 'ripple', owner: 'self',
    deps: ['tailwindcss'], preview: null,
    desc: 'Tailwind 4 的 @theme 变量表:单 teal 品牌色、无状态色系。',
  },
  {
    slug: 'yuqin', cat: 'token', name: 'Yuqin 站样式',
    from: 'YUQIN', repo: 'yuqin', owner: 'self',
    deps: [], preview: null,
    desc: 'portfolio 站的完整 styles.css —— 层叠暖色背景、编辑感卡、斜切转场都在里面。',
  },
]

export const byCategory = (catId) => COMPONENTS.filter((c) => c.cat === catId)
export const bySlug = (slug) => COMPONENTS.find((c) => c.slug === slug)
