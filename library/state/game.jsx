// 占位,不是 shim。
//
// ResumeBar 从原项目的 `src/state/game.jsx` 拿"上次读到哪"的存档。那是应用状态,
// 不是组件,收进组件库没有意义 —— 但不给它,AppShell 整棵就挂了。
// 所以这里给一个空存档:ResumeBar 会判定"没有进行中的故事"而自己收起来,
// AppShell 的主体(底部五格导航)照常。
//
// 要看 ResumeBar 展开的样子,去原项目 ai-interactive-story 跑。

export function useGame() {
  return {
    resume: null,
    current: null,
    presets: [],
    dispatch: () => {},
  }
}

export function GameProvider({ children }) {
  return children
}

export default { useGame, GameProvider }
