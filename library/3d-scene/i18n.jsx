import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { lunarHomeCopy } from "./lunarHomeCopy.js";

export const languages = {
  en: "English",
  zh: "中文",
};

export const copy = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      work: "Work & Experience",
      writing: "Writing",
      system: "System",
      contact: "Contact",
      menu: "Open navigation menu",
      close: "Close navigation menu",
      language: "Switch language to Chinese",
    },
    common: {
      concept: "Lunar signal interface",
      primaryCta: "Enter the work board",
      secondaryCta: "Read the system",
      status: "Scaffold ready",
      open: "Open",
      all: "All",
      available: "Available for selected work, writing, and AI workflow collaborations.",
      caseStudy: "Case study shell",
    },
    home: {
      eyebrow: "Toffeemoon 1.0",
      title: "Interfaces, stories, and AI systems that make complex ideas feel clear.",
      zhLine: "我把复杂的想法、流程和故事，设计成能被理解、能被使用、也能被记住的界面。",
      intro:
        "A personal entry point for frontend design, AI workflow, narrative systems, and communication work. Built as a quiet signal map, not a resume wall.",
      signalLabel: "Signal lock",
      signalText:
        "Move across the field to shift the identity object. Each route is a separate surface, not a section anchor.",
      lunar: {
        homeLabel: "Toffeemoon lunar portfolio home",
        identity: "YUQIN CHEN",
        roles: "DESIGNER · BUILDER · STORYTELLER",
        intro:
          "I design interfaces, stories, and AI systems that make complex ideas feel clear.",
        hint: "SELECT A BODY · WATCH THE SYSTEM TURN",
        projectIndex: "PROJECT INDEX",
        viewWork: "VIEW IN WORK INDEX",
        back: "BACK TO ORBIT",
        scroll: lunarHomeCopy.en,
      },
      gateways: [
        {
          key: "about",
          title: "Identity",
          body: "A compact view of education, working style, interests, and contact context.",
        },
        {
          key: "work",
          title: "Work board",
          body: "Projects, internships, collaborations, and product systems grouped by intent.",
        },
        {
          key: "writing",
          title: "Writing field",
          body: "Essays, fiction, scripts, and narrative experiments as a quieter writing surface.",
        },
        {
          key: "system",
          title: "System layer",
          body: "Design rules, AI workflows, skills, methods, and reusable operating patterns.",
        },
      ],
    },
    about: {
      eyebrow: "About",
      title: "A person-shaped interface for design, AI, writing, and communication.",
      intro:
        "The content is intentionally concise for now. The page establishes the modules that the final personal profile can grow into.",
      blocks: [
        ["Identity", "Yuqin Chen / Chen Yufei. Communication Management background, building across frontend design, AI systems, and story structure."],
        ["Education", "Singapore Management University, Communication Management. More detail can be added once the final resume copy is ready."],
        ["Skills", "Frontend UI, visual systems, AI-assisted workflows, product writing, storytelling, research synthesis."],
        ["Working style", "Structured, calm, detail-oriented, and comfortable turning messy inputs into legible systems."],
        ["Contact summary", "Open to selected portfolio, AI workflow, communication, and frontend design conversations."],
      ],
    },
    writing: {
      eyebrow: "Writing",
      title: "A quieter surface for narrative work and thinking in public.",
      intro:
        "Writing stays separate from the work board so the homepage does not become a blog. This route can expand into essays, fiction, and video scripts later.",
      tabs: ["Blog", "Essay", "Fiction", "Video script", "Narrative experiment"],
      entries: [
        ["AI metaphors", "Short scripts that translate technical systems into human situations."],
        ["Fiction collection", "Character, worldbuilding, and long-form narrative notes."],
        ["Design notes", "Small records of UI decisions, visual systems, and communication choices."],
      ],
    },
    system: {
      eyebrow: "System",
      title: "The operating layer behind the work stays visible.",
      intro:
        "This route is reserved for design tokens, AI workflow, Codex / Claude skills, project memory, and reusable methods.",
      modules: [
        ["Design system", "Tokens, typography, motion rules, accessibility defaults, and reusable layout decisions."],
        ["AI workflow", "Prompting patterns, memory structure, agent handoff rules, and evaluation habits."],
        ["Skills", "Portable execution rules for design, writing, documents, and software workflows."],
        ["Methods", "How projects move from scattered context into clear interfaces, docs, and artifacts."],
        ["Tools", "A practical map of local repos, notes, scripts, and deployment surfaces."],
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "A simple contact surface before the content gets heavier.",
      intro:
        "For now, this page keeps the contact routes clear without turning the resume into the main call to action.",
      email: "Email",
      linkedin: "LinkedIn placeholder",
      github: "GitHub placeholder",
      note:
        "Best fit: frontend design, AI workflow, portfolio systems, project storytelling, and communication-heavy product work.",
    },
  },
  zh: {
    nav: {
      home: "首页",
      about: "关于",
      work: "作品与经历",
      writing: "写作",
      system: "系统",
      contact: "联系",
      menu: "打开导航菜单",
      close: "关闭导航菜单",
      language: "切换语言为英文",
    },
    common: {
      concept: "月面信号界面",
      primaryCta: "进入作品面板",
      secondaryCta: "查看系统层",
      status: "框架已搭好",
      open: "打开",
      all: "全部",
      available: "可聊精选作品、写作、AI workflow 与前端设计协作。",
      caseStudy: "案例页占位",
    },
    home: {
      eyebrow: "Toffeemoon 1.0",
      title: "我把复杂的想法、流程和故事，设计成能被理解、能被使用、也能被记住的界面。",
      zhLine: "I design interfaces, stories, and AI systems that make complex ideas feel clear.",
      intro:
        "这是一个承载前端设计、AI workflow、叙事系统和沟通工作的个人入口。它更像安静的信号地图，而不是简历墙。",
      signalLabel: "信号锁定",
      signalText: "移动鼠标会轻微改变中心物体。每个入口都是真实路由页面，不是一页里的锚点。",
      lunar: {
        homeLabel: "Toffeemoon 月球作品集首页",
        identity: "YUQIN CHEN",
        roles: "设计师 · 构建者 · 叙事者",
        intro: "我设计界面、故事与 AI 系统，让复杂想法变得清晰。",
        hint: "选择一颗天体 · 看整个系统转动",
        projectIndex: "项目索引",
        viewWork: "在作品索引中查看",
        back: "返回轨道",
        scroll: lunarHomeCopy.zh,
      },
      gateways: [
        {
          key: "about",
          title: "身份",
          body: "教育、工作方式、兴趣和联系语境的紧凑入口。",
        },
        {
          key: "work",
          title: "作品面板",
          body: "项目、实习、协作和产品系统，按意图分组。",
        },
        {
          key: "writing",
          title: "写作场",
          body: "文章、小说、脚本和叙事实验作为更安静的写作入口。",
        },
        {
          key: "system",
          title: "系统层",
          body: "设计规则、AI workflow、skills、方法和可复用工作模式。",
        },
      ],
    },
    about: {
      eyebrow: "关于",
      title: "一个连接设计、AI、写作和沟通的个人界面。",
      intro: "当前内容先保持简洁，重点是把未来个人介绍可以扩展的模块搭好。",
      blocks: [
        ["身份", "Yuqin Chen / Chen Yufei。Communication Management 背景，工作交叉在前端设计、AI 系统和叙事结构之间。"],
        ["教育", "Singapore Management University, Communication Management。等最终简历口径确定后再补完整细节。"],
        ["技能", "Frontend UI、visual systems、AI-assisted workflows、product writing、storytelling、research synthesis。"],
        ["工作方式", "结构化、安静、重细节，擅长把杂乱输入整理成清楚系统。"],
        ["联系摘要", "适合聊精选 portfolio、AI workflow、communication 和 frontend design 相关合作。"],
      ],
    },
    writing: {
      eyebrow: "写作",
      title: "给叙事工作和公开思考留出的安静界面。",
      intro: "写作从作品面板里分离出来，避免首页变成博客。之后可以扩展成文章、小说和视频脚本入口。",
      tabs: ["博客", "随笔", "小说", "视频脚本", "叙事实验"],
      entries: [
        ["AI 概念隐喻", "把技术系统翻译成人能理解的生活场景和短脚本。"],
        ["小说集合", "角色、世界观和长篇叙事相关材料。"],
        ["设计札记", "记录 UI 决策、视觉系统和沟通方式的小笔记。"],
      ],
    },
    system: {
      eyebrow: "系统",
      title: "把作品背后的操作层也放到台前。",
      intro: "这个页面预留给 design tokens、AI workflow、Codex / Claude skills、项目记忆和可复用方法。",
      modules: [
        ["Design system", "Tokens、排版、动效规则、可访问性默认值和可复用布局决策。"],
        ["AI workflow", "Prompting patterns、记忆结构、agent handoff 规则和评估习惯。"],
        ["Skills", "面向设计、写作、文档和软件流程的可移植执行规则。"],
        ["Methods", "项目如何从散乱上下文变成清晰界面、文档和 artifact。"],
        ["Tools", "本地 repo、笔记、脚本和部署面的实用地图。"],
      ],
    },
    contact: {
      eyebrow: "联系",
      title: "先保持轻量，把联系路径说清楚。",
      intro: "当前页面优先搭 UI 和信息架构，不把 resume download 作为主 CTA。",
      email: "邮箱",
      linkedin: "LinkedIn 占位",
      github: "GitHub 占位",
      note: "适合联系：frontend design、AI workflow、portfolio systems、project storytelling 和重沟通的产品工作。",
    },
  },
};

const I18nContext = createContext(null);

function readInitialLanguage() {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem("toffeemoon-language");
  return saved === "zh" || saved === "en" ? saved : "en";
}

function readPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(readInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem("toffeemoon-language", language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const value = useMemo(() => {
    const t = (path) => readPath(copy[language], path) ?? path;
    const pick = (entry) => entry?.[language] ?? entry?.en ?? entry;
    const toggleLanguage = () => setLanguage((current) => (current === "en" ? "zh" : "en"));
    return { language, setLanguage, toggleLanguage, t, pick };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
