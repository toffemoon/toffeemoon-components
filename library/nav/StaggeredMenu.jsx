// 接线 shim —— AppShell 里写的是 `import StaggeredMenu from "../StaggeredMenu"`(默认导出),
// 但真身只有具名导出。两种都补上。
import { StaggeredMenu } from './staggered-menu/StaggeredMenu.jsx'
export { StaggeredMenu }
export default StaggeredMenu
