export const workCategories = [
  {
    id: "ai",
    label: {
      en: "AI Products & Systems",
      zh: "AI 产品与系统",
    },
  },
  {
    id: "frontend",
    label: {
      en: "Frontend & Visual Design",
      zh: "前端与视觉设计",
    },
  },
  {
    id: "business",
    label: {
      en: "Business & AI Adoption",
      zh: "商业与 AI 落地",
    },
  },
  {
    id: "writing",
    label: {
      en: "Writing & Narrative",
      zh: "写作与叙事",
    },
  },
];

export const workItems = [
  {
    id: "sudima",
    title: "Sudima International",
    categories: ["business"],
    type: { en: "Internship", zh: "实习" },
    role: { en: "AI adoption intern", zh: "AI adoption intern" },
    year: "2026",
    summary: {
      en: "Workflow interviews, document automation research, and AI adoption planning for trade-finance contexts.",
      zh: "围绕 trade finance 场景做 workflow 访谈、文档自动化研究和 AI adoption 规划。",
    },
    skills: ["AI workflow", "Research", "RAG planning"],
    outcome: { en: "Experience page planned", zh: "经历页待扩展" },
    status: { en: "Scaffold", zh: "框架占位" },
  },
  {
    id: "templatefill",
    title: "Trade Finance TemplateFill",
    lunarEvidenceLabel: { en: "Internship Project", zh: "实习项目" },
    categories: ["business", "ai"],
    type: { en: "Internship project", zh: "实习项目" },
    role: { en: "Research, parsing, workflow automation", zh: "研究、解析、流程自动化" },
    year: "2026",
    summary: {
      en: "A narrow tool direction for extracting trade documents into structured business templates.",
      zh: "把贸易文件提取到结构化业务模板里的窄工具方向。",
    },
    skills: ["Parsing", "Automation", "Business workflow"],
    outcome: { en: "Case study shell", zh: "案例页占位" },
    status: { en: "Prototype direction", zh: "原型方向" },
  },
  {
    id: "ai-story",
    title: "AI Interactive Story",
    lunarEvidenceLabel: { en: "Active Product", zh: "活跃产品" },
    categories: ["ai", "writing"],
    type: { en: "Product / personal project", zh: "个人产品项目" },
    role: { en: "Frontend, content system, product framing", zh: "前端、内容系统、产品 framing" },
    year: "2026",
    summary: {
      en: "A playable AI story engine with cards, memory, state, and evaluation workflows.",
      zh: "带卡片体系、记忆、状态和评估流程的 AI 互动故事引擎。",
    },
    skills: ["Product system", "Narrative design", "Frontend"],
    outcome: { en: "Core case candidate", zh: "核心案例候选" },
    status: { en: "Active", zh: "进行中" },
  },
  {
    id: "yorha",
    title: "YoRHa-A2",
    categories: ["ai"],
    type: { en: "Collaboration", zh: "协作项目" },
    role: { en: "Frontend and narrative systems collaborator", zh: "前端与叙事系统协作者" },
    year: "2026",
    summary: {
      en: "A content and service project using AI mechanisms to explain human behavior.",
      zh: "用 AI 运作机制解释人类行为的内容与服务项目。",
    },
    skills: ["AI explanation", "Frontend", "Narrative systems"],
    outcome: { en: "Collaboration record", zh: "协作记录" },
    status: { en: "Active", zh: "进行中" },
  },
  {
    id: "ripple",
    title: "Ripple",
    lunarEvidenceLabel: { en: "NAISC Workato Track", zh: "NAISC Workato 赛道" },
    categories: ["ai", "business"],
    type: { en: "Competition project", zh: "竞赛项目" },
    role: { en: "Prototype, rules visualization, pitch writing", zh: "原型、规则可视化、路演写作" },
    year: "2026",
    summary: {
      en: "An AI health companion concept and health-rule visualization from the NAISC Workato track.",
      zh: "NAISC Workato 赛道里的 AI 健康陪伴概念和健康规则可视化。",
    },
    skills: ["Prototype", "Visualization", "Pitch"],
    outcome: { en: "Completed", zh: "已结案" },
    status: { en: "Archive", zh: "归档" },
  },
  {
    id: "toffeemoon",
    title: "Toffeemoon Design System",
    categories: ["frontend"],
    type: { en: "Personal system", zh: "个人系统" },
    role: { en: "Designer and builder", zh: "设计与实现" },
    year: "2025-2026",
    summary: {
      en: "A calm editorial design system and AI-readable rule layer for personal web surfaces.",
      zh: "面向个人网站表面的安静 editorial design system 和 AI 可接手规则层。",
    },
    skills: ["Design system", "Frontend", "AI-readable rules"],
    outcome: { en: "Live 0.1 record", zh: "0.1 上线记录" },
    status: { en: "Rebuilding 1.0", zh: "1.0 重构中" },
  },
  {
    id: "yuqin",
    title: "YUQIN Portfolio",
    categories: ["frontend"],
    type: { en: "Portfolio project", zh: "作品集项目" },
    role: { en: "React + Vite, editorial UI", zh: "React + Vite、editorial UI" },
    year: "2025",
    summary: {
      en: "A warm personal portfolio surface that now folds into the Toffeemoon 1.0 site system.",
      zh: "温暖的个人作品集表面，现在并入 Toffeemoon 1.0 网站系统。",
    },
    skills: ["Editorial UI", "Bilingual copy", "Portfolio"],
    outcome: { en: "Integrated in 1.0", zh: "并入 1.0" },
    status: { en: "Integrated", zh: "已整合" },
  },
  {
    id: "commenhers",
    title: "CommenHers",
    categories: ["frontend", "business"],
    type: { en: "Client / school project", zh: "客户 / 课程项目" },
    role: { en: "Landing page, brand system, UI kit", zh: "落地页、品牌系统、UI kit" },
    year: "2025",
    summary: {
      en: "A slow-fashion brand site and design direction for a real client in an SMU project context.",
      zh: "SMU 项目语境下，为真实客户做的慢时尚品牌站点和视觉方向。",
    },
    skills: ["Brand", "Landing page", "Visual design"],
    outcome: { en: "Design case", zh: "设计案例" },
    status: { en: "Case candidate", zh: "案例候选" },
  },
  {
    id: "remotion",
    title: "Remotion Agent/Subagent Video",
    categories: ["frontend", "writing"],
    type: { en: "Motion / content project", zh: "动效 / 内容项目" },
    role: { en: "Script, motion system, AI concept explanation", zh: "脚本、动效系统、AI 概念解释" },
    year: "2026",
    summary: {
      en: "A vertical explainer video translating agent and subagent concepts into a human narrative metaphor.",
      zh: "把 agent / subagent 概念翻译成人类叙事隐喻的竖屏解释视频。",
    },
    skills: ["Motion", "Script", "AI education"],
    outcome: { en: "Motion record", zh: "动效记录" },
    status: { en: "Archive", zh: "归档" },
  },
  {
    id: "fanmou",
    title: "梵木实习",
    categories: ["writing", "frontend"],
    type: { en: "Internship", zh: "实习" },
    role: { en: "Content planning and visual communication", zh: "内容策划与视觉传播" },
    year: "2024",
    summary: {
      en: "Entertainment-content planning, poster direction, and public-account writing.",
      zh: "娱乐内容策划、海报方向和公众号写作。",
    },
    skills: ["Content", "Visual communication", "Writing"],
    outcome: { en: "Experience supplement", zh: "经历补充" },
    status: { en: "Archive", zh: "归档" },
  },
  {
    id: "cdac",
    title: "CDAC",
    categories: ["business"],
    type: { en: "Volunteer experience", zh: "义工经历" },
    role: { en: "Teaching and communication support", zh: "教学与沟通支持" },
    year: "2024",
    summary: {
      en: "A supporting experience for communication, teaching, and community-facing work.",
      zh: "补充沟通、教学和社区工作经验的经历条目。",
    },
    skills: ["Teaching", "Communication", "Community"],
    outcome: { en: "About supplement", zh: "About 补充" },
    status: { en: "Placeholder", zh: "占位" },
  },
  {
    id: "fiction",
    title: "小说 / 写作",
    categories: ["writing"],
    type: { en: "Writing collection", zh: "写作集合" },
    role: { en: "Fiction, essays, scripts, narrative experiments", zh: "小说、随笔、脚本、叙事实验" },
    year: "Ongoing",
    summary: {
      en: "The narrative layer that informs project framing, character systems, and product storytelling.",
      zh: "支撑项目 framing、角色系统和产品叙事的写作层。",
    },
    skills: ["Fiction", "Narrative", "Script"],
    outcome: { en: "Writing route", zh: "写作页入口" },
    status: { en: "Ongoing", zh: "持续中" },
  },
];

export const featuredWorkIds = [
  "ai-story",
  "templatefill",
  "ripple",
  "toffeemoon",
  "yorha",
];

export const featuredWorkItems = featuredWorkIds.map((id) => {
  const item = workItems.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing featured work item: ${id}`);
  return item;
});

export const lunarEvidenceIds = ["ripple", "templatefill", "ai-story"];
export const lunarEvidenceItems = lunarEvidenceIds.map((id) => {
  const item = workItems.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing lunar evidence work item: ${id}`);
  return item;
});
